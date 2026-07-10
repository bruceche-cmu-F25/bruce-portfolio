'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// DEBUG: when true, render the raw model with environment light only —
// no core point light, no bloom, no color grade, no material overrides —
// and enable drag-to-orbit so we can find the camera angle. Set false to
// restore the full lit + graded intro.
const DEBUG_BARE = false

// Approach (b): recolor the ring albedo texture in-memory at load — desaturate
// the baked red/green bands and remap luminance onto a warm gold ramp, so the
// model looks right under plain lighting without a fragile post-grade. The
// original .glb on disk is never modified. Set false to see the raw texture.
const GOLDIFY_RINGS = false

// Show an on-screen slider panel (dev only) for tuning the grade/bloom/lights
// live, with a button that copies the current values so they can be baked in.
const SHOW_PANEL = false

// Enable drag-to-orbit on the FULL lit/graded model (independent of DEBUG_BARE)
// so the camera angle can be found interactively; the panel's COPY captures the
// resulting camera. Set false to lock the fixed hero camera + scroll dolly.
const ORBIT = false

type Phase = 'loading' | 'ready' | 'dive' | 'boot' | 'cli' | 'done'

const BOOT_LINES = [
  '**** BRUCE OS 64 — BASIC V2 ****',
  '64K RAM SYSTEM  38911 BASIC BYTES FREE',
  '',
  'LOAD "PORTFOLIO",8,1',
  'SEARCHING FOR PORTFOLIO',
  'FOUND BRUCE.CHENG',
  '',
  'READY.',
]

const CLI_HELP = [
  'AVAILABLE COMMANDS:',
  '  RUN       LAUNCH PORTFOLIO',
  '  PROJECTS  RECENT WORK',
  '  WHOAMI    ABOUT ME',
  '  CONTACT   REACH OUT',
  '  CLEAR     CLEAR SCREEN',
]

export default function SpaceIntro() {
  const rootRef  = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [progress, setProgress] = useState(0)
  const actions = useRef<{ enter?: () => void; skip?: () => void }>({})

  useEffect(() => {
    let finished = false
    let disposed = false
    let raf = 0
    const tweens: gsap.core.Animation[] = []
    let teardownFn: () => void = () => {}

    const finish = () => {
      if (finished) return
      finished = true
      document.dispatchEvent(new Event('loaderDone'))
      killScroll()
      tweens.forEach(t => t.kill())
      const root = rootRef.current
      if (root) {
        gsap.to(root, {
          autoAlpha: 0, duration: 0.9, ease: 'power2.out',
          onComplete: () => {
            setPhase('done')
            teardownFn()
            // the 240vh scroll track unmounts with the intro — land at the top of the page
            window.scrollTo(0, 0)
          },
        })
      } else {
        setPhase('done')
        teardownFn()
        window.scrollTo(0, 0)
      }
    }
    actions.current.skip = finish

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch {
      finish()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.85
    renderer.setClearColor(0x000000, 1)
    mountRef.current?.appendChild(renderer.domElement)

    // studio-style environment lighting, same role as Sketchfab's default env
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()

    /* ---------- shared state ---------- */
    const clock = new THREE.Clock()
    const spin = { hole: 0.06 }
    let holeGroup: THREE.Group | null = null
    let killScroll: () => void = () => {}
    let dbgControls: TrackballControls | null = null // free-tumble controls (ORBIT / DEBUG_BARE)
    let panelEl: HTMLElement | null = null // dev tuning panel

    /* terminal state */
    type Mode = 'off' | 'boot' | 'cli' | 'launch'
    let mode: Mode = 'off'
    let screenTex: THREE.CanvasTexture | null = null
    let screenCtx: CanvasRenderingContext2D | null = null
    let screenLight: THREE.PointLight | null = null
    const term: string[] = []
    let input = ''
    let bootIdx = 0
    let bootChar = 0
    let bootTimer = 0

    const makeStars = (count: number, opacity: number) => {
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const r = 220 + Math.random() * 680
        const th = Math.random() * Math.PI * 2
        const ph = Math.acos(2 * Math.random() - 1)
        pos[i * 3]     = r * Math.sin(ph) * Math.cos(th)
        pos[i * 3 + 1] = r * Math.cos(ph)
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({
        color: 0xffffff, size: 1.4, sizeAttenuation: true,
        transparent: true, opacity, depthWrite: false,
      })
      return new THREE.Points(geo, mat)
    }

    const normalize = (obj: THREE.Object3D, targetSize: number) => {
      const box = new THREE.Box3().setFromObject(obj)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const group = new THREE.Group()
      obj.position.sub(center)
      group.add(obj)
      group.scale.setScalar(targetSize / Math.max(size.x, size.y, size.z))
      return group
    }

    // Recolor a ring albedo: desaturate the baked bands and remap luminance onto
    // a warm ramp (near-black shadow → amber mid → pale-gold highlight). Returns a
    // fresh CanvasTexture; the source texture/image is left untouched.
    const smoother = (e0: number, e1: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
      return t * t * (3 - 2 * t)
    }
    const goldifyTexture = (tex: THREE.Texture): THREE.Texture => {
      const img = tex.image as CanvasImageSource & { width: number; height: number }
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = id.data
      const SH = [0.05, 0.03, 0.015] // shadow (dark warm)
      const MD = [0.85, 0.55, 0.2]   // mid (amber gold)
      const HI = [1.0, 0.93, 0.78]   // highlight (pale gold)
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
        const s1 = smoother(0, 0.5, l)
        const s2 = smoother(0.5, 0.95, l)
        for (let k = 0; k < 3; k++) {
          const lowMid = SH[k] + (MD[k] - SH[k]) * s1
          d[i + k] = Math.round((lowMid + (HI[k] - lowMid) * s2) * 255)
        }
      }
      ctx.putImageData(id, 0, 0)
      const out = new THREE.CanvasTexture(canvas)
      out.colorSpace = tex.colorSpace
      out.flipY = tex.flipY
      out.wrapS = tex.wrapS
      out.wrapT = tex.wrapT
      out.repeat.copy(tex.repeat)
      out.offset.copy(tex.offset)
      out.center.copy(tex.center)
      out.rotation = tex.rotation
      out.needsUpdate = true
      return out
    }

    /* ---------- load ---------- */
    const manager = new THREE.LoadingManager()
    manager.onProgress = (_url, loaded, total) => {
      setProgress(Math.min(99, Math.round((loaded / Math.max(total, 1)) * 100)))
    }
    const draco = new DRACOLoader(manager).setDecoderPath('/draco/')
    const loader = new GLTFLoader(manager).setDRACOLoader(draco)
    const load = (url: string) => new Promise<GLTF>((res, rej) => loader.load(url, res, undefined, rej))

    const scene1 = new THREE.Scene()
    const scene2 = new THREE.Scene()
    const camera1 = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 2000)
    const camera2 = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 2000)

    // GEOMETRY-LOCKED radial grade. Instead of a screen-space post pass (which
    // slides against the disk as the camera dollies), the grade lives IN the ring
    // material and is keyed on the fragment's WORLD radius from the hole (the disk
    // lies flat in world XZ, centred at origin). So it's baked to the disk itself:
    // near the hole = original colourful; farther out = desaturated, gold, darker.
    // Shared uniforms so both ring materials and the dev panel drive the same set.
    const diskGrade = {
      uRInner:    { value: 7 },    // world radius: within → fully original colour
      uROuter:    { value: 29 },   // world radius: beyond → fully graded (dark gold)
      uDesatNear: { value: 0.12 },
      uDesatFar:  { value: 0.62 },
      uDarkFar:   { value: 0.36 }, // brightness multiplier at the rim
      uSatBoost:  { value: 1.28 },
      uGold:      { value: new THREE.Color(1.3, 0.88, 0.3) },
      uGain:      { value: 1.18 }, // overall disk brightness (all rings, incl. the mid ones)
    }
    const applyDiskGrade = (mat: THREE.MeshStandardMaterial) => {
      mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, diskGrade)
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec2 vGradeXZ;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGradeXZ = (modelMatrix * vec4(transformed, 1.0)).xz;')
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>
            varying vec2 vGradeXZ;
            uniform float uRInner; uniform float uROuter;
            uniform float uDesatNear; uniform float uDesatFar;
            uniform float uDarkFar; uniform float uSatBoost; uniform vec3 uGold; uniform float uGain;`)
          .replace('#include <map_fragment>', `#include <map_fragment>
            {
              float far = smoothstep(uRInner, uROuter, length(vGradeXZ));
              float l = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
              vec3 g = mix(diffuseColor.rgb, vec3(l), mix(uDesatNear, uDesatFar, far));
              float l2 = dot(g, vec3(0.2126, 0.7152, 0.0722));
              g = max(mix(vec3(l2), g, uSatBoost), 0.0);
              g *= mix(vec3(1.0), uGold, far);
              g *= mix(1.0, uDarkFar, far);
              diffuseColor.rgb = g * uGain;
            }`)
      }
      mat.needsUpdate = true
    }

    const res = new THREE.Vector2(window.innerWidth, window.innerHeight)
    const composer1 = new EffectComposer(renderer)
    composer1.addPass(new RenderPass(scene1, camera1))
    const bloom1 = new UnrealBloomPass(res.clone(), 0.42, 0.16, 0)
    if (!DEBUG_BARE) composer1.addPass(bloom1)
    composer1.addPass(new OutputPass())
    const composer2 = new EffectComposer(renderer)
    composer2.addPass(new RenderPass(scene2, camera2))
    composer2.addPass(new UnrealBloomPass(res.clone(), 0.35, 0.4, 0.85))
    composer2.addPass(new OutputPass())
    let activeComposer = composer1

    /* scene-2 targets, computed after the C64 loads */
    const screenCenter = new THREE.Vector3()
    const screenNormal = new THREE.Vector3(0, 0, 1)
    let dollyEndDist = 3

    /* planet vantage — the planet orbits with the rotating group, so track the mesh itself */
    let planetMeshRef: THREE.Mesh | null = null
    let planetRadius = 0

    Promise.all([load('/models/black_hole.glb'), load('/models/commodore_64.glb')])
      .then(([hole, c64]) => {
        if (finished || disposed) return

        /* ----- scene 1: black hole ----- */
        // starfield visible at the far establishing shot; fades out on approach
        const starField = makeStars(2600, 0.9)
        scene1.add(starField)
        const starMat = starField.material as THREE.PointsMaterial

        // Sketchfab's "Final Render" = authored materials (albedo/spec/emission as-is)
        // + studio environment lighting + bloom post-processing. Keep the materials
        // untouched and reproduce the env + post instead.
        // keep env light low: the core point light's inverse-square falloff is what
        // makes the rings darken outward — uniform env light flattens that gradient
        scene1.environment = envMap
        // bare mode: dim neutral env — matches the official model's already-dark
        // base (its saturated red/green bands are baked into the ring albedo, not
        // added by light; env=1.0 just blows them out). lit mode adds the core light.
        ;(scene1 as any).environmentIntensity = DEBUG_BARE ? 0.3 : 0.2
        // a warm point light at the singularity does the heavy lifting: its inverse-square
        // falloff makes the inner disk blaze and the outer rings fade to dark amber
        const coreLight = new THREE.PointLight(0xffc46f, 410, 0, 1.0)
        if (!DEBUG_BARE) scene1.add(coreLight)
        // horizon spheres stay pure black — no env reflection; light bands are dimmed
        const NO_ENV = ['black_hole_center', 'black_hole_distortion', 'black_hole_blackoutside']
        const BANDS = ['black_hole_light1', 'black_hole_light2', 'black_hole_light3']
        // the disk's spec/gloss survived conversion as KHR_materials_specular;
        // give the rings extra env reflection so that sheen actually shows
        const RINGS = ['ring', 'ring2']
        const bandMats: Record<string, THREE.MeshStandardMaterial> = {}
        if (!DEBUG_BARE) hole.scene.traverse(o => {
          const m = o as THREE.Mesh
          if (!m.isMesh) return
          const mat = m.material as THREE.MeshStandardMaterial
          if (!mat || !(mat as any).isMeshStandardMaterial) return
          if (BANDS.includes(mat.name)) bandMats[mat.name] = mat
          if (NO_ENV.includes(mat.name)) mat.envMapIntensity = 0
          // ONE clean occluder: make `black_hole_center` a solid opaque black
          // sphere so it hides the disk directly behind the hole with a smooth
          // silhouette. (Authored as semi-transparent w/ specular → showed brown.)
          if (mat.name === 'black_hole_center') {
            mat.color.setRGB(0, 0, 0)
            mat.emissive?.setRGB(0, 0, 0)
            mat.transparent = false
            mat.opacity = 1
            mat.depthWrite = true
            mat.metalness = 0
            mat.roughness = 1
            const pm = mat as unknown as { specularIntensity?: number; specularColor?: THREE.Color }
            if (pm.specularIntensity !== undefined) pm.specularIntensity = 0
            pm.specularColor?.setRGB(0, 0, 0)
          }
          // `blackoutside` is a black alpha-MASK shell: its filigree (alphaCutoff
          // ~0.79) was punching the "missing chunks" into the disk behind it. Make
          // it a SOLID opaque black shell (alphaTest 0) so it still occludes the
          // back of the disk cleanly but without the per-fragment holes.
          if (mat.name === 'black_hole_blackoutside') {
            mat.color.setRGB(0, 0, 0)
            mat.emissive?.setRGB(0, 0, 0)
            mat.alphaTest = 0
            mat.transparent = false
            mat.opacity = 1
            mat.depthWrite = true
          }
          // light1 = the bright blue-white photon ring hugging the horizon (the
          // "key" bright band); light2/3 = the warmer lensed arcs above it. Push
          // light1 hard so bloom blazes it; keep the others moderate.
          if (mat.name === 'black_hole_light1') mat.emissiveIntensity = 7.2
          if (mat.name === 'black_hole_light2') mat.emissiveIntensity = 0.0
          if (mat.name === 'black_hole_light3') m.visible = false // the red edge arc — removed
          if (RINGS.includes(mat.name)) { mat.envMapIntensity = 0.8; applyDiskGrade(mat) }
          mat.needsUpdate = true
        })

        // approach (b): recolor the disk. `ring`/`ring2` carry the colored bands in
        // their albedo map; `light1/2/3` carry the bright rainbow arcs near the hole
        // in their EMISSIVE map. Remap both onto the gold ramp. (Runs in bare mode.)
        const doneMat = new Set<THREE.Material>()
        if (GOLDIFY_RINGS) hole.scene.traverse(o => {
          const m = o as THREE.Mesh
          if (!m.isMesh) return
          const mat = m.material as THREE.MeshStandardMaterial
          if (!mat || doneMat.has(mat)) return // materials are shared across primitives
          doneMat.add(mat)
          if ((RINGS.includes(mat.name) || BANDS.includes(mat.name)) && mat.map) {
            mat.map = goldifyTexture(mat.map)
            mat.color.setRGB(1, 1, 1) // baseColorFactor was a 0.5 grey multiplier
          }
          if (BANDS.includes(mat.name) && mat.emissiveMap) {
            mat.emissiveMap = goldifyTexture(mat.emissiveMap)
            mat.emissive.setRGB(1, 1, 1)
          }
          mat.needsUpdate = true
        })

        holeGroup = normalize(hole.scene, 64)
        scene1.add(holeGroup)
        holeGroup.updateMatrixWorld(true)

        // ── lay the accretion disk flat in the world XZ plane ──
        // the model isn't authored axis-aligned, so spinning around world Y made
        // it wobble. Find the ring's plane normal (its thin geometry axis) and
        // rotate the whole group so that normal points straight up (+Y). Now
        // rotation.y is a clean in-plane spin and the camera framing is predictable.
        let ringMesh: THREE.Mesh | null = null
        holeGroup.traverse(o => {
          const m = o as THREE.Mesh
          if (m.isMesh && (m.material as THREE.Material)?.name === 'ring') ringMesh = m
        })
        if (ringMesh) {
          const rm = ringMesh as THREE.Mesh
          rm.geometry.computeBoundingBox()
          const s = rm.geometry.boundingBox!.getSize(new THREE.Vector3())
          // thinnest local axis = disk normal
          const localNormal =
            s.x <= s.y && s.x <= s.z ? new THREE.Vector3(1, 0, 0)
            : s.y <= s.x && s.y <= s.z ? new THREE.Vector3(0, 1, 0)
            : new THREE.Vector3(0, 0, 1)
          const worldNormal = localNormal.transformDirection(rm.matrixWorld).normalize()
          const q = new THREE.Quaternion().setFromUnitVectors(worldNormal, new THREE.Vector3(0, 1, 0))
          holeGroup.quaternion.premultiply(q)
          holeGroup.updateMatrixWorld(true)
        }

        let planetMesh: THREE.Mesh | null = null
        holeGroup.traverse(o => {
          const m = o as THREE.Mesh
          if (!m.isMesh) return
          if ((m.material as THREE.Material)?.name === 'Planet') planetMesh = m
        })
        if (planetMesh) {
          const pSphere = new THREE.Sphere()
          new THREE.Box3().setFromObject(planetMesh).getBoundingSphere(pSphere)
          planetRadius = pSphere.radius
          if (planetRadius > 0.01) {
            planetMeshRef = planetMesh
            // detach from the spinning group so the dive path can't collide with it
            scene1.attach(planetMesh)
          }
        }

        // two camera keyframes (found by tumbling): a FAR establishing shot in deep
        // space → the NEAR hero framing. Scroll dollies between them. The disk grade
        // is world-locked so it stays correct across the whole move.
        const camFar  = new THREE.Vector3(253.8, 76, 1073.4)
        const upFar   = new THREE.Vector3(-0.4, 0.7, 0.5).normalize()
        const tgtFar  = new THREE.Vector3(21.2, -11.4, -14.6)
        const camNear = new THREE.Vector3(-1.2, 2.2, 22.4)
        const upNear  = new THREE.Vector3(-0.28, 1, 0.03).normalize()
        const tgtNear = new THREE.Vector3(22, -5.2, -10.5)
        const camSettle = camNear.clone().add(new THREE.Vector3(0.18, -0.06, -0.38))
        const upSettle  = upNear.clone().add(new THREE.Vector3(-0.008, 0, 0.003)).normalize()
        const tgtSettle = tgtNear.clone().add(new THREE.Vector3(0.45, 0.18, -0.18))
        const lookTarget = tgtNear // panel/trackball reference (tunes the near framing)
        camera1.up.copy(upFar)
        camera1.position.copy(camFar)
        camera1.lookAt(tgtFar)

        // DEBUG: free-tumble the whole view (no up-vector lock, so the disk can be
        // tilted to any diagonal). The panel's COPY captures the full camera state
        // (position + up + target). No scroll dolly while tumbling.
        if (DEBUG_BARE || ORBIT) {
          const tb = new TrackballControls(camera1, renderer.domElement)
          tb.target.copy(lookTarget)
          tb.rotateSpeed = 3.0
          tb.staticMoving = false
          tb.dynamicDampingFactor = 0.15
          tb.update()
          dbgControls = tb
          let logT = 0
          tb.addEventListener('change', () => {
            const now = Date.now()
            if (now - logT < 250) return
            logT = now
            const p = camera1.position, up = camera1.up, tg = tb.target
            const f = (n: number) => n.toFixed(1)
            // eslint-disable-next-line no-console
            console.log(
              `pos(${f(p.x)}, ${f(p.y)}, ${f(p.z)}) up(${f(up.x)}, ${f(up.y)}, ${f(up.z)}) target(${f(tg.x)}, ${f(tg.y)}, ${f(tg.z)})`,
            )
          })
        }

        /* scroll-driven dolly: interpolate camera position + up + target from the
           far establishing shot to the near hero framing; fade the stars out and
           the name in as we approach. */
        const _cp = new THREE.Vector3(), _cu = new THREE.Vector3(), _ct = new THREE.Vector3()
        const _sp = new THREE.Vector3(), _su = new THREE.Vector3(), _st = new THREE.Vector3()
        const dolly = { u: 0 }
        let announced = false
        const APPROACH_END = 0.86
        const SITE_READY_AT = 0.975
        const scrollTween = gsap.to(dolly, {
          u: 1, ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.15,
          },
          onUpdate: () => {
            if (DEBUG_BARE || ORBIT) return // let TrackballControls drive the camera
            const approachT = Math.min(1, dolly.u / APPROACH_END)
            const cameraU = 1 - Math.pow(1 - approachT, 2.4)
            const settleU = smoother(APPROACH_END, SITE_READY_AT, dolly.u)
            _sp.lerpVectors(camNear, camSettle, settleU)
            _su.lerpVectors(upNear, upSettle, settleU).normalize()
            _st.lerpVectors(tgtNear, tgtSettle, settleU)
            camera1.position.copy(_cp.lerpVectors(camFar, _sp, cameraU))
            camera1.up.copy(_cu.lerpVectors(upFar, _su, cameraU).normalize())
            _ct.lerpVectors(tgtFar, _st, cameraU)
            camera1.lookAt(_ct)
            starMat.opacity = 0.9 * (1 - smoother(0.35, 0.8, cameraU)) // fade stars on approach
            if (titleRef.current) {
              titleRef.current.style.opacity = String(smoother(0.2, 0.6, cameraU)) // fade name in
            }
            if (!announced && dolly.u > SITE_READY_AT) {
              announced = true
              document.dispatchEvent(new Event('loaderDone'))
            }
          },
        })
        tweens.push(scrollTween)
        killScroll = () => scrollTween.scrollTrigger?.kill()

        /* ----- scene 2: the computer inside the singularity ----- */
        scene2.add(makeStars(1400, 0.35))
        scene2.environment = envMap
        ;(scene2 as any).environmentIntensity = 0.35
        scene2.add(new THREE.AmbientLight(0x8899bb, 0.5))
        const key = new THREE.DirectionalLight(0xffe8cc, 1.8)
        key.position.set(14, 22, 18)
        scene2.add(key)
        const rim = new THREE.PointLight(0x66d9ff, 900, 0, 2)
        rim.position.set(-18, 10, -20)
        scene2.add(rim)

        const c64Group = normalize(c64.scene, 26)
        scene2.add(c64Group)
        c64Group.updateMatrixWorld(true)

        let screenMesh: THREE.Mesh | null = null
        c64Group.traverse(o => {
          const m = o as THREE.Mesh
          if (m.isMesh && (m.material as THREE.Material)?.name === 'monitor_screen') screenMesh = m
        })

        if (screenMesh) {
          const sm = screenMesh as THREE.Mesh
          new THREE.Box3().setFromObject(sm).getCenter(screenCenter)

          // average the geometry normals in world space to get the screen's facing direction
          const nAttr = sm.geometry.attributes.normal as THREE.BufferAttribute
          const nm = new THREE.Matrix3().getNormalMatrix(sm.matrixWorld)
          const acc = new THREE.Vector3()
          const tmp = new THREE.Vector3()
          const step = Math.max(1, Math.floor(nAttr.count / 500))
          for (let i = 0; i < nAttr.count; i += step) {
            acc.add(tmp.fromBufferAttribute(nAttr, i).applyMatrix3(nm))
          }
          if (acc.lengthSq() > 1e-6) screenNormal.copy(acc.normalize())
          // the screen faces away from the rest of the pack
          const away = screenCenter.clone().setY(0)
          if (away.lengthSq() > 1e-4 && screenNormal.dot(away.normalize()) < 0) screenNormal.negate()
          screenNormal.y = 0
          screenNormal.normalize()

          const canvas = document.createElement('canvas')
          canvas.width = 1024
          canvas.height = 768
          screenCtx = canvas.getContext('2d')
          screenTex = new THREE.CanvasTexture(canvas)
          screenTex.flipY = false // glTF UV convention
          screenTex.colorSpace = THREE.SRGBColorSpace
          sm.material = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
          drawScreen(0)

          screenLight = new THREE.PointLight(0x66ff88, 60, 0, 2)
          screenLight.position.copy(screenCenter).addScaledVector(screenNormal, 3)
          scene2.add(screenLight)

          const sBox = new THREE.Box3().setFromObject(sm)
          const sH = sBox.getSize(new THREE.Vector3()).y
          dollyEndDist = (sH * 1.12) / (2 * Math.tan(THREE.MathUtils.degToRad(camera2.fov / 2)))
        }

        // dev-only live tuning: tweak from the browser console without reloading, e.g.
        //   __space.grade.highlightTint.value.setRGB(1.3, 0.9, 0.4)
        //   __space.grade.desat.value = 0.9
        //   __space.coreLight.intensity = 300
        //   __space.bloom.strength = 0.7
        //   __space.scene.environmentIntensity = 0.5
        if (process.env.NODE_ENV !== 'production') {
          ;(window as any).__space = {
            grade: diskGrade,
            coreLight,
            bloom: bloom1,
            scene: scene1,
          }
        }

        // ── on-screen dev tuning panel (sliders + copy button) ──
        if (process.env.NODE_ENV !== 'production' && SHOW_PANEL && !DEBUG_BARE) {
          const u = diskGrade
          type Row = { label: string; min: number; max: number; step: number; get: () => number; set: (v: number) => void }
          const rows: Row[] = [
            { label: 'cam X',      min: -50, max: 50,  step: 0.5,  get: () => camNear.x, set: v => { camNear.x = v } },
            { label: 'cam Y',      min: -50, max: 50,  step: 0.5,  get: () => camNear.y, set: v => { camNear.y = v } },
            { label: 'cam Z',      min: 0,   max: 80,  step: 0.5,  get: () => camNear.z, set: v => { camNear.z = v } },
            { label: 'look X',     min: -50, max: 50,  step: 0.5,  get: () => lookTarget.x, set: v => { lookTarget.x = v } },
            { label: 'look Y',     min: -50, max: 50,  step: 0.5,  get: () => lookTarget.y, set: v => { lookTarget.y = v } },
            { label: 'look Z',     min: -50, max: 50,  step: 0.5,  get: () => lookTarget.z, set: v => { lookTarget.z = v } },
            { label: 'bloom str',  min: 0,   max: 1,   step: 0.01, get: () => bloom1.strength, set: v => { bloom1.strength = v } },
            { label: 'bloom rad',  min: 0,   max: 1,   step: 0.01, get: () => bloom1.radius, set: v => { bloom1.radius = v } },
            { label: 'bloom thr',  min: 0,   max: 1,   step: 0.01, get: () => bloom1.threshold, set: v => { bloom1.threshold = v } },
            { label: 'core light', min: 0,   max: 600, step: 5,    get: () => coreLight.intensity, set: v => { coreLight.intensity = v } },
            { label: 'env',        min: 0,   max: 1.5, step: 0.01, get: () => (scene1 as any).environmentIntensity ?? 1, set: v => { (scene1 as any).environmentIntensity = v } },
            { label: 'exposure',   min: 0.3, max: 1.5, step: 0.01, get: () => renderer.toneMappingExposure, set: v => { renderer.toneMappingExposure = v } },
            { label: 'disk gain',  min: 0.2, max: 3,   step: 0.02, get: () => u.uGain.value, set: v => { u.uGain.value = v } },
            { label: 'light1 emis',min: 0,   max: 8,   step: 0.1,  get: () => bandMats.black_hole_light1?.emissiveIntensity ?? 0, set: v => { if (bandMats.black_hole_light1) bandMats.black_hole_light1.emissiveIntensity = v } },
            { label: 'light2 emis',min: 0,   max: 8,   step: 0.1,  get: () => bandMats.black_hole_light2?.emissiveIntensity ?? 0, set: v => { if (bandMats.black_hole_light2) bandMats.black_hole_light2.emissiveIntensity = v } },
            { label: 'light3 emis',min: 0,   max: 8,   step: 0.1,  get: () => bandMats.black_hole_light3?.emissiveIntensity ?? 0, set: v => { if (bandMats.black_hole_light3) bandMats.black_hole_light3.emissiveIntensity = v } },
            { label: 'rInner',     min: 0,   max: 30,  step: 0.5,  get: () => u.uRInner.value, set: v => { u.uRInner.value = v } },
            { label: 'rOuter',     min: 5,   max: 45,  step: 0.5,  get: () => u.uROuter.value, set: v => { u.uROuter.value = v } },
            { label: 'desatNear',  min: 0,   max: 1,   step: 0.01, get: () => u.uDesatNear.value, set: v => { u.uDesatNear.value = v } },
            { label: 'desatFar',   min: 0,   max: 1,   step: 0.01, get: () => u.uDesatFar.value, set: v => { u.uDesatFar.value = v } },
            { label: 'darkFar',    min: 0,   max: 1,   step: 0.01, get: () => u.uDarkFar.value, set: v => { u.uDarkFar.value = v } },
            { label: 'satBoost',   min: 0.5, max: 2,   step: 0.01, get: () => u.uSatBoost.value, set: v => { u.uSatBoost.value = v } },
            { label: 'gold R',     min: 0,   max: 1.5, step: 0.01, get: () => u.uGold.value.r, set: v => { u.uGold.value.r = v } },
            { label: 'gold G',     min: 0,   max: 1.5, step: 0.01, get: () => u.uGold.value.g, set: v => { u.uGold.value.g = v } },
            { label: 'gold B',     min: 0,   max: 1.5, step: 0.01, get: () => u.uGold.value.b, set: v => { u.uGold.value.b = v } },
          ]

          const panel = document.createElement('div')
          panel.style.cssText = 'position:fixed;top:12px;left:12px;z-index:100000;width:250px;max-height:92vh;overflow:auto;' +
            'background:rgba(8,10,18,0.92);border:1px solid rgba(120,160,255,0.35);border-radius:8px;padding:10px;' +
            "font-family:'JetBrains Mono',monospace;font-size:11px;color:#cdd6ff;backdrop-filter:blur(6px);"
          const head = document.createElement('div')
          head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:700;letter-spacing:0.08em;'
          const title = document.createElement('span'); title.textContent = 'BLACK HOLE TUNER'
          const copyBtn = document.createElement('button')
          copyBtn.textContent = 'COPY'
          copyBtn.style.cssText = 'cursor:pointer;font:inherit;color:#7ef0c8;background:rgba(0,196,167,0.1);border:1px solid rgba(0,196,167,0.5);border-radius:4px;padding:2px 8px;'
          head.append(title, copyBtn); panel.append(head)

          const valSpans: Record<string, HTMLSpanElement> = {}
          for (const r of rows) {
            const row = document.createElement('label')
            row.style.cssText = 'display:grid;grid-template-columns:70px 1fr 42px;gap:6px;align-items:center;margin:3px 0;'
            const name = document.createElement('span'); name.textContent = r.label
            const slider = document.createElement('input')
            slider.type = 'range'; slider.min = String(r.min); slider.max = String(r.max); slider.step = String(r.step)
            slider.value = String(r.get()); slider.style.width = '100%'
            const val = document.createElement('span'); val.textContent = r.get().toFixed(2); val.style.textAlign = 'right'
            valSpans[r.label] = val
            slider.addEventListener('input', () => { const v = parseFloat(slider.value); r.set(v); val.textContent = v.toFixed(2) })
            row.append(name, slider, val); panel.append(row)
          }

          copyBtn.addEventListener('click', () => {
            const g = (l: string) => rows.find(r => r.label === l)!.get()
            // read the LIVE camera (so the tumbled framing + roll are captured, not the sliders)
            const cp = camera1.position, up = camera1.up
            const tg = dbgControls ? dbgControls.target : lookTarget
            const f = (n: number) => n.toFixed(1)
            const text =
`// camera
const lookTarget = new THREE.Vector3(${f(tg.x)}, ${f(tg.y)}, ${f(tg.z)})
camera1.up.set(${f(up.x)}, ${f(up.y)}, ${f(up.z)})
camera1.position.set(${f(cp.x)}, ${f(cp.y)}, ${f(cp.z)})
camera1.lookAt(lookTarget)
// bloom
const bloom1 = new UnrealBloomPass(res.clone(), ${g('bloom str')}, ${g('bloom rad')}, ${g('bloom thr')})
// core light intensity: ${g('core light')} , env: ${g('env')} , disk gain: ${g('disk gain')}
// emissive: light1 ${g('light1 emis')}, light2 ${g('light2 emis')}, light3 ${g('light3 emis')}
// grade uniforms
rInner ${g('rInner')}, rOuter ${g('rOuter')}, desatNear ${g('desatNear')}, desatFar ${g('desatFar')}, darkFar ${g('darkFar')}, satBoost ${g('satBoost')}
goldTint (${g('gold R')}, ${g('gold G')}, ${g('gold B')})`
            navigator.clipboard?.writeText(text).then(
              () => { copyBtn.textContent = 'COPIED ✓'; setTimeout(() => { copyBtn.textContent = 'COPY' }, 1200) },
              () => { copyBtn.textContent = 'see console'; console.log(text) },
            )
          })

          document.body.appendChild(panel)
          panelEl = panel
        }

        setPhase('ready')
        setProgress(100)
        requestAnimationFrame(() => {
          ScrollTrigger.refresh()
          ScrollTrigger.update()
        })
      })
      .catch(err => {
        if (disposed) return
        console.error('SpaceIntro: failed to load models', err)
        finish()
      })

    /* ---------- terminal ---------- */
    const ROWS = 10
    const pushLines = (...ls: string[]) => {
      term.push(...ls)
      if (term.length > 200) term.splice(0, term.length - 200)
    }

    const launch = () => {
      pushLines('LOADING PORTFOLIO . . .')
      mode = 'launch'
      setTimeout(finish, 900)
    }

    const execute = () => {
      const cmd = input.trim().toUpperCase()
      pushLines('> ' + input)
      input = ''
      if (cmd === '' || cmd === 'RUN' || cmd === 'ENTER' || cmd === 'START') { launch(); return }
      switch (cmd) {
        case 'HELP': case '?':
          pushLines(...CLI_HELP); break
        case 'PROJECTS': case 'LS':
          pushLines('NIGHTYNIGHT.TSX    RESEARCH-AGENT.TS', 'CAPITAWISE.TS      PARKING-LOCATOR.PY', 'TYPE "RUN" TO SEE THEM ALL'); break
        case 'WHOAMI': case 'ABOUT':
          pushLines('BRUCE CHENG', 'SOFTWARE ENGINEER · AI BUILDER', 'MS @ CMU SILICON VALLEY'); break
        case 'CONTACT': case 'EMAIL':
          pushLines('BRUCECHE@ANDREW.CMU.EDU', 'GITHUB.COM/BRUCECHE-CMU-F25'); break
        case 'CLEAR': case 'CLS':
          term.length = 0; break
        case 'SUDO':
          pushLines('NICE TRY.'); break
        default:
          pushLines('?SYNTAX ERROR')
      }
    }

    const finishBoot = () => {
      for (; bootIdx < BOOT_LINES.length; bootIdx++) pushLines(BOOT_LINES[bootIdx])
      mode = 'cli'
      setPhase('cli')
    }

    function drawScreen(t: number) {
      if (!screenCtx || !screenTex) return
      const ctx = screenCtx
      const W = 1024, H = 768
      // compensate the monitor mesh's rotated/flipped UVs: content x → texture -y, content y → texture -x
      ctx.setTransform(0, -H / W, -W / H, 0, W, H)
      ctx.fillStyle = '#071204'
      ctx.fillRect(0, 0, W, H)
      ctx.save()
      ctx.font = 'bold 30px "JetBrains Mono", "Courier New", monospace'
      ctx.fillStyle = '#86ff9e'
      ctx.shadowColor = '#3aff6b'
      ctx.shadowBlur = 14
      // the glass only shows texture rows below ~v=210 — keep text inside that window
      const x0 = 64, y0 = 262, lh = 44

      let active = ''
      if (mode === 'boot') active = BOOT_LINES[bootIdx]?.slice(0, bootChar) ?? ''
      else if (mode === 'cli') active = '> ' + input
      const history = term.slice(-(ROWS - 1))
      const rows = [...history, active]
      rows.forEach((line, i) => ctx.fillText(line, x0, y0 + i * lh))

      if (mode !== 'launch' && Math.floor(t / 0.53) % 2 === 0) {
        const cy = y0 + (rows.length - 1) * lh
        const cx = x0 + ctx.measureText(active).width
        ctx.fillRect(cx + 6, cy - 26, 20, 32)
      }
      if (mode === 'cli') {
        ctx.font = '20px "JetBrains Mono", "Courier New", monospace'
        ctx.fillStyle = 'rgba(134,255,158,0.4)'
        ctx.shadowBlur = 0
        ctx.fillText('"HELP" FOR COMMANDS · "RUN" OR CLICK TO LAUNCH', x0, 706)
      }
      ctx.restore()
      // scanlines + vignette baked into the texture
      ctx.fillStyle = 'rgba(0,0,0,0.22)'
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1)
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.78)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      screenTex.needsUpdate = true
    }

    /* ---------- phase transitions ---------- */
    const startDive = () => {
      setPhase('dive')
      killScroll()

      const tl = gsap.timeline({ onComplete: enterComputer })
      tweens.push(tl)
      const UP = new THREE.Vector3(0, 1, 0)
      const look = new THREE.Vector3()
      const origin = new THREE.Vector3(0, 0, 0)
      const pPos = new THREE.Vector3()
      const startPos = camera1.position.clone()
      const leg2LookFrom = origin.clone()

      if (planetMeshRef) {
        const planet = planetMeshRef
        const dist = THREE.MathUtils.clamp(planetRadius * 3.5, 3, 14)
        const lift = Math.max(planetRadius * 0.6, 1)

        // ── leg 1: swing over to the planet ──
        const side = new THREE.Vector3()
        const vantage = new THREE.Vector3()
        const p1 = { u: 0 }
        tl.to(p1, {
          u: 1, duration: 3.6, ease: 'power2.inOut',
          onUpdate: () => {
            planet.getWorldPosition(pPos)
            const dir = pPos.clone().normalize()
            vantage.copy(pPos).addScaledVector(dir, dist).add(new THREE.Vector3(0, lift, 0))
            side.crossVectors(dir, UP).setLength(16)
            camera1.position.lerpVectors(startPos, vantage, p1.u)
              .addScaledVector(side, Math.sin(Math.PI * p1.u))
              .y += Math.sin(Math.PI * p1.u) * 5
            look.copy(origin).lerp(pPos, Math.min(1, p1.u * 1.4))
            camera1.lookAt(look)
          },
        }, 0)

        // ── hold: drift around the planet ──
        const p2 = { a: 0 }
        tl.to(p2, {
          a: 0.55, duration: 1.5, ease: 'sine.inOut',
          onUpdate: () => {
            planet.getWorldPosition(pPos)
            const offset = pPos.clone().normalize().multiplyScalar(dist).add(new THREE.Vector3(0, lift, 0))
            camera1.position.copy(pPos).add(offset.applyAxisAngle(UP, p2.a))
            camera1.lookAt(pPos)
          },
        })
      }

      // ── leg 2: swing back and dive into the hole (path built when it starts) ──
      tl.addLabel('dive')
      const p3 = { u: 0, roll: 0 }
      let path2: THREE.CatmullRomCurve3 | null = null
      tl.to(p3, {
        u: 1, duration: 5.6, ease: 'power2.inOut',
        onStart: () => {
          const leg2Start = camera1.position.clone()
          if (planetMeshRef) planetMeshRef.getWorldPosition(leg2LookFrom)
          const wide = leg2Start.clone().setY(Math.max(leg2Start.y, 6)).applyAxisAngle(UP, 0.8).setLength(38)
          path2 = new THREE.CatmullRomCurve3([
            leg2Start,
            wide,
            wide.clone().multiplyScalar(0.45).setY(2.2),
            new THREE.Vector3(-6, 0.8, -1.8),
            new THREE.Vector3(0, 0.15, 0),
          ])
        },
        onUpdate: () => {
          if (!path2) return
          path2.getPoint(p3.u, camera1.position)
          camera1.up.set(Math.sin(p3.roll), 1, 0).normalize()
          look.copy(leg2LookFrom).lerp(origin, Math.min(1, p3.u * 1.8))
          if (p3.u > 0.85) look.lerp(new THREE.Vector3(6, -0.5, -4), (p3.u - 0.85) * 4)
          camera1.lookAt(look)
        },
      }, 'dive')
      tl.to(p3, { roll: 0.5, duration: 2.8, ease: 'sine.inOut' }, 'dive')
      tl.to(p3, { roll: -0.18, duration: 2.8, ease: 'sine.inOut' }, 'dive+=2.8')
      tl.to(spin, { hole: 0.7, duration: 5.2, ease: 'power2.in' }, 'dive')
      tl.to(camera1, {
        fov: 105, duration: 1.7, ease: 'power3.in',
        onUpdate: () => camera1.updateProjectionMatrix(),
      }, 'dive+=3.7')
      if (flashRef.current) {
        tl.to(flashRef.current, { opacity: 1, duration: 0.5, ease: 'power3.in' }, 'dive+=4.9')
      }
    }
    actions.current.enter = startDive

    const enterComputer = () => {
      if (finished || disposed) return
      setPhase('boot')
      activeComposer = composer2
      mode = 'boot'

      const right = new THREE.Vector3().crossVectors(screenNormal, new THREE.Vector3(0, 1, 0)).normalize()
      const D0 = 30
      const start = screenCenter.clone()
        .addScaledVector(screenNormal, D0)
        .addScaledVector(right, D0 * 0.55)
        .add(new THREE.Vector3(0, D0 * 0.3, 0))
      const mid = screenCenter.clone()
        .addScaledVector(screenNormal, D0 * 0.45)
        .addScaledVector(right, 2.5)
        .add(new THREE.Vector3(0, 1.5, 0))
      const end = screenCenter.clone().addScaledVector(screenNormal, dollyEndDist)
      const path = new THREE.CatmullRomCurve3([start, mid, end])
      const look = new THREE.Vector3()
      const lookStart = new THREE.Vector3(0, 0, 0)
      const prox = { u: 0 }

      camera2.position.copy(start)
      camera2.lookAt(lookStart)

      if (flashRef.current) {
        tweens.push(gsap.to(flashRef.current, { opacity: 0, duration: 1.4, ease: 'power2.out' }))
      }
      const tl = gsap.timeline()
      tweens.push(tl)
      tl.to(prox, {
        u: 1, duration: 8.5, ease: 'power2.inOut',
        onUpdate: () => {
          path.getPoint(prox.u, camera2.position)
          look.copy(lookStart).lerp(screenCenter, Math.min(1, prox.u * 2.2))
          camera2.lookAt(look)
        },
      })
    }

    /* ---------- main loop ---------- */
    // stop burning GPU on bloom passes once the intro is scrolled out of view
    let stageVisible = true
    const io = new IntersectionObserver(entries => { stageVisible = entries[0].isIntersecting })
    if (rootRef.current) io.observe(rootRef.current)

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!stageVisible) return
      const dt = Math.min(clock.getDelta(), 0.05)
      const t = clock.elapsedTime

      if (holeGroup) holeGroup.rotation.y += spin.hole * dt
      dbgControls?.update()
      if (mode !== 'off') {
        if (mode === 'boot') {
          bootTimer += dt
          const line = BOOT_LINES[bootIdx]
          if (line === undefined) finishBoot()
          else {
            const interval = line.length === 0 ? 0.18 : bootChar >= line.length ? 0.32 : 0.045
            if (bootTimer >= interval) {
              bootTimer = 0
              if (bootChar < line.length) bootChar++
              else { pushLines(line); bootIdx++; bootChar = 0 }
            }
          }
        }
        drawScreen(t)
        if (screenLight) screenLight.intensity = 55 + Math.sin(t * 11) * 8 + Math.random() * 6
      }
      activeComposer.render()
    }
    tick()

    /* ---------- listeners ---------- */
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight
      renderer.setSize(w, h)
      composer1.setSize(w, h)
      composer2.setSize(w, h)
      for (const c of [camera1, camera2]) {
        c.aspect = w / h
        c.updateProjectionMatrix()
      }
      dbgControls?.handleResize()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { finish(); return }
      if (mode === 'boot' && e.key === 'Enter') { finishBoot(); e.preventDefault(); return }
      if (mode !== 'cli') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') { execute(); e.preventDefault() }
      else if (e.key === 'Backspace') { input = input.slice(0, -1); e.preventDefault() }
      else if (e.key.length === 1 && input.length < 34) { input += e.key.toUpperCase(); e.preventDefault() }
    }
    const onPointer = () => {
      if (mode === 'cli') { input = 'RUN'; execute() }
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)
    renderer.domElement.addEventListener('pointerdown', onPointer)

    let torndown = false
    teardownFn = () => {
      if (torndown) return
      torndown = true
      cancelAnimationFrame(raf)
      io.disconnect()
      killScroll()
      tweens.forEach(t => t.kill())
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
      renderer.domElement.removeEventListener('pointerdown', onPointer)
      dbgControls?.dispose()
      panelEl?.remove()
      draco.dispose()
      composer1.dispose()
      composer2.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }

    return () => {
      disposed = true
      teardownFn()
    }
  }, [])

  return (
    <>
      {phase !== 'done' && (
        <div className="space-intro" ref={rootRef}>
          <div className="si-stage">
            <div className="si-canvas" ref={mountRef} />
            {phase === 'loading' && (
              <div className="si-loading">
                <span className="si-blink">▋</span> ESTABLISHING UPLINK … {progress}%
              </div>
            )}
            {phase === 'ready' && (
              <div className="si-title" ref={titleRef} style={{ opacity: 0 }}>
                <p className="si-eyebrow">PORTFOLIO</p>
                <h1>BRUCE CHENG</h1>
                <p>SOFTWARE ENGINEER · MS @ CMU SILICON VALLEY</p>
                <span className="si-scroll-hint">SCROLL TO APPROACH ▼</span>
              </div>
            )}
            {phase !== 'loading' && (
              <button className="si-skip" onClick={() => actions.current.skip?.()}>
                SKIP INTRO ⏭
              </button>
            )}
            <div className="si-flash" ref={flashRef} />
          </div>
        </div>
      )}
      <div className="crt-filter" aria-hidden="true" />
    </>
  )
}
