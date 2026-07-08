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
import gsap from 'gsap'

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
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      tweens.forEach(t => t.kill())
      const root = rootRef.current
      if (root) {
        gsap.to(root, {
          autoAlpha: 0, duration: 0.9, ease: 'power2.out',
          onComplete: () => { setPhase('done'); teardownFn() },
        })
      } else {
        setPhase('done')
        teardownFn()
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
    renderer.toneMappingExposure = 1.0
    renderer.setClearColor(0x000000, 1)
    mountRef.current?.appendChild(renderer.domElement)

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    // studio-style environment lighting, same role as Sketchfab's default env
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()

    /* ---------- shared state ---------- */
    const clock = new THREE.Clock()
    const spin = { hole: 0.06, fx: -0.25 }
    let holeGroup: THREE.Group | null = null
    let fxGroup: THREE.Group | null = null
    const fxMats: THREE.MeshStandardMaterial[] = []
    let idleFloat = true
    let camBaseY = 0

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

    /* post-processing: bloom gives the accretion disk its glow */
    const res = new THREE.Vector2(window.innerWidth, window.innerHeight)
    const composer1 = new EffectComposer(renderer)
    composer1.addPass(new RenderPass(scene1, camera1))
    composer1.addPass(new UnrealBloomPass(res.clone(), 0.9, 0.75, 0.62))
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

    Promise.all([load('/models/black_hole.glb'), load('/models/blackhole_effect.glb'), load('/models/commodore_64.glb')])
      .then(([hole, fx, c64]) => {
        if (finished || disposed) return

        /* ----- scene 1: black hole ----- */
        scene1.add(makeStars(2600, 0.9))

        // Sketchfab's "Final Render" = authored materials (albedo/spec/emission as-is)
        // + studio environment lighting + bloom post-processing. Keep the materials
        // untouched and reproduce the env + post instead.
        scene1.environment = envMap
        ;(scene1 as any).environmentIntensity = 1.1
        // …except the horizon spheres: they must stay pure black, not reflect the env
        const NO_ENV = ['black_hole_center', 'black_hole_distortion', 'black_hole_blackoutside']
        hole.scene.traverse(o => {
          const m = o as THREE.Mesh
          if (!m.isMesh) return
          const mat = m.material as THREE.MeshStandardMaterial
          if (mat && (mat as any).isMeshStandardMaterial && NO_ENV.includes(mat.name)) {
            mat.envMapIntensity = 0
            mat.needsUpdate = true
          }
        })

        holeGroup = normalize(hole.scene, 64)
        scene1.add(holeGroup)
        holeGroup.updateMatrixWorld(true)

        let centerMesh: THREE.Mesh | null = null
        let planetMesh: THREE.Mesh | null = null
        holeGroup.traverse(o => {
          const m = o as THREE.Mesh
          if (!m.isMesh) return
          const name = (m.material as THREE.Material)?.name
          if (name === 'black_hole_center') centerMesh = m
          if (name === 'Planet') planetMesh = m
        })
        const cSphere = new THREE.Sphere(new THREE.Vector3(), 4)
        if (centerMesh) new THREE.Box3().setFromObject(centerMesh).getBoundingSphere(cSphere)
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

        fx.scene.traverse(o => {
          const m = o as THREE.Mesh
          if (m.isMesh) {
            const mat = m.material as THREE.MeshStandardMaterial
            mat.transparent = true
            mat.blending = THREE.AdditiveBlending
            mat.depthWrite = false
            mat.side = THREE.DoubleSide
            // glow from its own texture only — the asset ships as a perfect mirror
            // (metalness 1 / roughness 0) which reflects the env into a white ball
            mat.metalness = 0
            mat.roughness = 1
            mat.envMapIntensity = 0
            if (mat.map) {
              mat.emissiveMap = mat.map
              mat.emissive = new THREE.Color(0xffffff)
              mat.emissiveIntensity = 0.06 // near-invisible at idle; ramped up in the dive
            }
            mat.opacity = 0.6
            mat.needsUpdate = true
            fxMats.push(mat)
          }
        })
        fxGroup = normalize(fx.scene, cSphere.radius * 2.3)
        fxGroup.position.copy(cSphere.center)
        scene1.add(fxGroup)

        camBaseY = 14
        camera1.position.set(0, camBaseY, 48)
        camera1.lookAt(0, 0, 0)

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

        if (process.env.NODE_ENV !== 'production') (window as any).__dbgScene1 = scene1

        setPhase('ready')
        setProgress(100)
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
      idleFloat = false

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
      tl.to(spin, { hole: 0.7, fx: -2.4, duration: 5.2, ease: 'power2.in' }, 'dive')
      const fxGlow = { e: 0.06 }
      tl.to(fxGlow, {
        e: 0.85, duration: 5.2, ease: 'power2.in',
        onUpdate: () => fxMats.forEach(m => { m.emissiveIntensity = fxGlow.e }),
      }, 'dive')
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
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      const t = clock.elapsedTime

      if (holeGroup) holeGroup.rotation.y += spin.hole * dt
      if (fxGroup) {
        fxGroup.rotation.y += spin.fx * dt
        fxGroup.rotation.x = Math.sin(t * 0.4) * 0.08
      }
      if (idleFloat && activeComposer === composer1) {
        camera1.position.y = camBaseY + Math.sin(t * 0.6) * 0.8
        camera1.lookAt(0, 0, 0)
      }
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
      tweens.forEach(t => t.kill())
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
      renderer.domElement.removeEventListener('pointerdown', onPointer)
      draco.dispose()
      composer1.dispose()
      composer2.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }

    return () => {
      disposed = true
      teardownFn()
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <>
      {phase !== 'done' && (
        <div className="space-intro" ref={rootRef}>
          <div className="si-canvas" ref={mountRef} />
          {phase === 'loading' && (
            <div className="si-loading">
              <span className="si-blink">▋</span> ESTABLISHING UPLINK … {progress}%
            </div>
          )}
          {phase === 'ready' && (
            <div className="si-title">
              <h1>BRUCE CHENG</h1>
              <p>SOFTWARE ENGINEER · MS @ CMU SILICON VALLEY</p>
              <button className="si-enter" onClick={() => actions.current.enter?.()}>
                ENTER THE EVENT HORIZON
              </button>
            </div>
          )}
          {phase !== 'loading' && (
            <button className="si-skip" onClick={() => actions.current.skip?.()}>
              SKIP INTRO ⏭
            </button>
          )}
          <div className="si-flash" ref={flashRef} />
        </div>
      )}
      <div className="crt-filter" aria-hidden="true" />
    </>
  )
}
