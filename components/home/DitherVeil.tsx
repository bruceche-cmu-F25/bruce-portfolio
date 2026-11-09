'use client'

/** A painting kept under a dither: the page shows it as two-tone
 *  Floyd–Steinberg dots in the page's colours, and the real picture shows
 *  through wherever the pointer has just been — a soft trail that closes up
 *  again behind it, edged with a rim of ordered dots. A click (or a tap) sends
 *  a ring out that uncovers the whole picture for a moment.
 *
 *  Raw WebGL2, two passes: the trail is painted into a half-size mask that
 *  fades a little every frame (ping-ponged between two targets), and the view
 *  pass mixes dots, rim and picture by it. The dither itself is worked out
 *  once on the CPU per size and uploaded as a texture. It only draws while
 *  something is moving, and not at all off screen. Without WebGL2 the plain
 *  picture stays. */

import { useEffect, useRef } from 'react'

type Props = {
  src: string
  alt: string
  /** CSS pixels per dot */
  pixelSize?: number
  /** trail radius, CSS pixels */
  revealRadius?: number
  softness?: number
  /** seconds the trail takes to close */
  linger?: number
  /** share of the trail's edge drawn as rim dots, 0…0.95 */
  rim?: number
  /** page colours, as custom-property names */
  ink?: string
  paper?: string
  rimColor?: string
  contrast?: number
  brightness?: number
}

type RGB = [number, number, number]

const MASK_SCALE = 0.5
const MAX_BURSTS = 4
const BURST_SECONDS = 1.2
const INTRO_MS = 1100
const THEME_POLL_MS = 600
const FLOYD = [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]] as const

const VERTEX = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`

const MASK = `#version 300 es
precision highp float;
uniform sampler2D tPrev;
uniform vec2 uSize;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uSoftness;
uniform float uStrength;
uniform float uFade;
in vec2 vUv;
out vec4 fragColor;
float stroke(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  return length(p - a - ab * h);
}
void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  float trail = max(texture(tPrev, vUv).r - uFade, 0.0);
  float band = max(uRadius * uSoftness, 1.0) * 1.6;
  trail = max(trail, clamp((uRadius - stroke(p, uFrom, uTo)) / band, 0.0, 1.0) * uStrength);
  fragColor = vec4(trail, 0.0, 0.0, 1.0);
}`

const VIEW = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D tImage;
uniform sampler2D tMask;
uniform sampler2D tDots;
uniform vec2 uResolution;
uniform vec2 uCover;
uniform vec2 uSize;
uniform float uCell;
uniform float uRim;
uniform float uIntro;
uniform float uBurstWidth;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform vec3 uRimColor;
uniform vec4 uBursts[4];
in vec2 vUv;
out vec4 fragColor;

float bayer(vec2 cell) {
  ivec2 p = ivec2(mod(cell, 8.0));
  int v = p.x ^ p.y;
  int m = ((v & 1) << 5) | ((p.y & 1) << 4) | ((v & 2) << 2) | ((p.y & 2) << 1) | ((v & 4) >> 1) | ((p.y & 4) >> 2);
  return (float(m) + 0.5) / 64.0;
}

float shockwave(vec2 p) {
  float value = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 b = uBursts[i];
    if (b.w <= 0.0) continue;
    float offset = distance(p, b.xy) - b.z;
    float edge = offset > 0.0 ? offset / (uBurstWidth * 0.35) : -offset / uBurstWidth;
    value = max(value, clamp(1.0 - edge, 0.0, 1.0) * b.w);
  }
  return value;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 cell = floor(px / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec2 cellUv = vec2(center.x / uResolution.x, 1.0 - center.y / uResolution.y);

  vec3 color = mix(uInk, uPaper, texelFetch(tDots, ivec2(cell), 0).r);
  vec3 photo = texture(tImage, (vUv - 0.5) * uCover + 0.5).rgb;

  vec2 point = vec2(cellUv.x, 1.0 - cellUv.y) * uSize;
  float shown = max(clamp(texture(tMask, cellUv).r * 1.6, 0.0, 1.0), shockwave(point));
  float low = bayer(cell.yx) * (1.0 - uRim);
  color = mix(color, uRimColor, step(low, shown) * step(0.001, uRim));
  color = mix(color, photo, step(low + uRim, shown));

  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  float spread = length((cellUv - 0.5) * aspect) / length(aspect * 0.5);
  float appear = step(spread * 0.72 + bayer(cell + vec2(3.0, 5.0)) * 0.28, uIntro * 1.001);
  fragColor = vec4(mix(uInk, color, appear), 1.0);
}`

let probe: CanvasRenderingContext2D | null = null
/** Any CSS colour to 0…1 RGB, through a canvas so every syntax works. */
function toRgb(color: string): RGB {
  probe ??= document.createElement('canvas').getContext('2d')
  if (!probe) return [1, 1, 1]
  probe.fillStyle = '#000000'
  probe.fillStyle = color.trim() || '#000000'
  const value = String(probe.fillStyle)
  if (value.startsWith('#')) {
    const hex = parseInt(value.slice(1, 7), 16)
    return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]
  }
  const parts = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0]
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255]
}

/** Floyd–Steinberg on luma, serpentine, to `levels` steps; one byte a dot. */
function diffuse(pixels: Uint8ClampedArray, cols: number, rows: number, levels: number, grade: (v: number) => number) {
  const values = new Float32Array(cols * rows)
  for (let i = 0; i < cols * rows; i++) {
    values[i] = grade((0.2126 * pixels[i * 4] + 0.7152 * pixels[i * 4 + 1] + 0.0722 * pixels[i * 4 + 2]) / 255)
  }
  const steps = levels - 1
  const out = new Uint8Array(cols * rows)
  for (let y = 0; y < rows; y++) {
    const dir = y & 1 ? -1 : 1
    for (let i = 0; i < cols; i++) {
      const x = dir > 0 ? i : cols - 1 - i
      const p = y * cols + x
      const old = values[p]
      const q = Math.min(steps, Math.max(0, Math.round(old * steps))) / steps
      out[p] = Math.round(q * 255)
      const err = old - q
      for (const [dx, dy, w] of FLOYD) {
        const nx = x + dx * dir
        const ny = y + dy
        if (nx < 0 || nx >= cols || ny >= rows) continue
        values[ny * cols + nx] += err * w
      }
    }
  }
  return out
}

function compile(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram()
  const shaders = [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const
  for (const [type, source] of shaders) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null
    gl.attachShader(program, shader)
  }
  gl.bindAttribLocation(program, 0, 'position')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number
  for (let i = 0; i < count; i++) {
    const name = gl.getActiveUniform(program, i)!.name.replace(/\[0\]$/, '')
    uniforms[name] = gl.getUniformLocation(program, name)
  }
  return { program, uniforms }
}

export default function DitherVeil({
  src, alt, pixelSize = 1.5, revealRadius = 120, softness = 0.6, linger = 1.6, rim = 0.25,
  ink = '--bg', paper = '--body', rimColor = '--accent', contrast = 1.3, brightness = 0.08,
}: Props) {
  const box = useRef<HTMLDivElement>(null)
  const settings = useRef({ pixelSize, revealRadius, softness, linger, rim, ink, paper, rimColor, contrast, brightness })
  settings.current = { pixelSize, revealRadius, softness, linger, rim, ink, paper, rimColor, contrast, brightness }

  useEffect(() => {
    const container = box.current
    if (!container) return
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false })
    if (!gl) return
    const mask = compile(gl, VERTEX, MASK)
    const view = compile(gl, VERTEX, VIEW)
    if (!mask || !view) return
    canvas.setAttribute('aria-hidden', 'true')
    container.appendChild(canvas)
    container.setAttribute('data-gl', '')

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const floatMask = !!gl.getExtension('EXT_color_buffer_float')

    const triangle = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const texture = (filter: number) => {
      const t = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter === gl.NEAREST ? gl.NEAREST : gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return t
    }
    const imageTexture = texture(gl.LINEAR_MIPMAP_LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
    const dotsTexture = texture(gl.NEAREST)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, 1, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array(1))

    type Target = { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number }
    const target = (w: number, h: number): Target => {
      const tex = texture(gl.LINEAR)
      if (floatMask) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      const fb = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return { fb, tex, w, h }
    }
    const drop = (t: Target) => { gl.deleteFramebuffer(t.fb); gl.deleteTexture(t.tex) }
    let masks = [target(2, 2), target(2, 2)]

    const sampler = document.createElement('canvas')
    const samplerContext = sampler.getContext('2d', { willReadFrequently: true })

    const colors = { ink: [0, 0, 0] as RGB, paper: [1, 1, 1] as RGB, rim: [1, 1, 1] as RGB }
    let colorKey = ''
    const readColors = () => {
      const s = settings.current
      const styles = getComputedStyle(container)
      const values = [s.ink, s.paper, s.rimColor].map(name => styles.getPropertyValue(name))
      const key = values.join()
      if (key === colorKey) return false
      colorKey = key
      ;[colors.ink, colors.paper, colors.rim] = values.map(toRgb)
      return true
    }

    let image: HTMLImageElement | null = null
    let introStart = -1
    let dotsKey = ''
    let width = 1
    let height = 1
    let dpr = 1
    let cover: [number, number] = [1, 1]
    let visible = false
    let raf = 0
    let last = performance.now()
    let trailUntil = 0
    let presence = 0
    let resizePending = true
    const pointer = { x: 0, y: 0, inside: false, fresh: true }
    const brush = { x: 0, y: 0, px: 0, py: 0 }
    const bursts: { x: number; y: number; start: number }[] = []
    const burstData = new Float32Array(MAX_BURSTS * 4)

    const layout = () => {
      dpr = Math.min(devicePixelRatio || 1, 2)
      width = Math.max(1, container.clientWidth)
      height = Math.max(1, container.clientHeight)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const mw = Math.max(2, Math.round(width * MASK_SCALE))
      const mh = Math.max(2, Math.round(height * MASK_SCALE))
      if (mw !== masks[0].w || mh !== masks[0].h) {
        masks.forEach(drop)
        masks = [target(mw, mh), target(mw, mh)]
      }
    }

    /** The dots, worked out for this size: the picture cover-fitted into one
     *  sample a dot, then error-diffused. */
    const updateDots = (cell: number) => {
      if (!image || !samplerContext) return
      const s = settings.current
      const cols = Math.ceil(canvas.width / cell)
      const rows = Math.ceil(canvas.height / cell)
      const key = [cols, rows, canvas.width, canvas.height, s.contrast, s.brightness].join('|')
      if (key === dotsKey) return
      dotsKey = key
      const iw = image.naturalWidth
      const ih = image.naturalHeight
      sampler.width = cols
      sampler.height = rows
      samplerContext.fillStyle = '#000'
      samplerContext.fillRect(0, 0, cols, rows)
      samplerContext.imageSmoothingEnabled = true
      samplerContext.imageSmoothingQuality = 'high'
      const [cx, cy] = cover
      samplerContext.drawImage(image, (0.5 - 0.5 * cx) * iw, (0.5 - 0.5 * cy) * ih, cx * iw, cy * ih,
        0, 0, canvas.width / cell, canvas.height / cell)
      const grade = (v: number) => Math.pow(Math.min(1, Math.max(0, (v - 0.5) * s.contrast + 0.5 + s.brightness)), 1.6)
      const dots = diffuse(samplerContext.getImageData(0, 0, cols, rows).data, cols, rows, 2, grade)
      gl.bindTexture(gl.TEXTURE_2D, dotsTexture)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, cols, rows, 0, gl.RED, gl.UNSIGNED_BYTE, dots)
    }

    const bind = (unit: number, tex: WebGLTexture, location: WebGLUniformLocation | null) => {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.uniform1i(location, unit)
    }

    const frame = (now: number) => {
      raf = 0
      if (resizePending) {
        resizePending = false
        layout()
      }
      const s = settings.current
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      readColors()

      presence += ((pointer.inside ? 1 : 0) - presence) * (1 - Math.exp(-dt / 0.16))
      if (pointer.fresh) {
        brush.x = brush.px = pointer.x
        brush.y = brush.py = pointer.y
        pointer.fresh = false
      } else {
        const follow = 1 - Math.exp(-dt / 0.035)
        brush.x += (pointer.x - brush.x) * follow
        brush.y += (pointer.y - brush.y) * follow
      }

      const burstWidth = Math.max(40, s.revealRadius * 0.9)
      burstData.fill(0)
      for (let i = bursts.length - 1; i >= 0; i--) if ((now - bursts[i].start) / 1000 >= BURST_SECONDS) bursts.splice(i, 1)
      bursts.forEach((b, i) => {
        const k = Math.max(0, (now - b.start) / 1000 / BURST_SECONDS)
        const reach = Math.hypot(Math.max(b.x, width - b.x), Math.max(b.y, height - b.y)) + burstWidth
        burstData.set([b.x, b.y, reach * Math.sin((k * Math.PI) / 2), 1 - k * k * k], i * 4)
      })
      if (presence > 0.002) trailUntil = now + s.linger * 1000 + 150

      // the trail: last frame's mask, faded, with this frame's stroke on top
      const minFade = floatMask ? 0 : 1.5 / 255
      gl.bindFramebuffer(gl.FRAMEBUFFER, masks[1].fb)
      gl.viewport(0, 0, masks[1].w, masks[1].h)
      gl.useProgram(mask.program)
      const mu = mask.uniforms
      bind(0, masks[0].tex, mu.tPrev)
      gl.uniform2f(mu.uSize, width, height)
      gl.uniform2f(mu.uFrom, brush.px, brush.py)
      gl.uniform2f(mu.uTo, brush.x, brush.y)
      gl.uniform1f(mu.uRadius, s.revealRadius * (0.45 + 0.55 * presence))
      gl.uniform1f(mu.uSoftness, s.softness)
      gl.uniform1f(mu.uStrength, presence)
      gl.uniform1f(mu.uFade, Math.max(s.linger > 0 ? dt / s.linger : 1, minFade))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      masks.reverse()
      brush.px = brush.x
      brush.py = brush.y

      const cell = Math.max(1, Math.round(s.pixelSize * dpr))
      if (image) {
        const ratio = canvas.width / canvas.height / (image.naturalWidth / image.naturalHeight)
        cover = ratio > 1 ? [1, 1 / ratio] : [ratio, 1]
        updateDots(cell)
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(view.program)
      const vu = view.uniforms
      bind(0, imageTexture, vu.tImage)
      bind(1, masks[0].tex, vu.tMask)
      bind(2, dotsTexture, vu.tDots)
      gl.uniform2f(vu.uResolution, canvas.width, canvas.height)
      gl.uniform2f(vu.uCover, cover[0], cover[1])
      gl.uniform2f(vu.uSize, width, height)
      gl.uniform1f(vu.uCell, cell)
      gl.uniform1f(vu.uRim, Math.min(Math.max(s.rim, 0), 0.95))
      gl.uniform1f(vu.uBurstWidth, burstWidth)
      gl.uniform3fv(vu.uInk, colors.ink)
      gl.uniform3fv(vu.uPaper, colors.paper)
      gl.uniform3fv(vu.uRimColor, colors.rim)
      gl.uniform4fv(vu.uBursts, burstData)
      const intro = !image || introStart < 0 ? 0 : reduce ? 1 : Math.min(1, (now - introStart) / INTRO_MS)
      gl.uniform1f(vu.uIntro, 1 - Math.pow(1 - intro, 2))
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      const busy = pointer.inside || presence > 0.002 || bursts.length > 0 || now < trailUntil || (introStart >= 0 && intro < 1)
      if (busy && visible) raf = requestAnimationFrame(frame)
    }

    const wake = () => {
      if (raf || !visible) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }

    // the intro plays the first time the picture is both loaded and in view
    const begin = () => {
      if (!image || !visible || introStart >= 0) return
      introStart = performance.now()
      wake()
    }

    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, imageTexture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.generateMipmap(gl.TEXTURE_2D)
      image = img
      begin()
    }

    const locate = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
    }
    const onMove = (e: PointerEvent) => {
      locate(e)
      if (!pointer.inside) {
        pointer.inside = true
        pointer.fresh = true
      }
      wake()
    }
    const onLeave = () => { pointer.inside = false; wake() }
    const onDown = (e: PointerEvent) => {
      onMove(e)
      if (e.pointerType === 'mouse' && e.button !== 0) return
      bursts.push({ x: pointer.x, y: pointer.y, start: performance.now() })
      if (bursts.length > MAX_BURSTS) bursts.shift()
    }
    container.addEventListener('pointermove', onMove, { passive: true })
    container.addEventListener('pointerenter', onMove, { passive: true })
    container.addEventListener('pointerdown', onDown, { passive: true })
    container.addEventListener('pointerleave', onLeave, { passive: true })
    container.addEventListener('pointercancel', onLeave, { passive: true })

    const resize = new ResizeObserver(() => { resizePending = true; dotsKey = ''; wake() })
    resize.observe(container)
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      begin()
      wake()
    })
    seen.observe(container)
    // the picture is only fetched once it's getting close
    const near = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      img.src = src
      near.disconnect()
    }, { rootMargin: '600px 0px' })
    near.observe(container)

    // the hour and neon recolour the page while nothing here is moving
    const poll = window.setInterval(() => { if (visible && readColors()) wake() }, THEME_POLL_MS)

    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(poll)
      resize.disconnect()
      seen.disconnect()
      near.disconnect()
      img.onload = null
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerenter', onMove)
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointerleave', onLeave)
      container.removeEventListener('pointercancel', onLeave)
      container.removeAttribute('data-gl')
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    }
  }, [src])

  return (
    <div ref={box} className="veil" role="img" aria-label={alt}>
      <img className="veil-plain" src={src} alt="" width="1000" height="1000" loading="lazy" decoding="async" />
    </div>
  )
}
