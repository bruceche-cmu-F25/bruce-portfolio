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
import { useLoader } from '@/lib/LoaderContext'

gsap.registerPlugin(ScrollTrigger)

// DEBUG: when true, render the raw model with environment light only —
// no core point light, no bloom, no color grade, no material overrides —
// and enable drag-to-orbit so we can find the camera angle. Set false to
// restore the full lit + graded hero.
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

type Phase = 'loading' | 'ready' | 'fallback'

export default function SpaceHero() {
  const rootRef     = useRef<HTMLElement>(null)
  const mountRef    = useRef<HTMLDivElement>(null)
  const titleRef    = useRef<HTMLDivElement>(null)
  const blackoutRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const { setProgress, setReady } = useLoader()

  useEffect(() => {
    let disposed = false
    let fallen = false
    let raf = 0
    const tweens: gsap.core.Animation[] = []
    let teardownFn: () => void = () => {}
    let killScroll: () => void = () => {}

    // static fallback: no WebGL — show the title over the CSS starfield
    const toFallback = () => {
      if (fallen || disposed) return
      fallen = true
      killScroll()
      tweens.forEach(t => t.kill())
      teardownFn()
      setPhase('fallback')
      setProgress(100)
      setReady(true)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      toFallback()
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch {
      toFallback()
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
    let dbgControls: TrackballControls | null = null // free-tumble controls (ORBIT / DEBUG_BARE)
    let panelEl: HTMLElement | null = null // dev tuning panel
    let cameraLogRaf: number | null = null
    let cameraLogLast = 0
    let currentCameraScroll = 0
    const urlParams = new URLSearchParams(window.location.search)
    const installSpaceApi = (api: Record<string, unknown>, getCamera?: () => unknown) => {
      if (getCamera) {
        Object.defineProperty(api, 'cameraNow', {
          get: getCamera,
          enumerable: true,
          configurable: true,
        })
      }
      ;(window as any).__space = api
      ;(window as any).space = api
    }
    const cameraNotReady = () => {
      // eslint-disable-next-line no-console
      console.warn('[SpaceHero] camera not ready yet. Wait for the black hole model to finish loading.')
    }
    installSpaceApi({
      status: 'loading',
      printCamera: cameraNotReady,
      startCameraLog: cameraNotReady,
      stopCameraLog: () => {},
      copyCamera: cameraNotReady,
    })
    const spaceDebugEnabled =
      process.env.NODE_ENV !== 'production' ||
      urlParams.has('spaceDebug') ||
      window.localStorage.getItem('spaceDebug') === '1'

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
    const camera1 = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 2000)
    const currentCameraTarget = new THREE.Vector3()
    const cameraState = () => {
      const p = camera1.position
      const up = camera1.up
      const tg = dbgControls ? dbgControls.target : currentCameraTarget
      const round = (n: number) => Number(n.toFixed(2))
      return {
        cam: { x: round(p.x), y: round(p.y), z: round(p.z) },
        up: { x: round(up.x), y: round(up.y), z: round(up.z) },
        target: { x: round(tg.x), y: round(tg.y), z: round(tg.z) },
        fov: round(camera1.fov),
        scroll: round(currentCameraScroll),
      }
    }
    const cameraSnippet = (label = 'camera') => {
      const p = camera1.position
      const up = camera1.up
      const tg = dbgControls ? dbgControls.target : currentCameraTarget
      const f = (n: number) => Number(n).toFixed(2)
      const text =
`// ${label}
cam:    new THREE.Vector3(${f(p.x)}, ${f(p.y)}, ${f(p.z)})
up:     new THREE.Vector3(${f(up.x)}, ${f(up.y)}, ${f(up.z)})
target: new THREE.Vector3(${f(tg.x)}, ${f(tg.y)}, ${f(tg.z)})
fov:    ${f(camera1.fov)}
scroll: ${f(currentCameraScroll)}`
      // eslint-disable-next-line no-console
      console.log(text)
      return text
    }
    const startCameraLog = (ms = 500) => {
      stopCameraLog()
      cameraLogLast = 0
      const loop = (now: number) => {
        cameraLogRaf = window.requestAnimationFrame(loop)
        if (now - cameraLogLast < ms) return
        cameraLogLast = now
        cameraSnippet('camera live')
      }
      cameraSnippet('camera start')
      cameraLogRaf = window.requestAnimationFrame(loop)
    }
    const stopCameraLog = () => {
      if (cameraLogRaf !== null) {
        window.cancelAnimationFrame(cameraLogRaf)
        cameraLogRaf = null
      }
    }

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

    load('/models/black_hole.glb')
      .then(hole => {
        if (disposed || fallen) return

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

        // the planet stays put while the disk spins — detach it from the group
        let planetMesh: THREE.Mesh | null = null
        holeGroup.traverse(o => {
          const m = o as THREE.Mesh
          if (!m.isMesh) return
          if ((m.material as THREE.Material)?.name === 'Planet') planetMesh = m
        })
        if (planetMesh) scene1.attach(planetMesh)

        // Default positions used for initial render and the optional orbit tuner.
        // The scroll camera below is driven by the three explicit K1/K2/K3 keys.
        const camFar  = new THREE.Vector3(253.8, 76, 1073.4)
        const upFar   = new THREE.Vector3(-0.42, 0.74, 0.53).normalize()
        const tgtFar  = new THREE.Vector3(21.2, -11.4, -14.6)
        const camNear = new THREE.Vector3(0.57, 2.71, 29.7)
        const tgtNear = new THREE.Vector3(21.99, -5.24, -10.53)
        const lookTarget = tgtNear // panel/trackball reference (tunes the near framing)
        camera1.up.copy(upFar)
        camera1.position.copy(camFar)
        currentCameraTarget.copy(tgtFar)
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
            currentCameraTarget.copy(tg)
            const f = (n: number) => n.toFixed(1)
            // eslint-disable-next-line no-console
            console.log(
              `pos(${f(p.x)}, ${f(p.y)}, ${f(p.z)}) up(${f(up.x)}, ${f(up.y)}, ${f(up.z)}) target(${f(tg.x)}, ${f(tg.y)}, ${f(tg.z)})`,
            )
          })
        }

        /* scroll-driven camera through three hand-picked keyframes captured
           with the console camera log. The first leg eases into the hero frame,
           then holds with a tiny drift before the final dive. This avoids the
           Catmull-Rom mid-curve overshoot that can skim the white-hot core too
           early and wash the frame out.
             K1 u=0     far establishing shot
             K2 u=0.44  beside the planet — hero framing, the name holds here
             K3 u=0.85  final approach at the event horizon, fov stretched. */
        const K1 = { cam: new THREE.Vector3(253.8, 76.0, 1073.4), up: new THREE.Vector3(-0.42, 0.74, 0.53).normalize(), tgt: new THREE.Vector3(21.2, -11.4, -14.6), fov: 55 }
        const K2 = { cam: new THREE.Vector3(0.57, 2.71, 29.7),    up: new THREE.Vector3(-0.27, 0.96, 0.03).normalize(), tgt: new THREE.Vector3(21.99, -5.24, -10.53), fov: 55 }
        const K3 = { cam: new THREE.Vector3(2.38, 0.92, 1.82),    up: new THREE.Vector3(0.04, 1, 0.01).normalize(),     tgt: new THREE.Vector3(4.55, -0.84, -4.82), fov: 77.1 }
        const K2_U = 0.44
        const K3_U = 0.85
        const BLACKOUT_START_U = 0.82
        const K4_DIR = K3.tgt.clone().sub(K3.cam).normalize()
        const K4 = {
          cam: K3.cam.clone().addScaledVector(K4_DIR, 0.95),
          up: K3.up.clone(),
          tgt: K3.tgt.clone().addScaledVector(K4_DIR, 0.38),
          fov: 79,
        }
        const _cam = new THREE.Vector3(), _up = new THREE.Vector3(), _ct = new THREE.Vector3()
        const dolly = { u: 0 }
        const sampleCamera = (u: number) => {
          if (u <= K2_U) {
            const t = u / K2_U
            _cam.lerpVectors(K1.cam, K2.cam, t)
            _up.lerpVectors(K1.up, K2.up, t).normalize()
            _ct.lerpVectors(K1.tgt, K2.tgt, t)
            camera1.fov = THREE.MathUtils.lerp(K1.fov, K2.fov, t)
          } else if (u <= K3_U) {
            const t = (u - K2_U) / (K3_U - K2_U)
            _cam.lerpVectors(K2.cam, K3.cam, t)
            _up.lerpVectors(K2.up, K3.up, t).normalize()
            _ct.lerpVectors(K2.tgt, K3.tgt, t)
            camera1.fov = THREE.MathUtils.lerp(K2.fov, K3.fov, smoother(0.18, 1, t))
          } else {
            const t = smoother(K3_U, 1, u)
            _cam.lerpVectors(K3.cam, K4.cam, t)
            _up.lerpVectors(K3.up, K4.up, t).normalize()
            _ct.lerpVectors(K3.tgt, K4.tgt, t)
            camera1.fov = THREE.MathUtils.lerp(K3.fov, K4.fov, t)
          }

          camera1.position.copy(_cam)
          camera1.up.copy(_up)
          currentCameraTarget.copy(_ct)
          camera1.lookAt(_ct)
        }

        const scrollTween = gsap.to(dolly, {
          u: 1, ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.15,
          },
          onUpdate: () => {
            currentCameraScroll = dolly.u
            if (DEBUG_BARE || ORBIT) return // let TrackballControls drive the camera
            sampleCamera(dolly.u)
            const approachT = smoother(0, K2_U, dolly.u)
            const diveT = smoother(K2_U, K3_U, dolly.u)
            const swallowT = smoother(BLACKOUT_START_U, 1, dolly.u)
            spin.hole = 0.06 + 0.42 * diveT + 0.08 * swallowT
            coreLight.intensity = 410 * (1 - 0.72 * smoother(0.55, 1, diveT))
            renderer.toneMappingExposure = 0.85 - 0.28 * smoother(0.45, 1, diveT) - 0.06 * swallowT
            camera1.updateProjectionMatrix()
            starMat.opacity = 0.9 * (1 - smoother(0.25, 1, approachT))
            if (titleRef.current) {
              const fadeIn  = smoother(0.14, K2_U, dolly.u)
              const fadeOut = 1 - smoother(K2_U + 0.04, K2_U + 0.16, dolly.u)
              titleRef.current.style.opacity = String(fadeIn * fadeOut)
            }
            if (blackoutRef.current) {
              blackoutRef.current.style.opacity = String(swallowT)
            }
          },
        })
        tweens.push(scrollTween)
        killScroll = () => scrollTween.scrollTrigger?.kill()

        // Console tuning/debug hooks. These are intentionally available in every
        // build because camera framing is often checked from `next start`.
        installSpaceApi({
          status: 'ready',
          grade: diskGrade,
          coreLight,
          bloom: bloom1,
          scene: scene1,
          camera: camera1,
          target: currentCameraTarget,
          getCamera: cameraState,
          printCamera: cameraSnippet,
          startCameraLog,
          stopCameraLog,
          copyCamera: () => navigator.clipboard?.writeText(cameraSnippet('camera copy')),
        }, cameraState)
        // eslint-disable-next-line no-console
        console.info(
          '[SpaceHero] camera console ready:',
          'space.getCamera()',
          'space.cameraNow',
          'space.printCamera()',
          'space.startCameraLog(500)',
          'space.stopCameraLog()',
        )
        if (spaceDebugEnabled && urlParams.has('cameraLog')) startCameraLog(250)

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
        setReady(true)
        requestAnimationFrame(() => {
          ScrollTrigger.refresh()
          ScrollTrigger.update()
        })
      })
      .catch(err => {
        if (disposed) return
        console.error('SpaceHero: failed to load model', err)
        toFallback()
      })

    /* ---------- main loop ---------- */
    // stop burning GPU on bloom passes once the hero is scrolled out of view
    let stageVisible = true
    const io = new IntersectionObserver(entries => { stageVisible = entries[0].isIntersecting })
    if (rootRef.current) io.observe(rootRef.current)

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!stageVisible) return
      const dt = Math.min(clock.getDelta(), 0.05)
      if (holeGroup) holeGroup.rotation.y += spin.hole * dt
      dbgControls?.update()
      composer1.render()
    }
    tick()

    /* ---------- listeners ---------- */
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight
      renderer.setSize(w, h)
      composer1.setSize(w, h)
      camera1.aspect = w / h
      camera1.updateProjectionMatrix()
      dbgControls?.handleResize()
    }
    window.addEventListener('resize', onResize)

    let torndown = false
    teardownFn = () => {
      if (torndown) return
      torndown = true
      cancelAnimationFrame(raf)
      io.disconnect()
      killScroll()
      tweens.forEach(t => t.kill())
      window.removeEventListener('resize', onResize)
      dbgControls?.dispose()
      panelEl?.remove()
      stopCameraLog()
      draco.dispose()
      composer1.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }

    return () => {
      disposed = true
      teardownFn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section
      className={`space-hero${phase === 'fallback' ? ' is-static' : ''}`}
      ref={rootRef}
      aria-label="Bruce Cheng — introduction"
    >
      <div className="sh-stage">
        {phase !== 'fallback' && <div className="sh-canvas" ref={mountRef} />}
        <div
          className="sh-title"
          ref={titleRef}
          style={phase === 'fallback' ? undefined : { opacity: 0 }}
        >
          <p className="sh-eyebrow">Portfolio</p>
          <h1>Bruce Cheng</h1>
          <p className="sh-sub">Software Engineer · MS @ CMU Silicon Valley</p>
          {phase !== 'fallback' && <span className="sh-scroll-hint">Scroll to approach ↓</span>}
        </div>
        {phase !== 'fallback' && <div className="sh-blackout" ref={blackoutRef} aria-hidden="true" />}
      </div>
    </section>
  )
}
