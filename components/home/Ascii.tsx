'use client'

/** A word drawn in ASCII — a WebGL port of the "ASCII text" effect.
 *
 *  The word is painted once into a texture, laid on a plane that tilts and
 *  waves in 3D, and the canvas is read back as a grid of mono characters,
 *  each picked by how bright the plane is behind it. Hovering scrambles the
 *  characters near the pointer and swings the hue a little; a click sends a
 *  ripple of scrambled glyphs out through the grid.
 *
 *  Given several lines it takes turns with them: the word scrambles, its
 *  cells dissolve, and the next word's cells arrive as noise and settle — the
 *  same decode it plays the first time it scrolls into view. Under reduced
 *  motion it holds the last line, still.
 *
 *  Its colours are the page's heat ramp (home.css), read off the page, so it
 *  takes the hour's palette and cycles with neon like everything else. It
 *  draws at 30fps — the output is snapped to character cells and the glyphs
 *  only change 18 times a second, so 60 would look the same at twice the
 *  cost — and not at all while it's off screen. Without WebGL 2 it's text.
 */

import { useEffect, useRef, useState } from 'react'

const CHARSET = ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'
const FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
const GLYPH_WIDTH = 40
const GLYPH_HEIGHT = 64
const TEXT_PX = 256
const RIPPLES = 4
/** How often the page's colours are re-read: neon steps ten times a second. */
const THEME_POLL_MS = 100
const FRAME_MS = 1000 / 30
/** Seconds to scramble and dissolve a line, and to bring the next one in. */
const SWAP_OUT = 0.55
const SWAP_IN = 1.1

const VERTEX = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`

const FRAGMENT = `#version 300 es
precision highp float;
#define RIPPLES ${RIPPLES}
uniform sampler2D uText;
uniform sampler2D uGlyphs;
uniform vec2 uSize;
uniform vec2 uCell;
uniform float uGlyphCount;
uniform float uTextAspect;
uniform float uPlaneHeight;
uniform vec2 uTilt;
uniform float uTime;
uniform float uWaves;
uniform float uWaveSpeed;
uniform float uChroma;
uniform float uBlocks;
uniform vec3 uColors[3];
uniform vec3 uFill;
uniform float uHue;
uniform vec2 uPointer;
uniform float uHover;
uniform float uScramble;
uniform vec4 uRipples[RIPPLES];
uniform float uDissolve;
uniform float uReady;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 hueRotate(vec3 color, float angle) {
  const vec3 axis = vec3(0.57735);
  float c = cos(angle);
  return color * c + cross(axis, color) * sin(angle) + axis * dot(axis, color) * (1.0 - c);
}

vec4 scene(vec2 pixel) {
  vec2 ndc = vec2(pixel.x / uSize.x * 2.0 - 1.0, 1.0 - pixel.y / uSize.y * 2.0);
  float tanHalf = 0.41421356;
  vec3 dir = normalize(vec3(ndc.x * tanHalf * uSize.x / uSize.y, ndc.y * tanHalf, -1.0));
  vec3 origin = vec3(0.0, 0.0, 30.0);
  float cx = cos(uTilt.x), sx = sin(uTilt.x), cy = cos(uTilt.y), sy = sin(uTilt.y);
  mat3 rotation = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx) * mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  vec3 normal = rotation * vec3(0.0, 0.0, 1.0);
  float facing = dot(dir, normal);
  if (abs(facing) < 0.0001) return vec4(0.0);
  vec3 hit = origin + dir * (-dot(origin, normal) / facing);
  vec3 local = transpose(rotation) * hit;
  float planeHeight = 24.8528 * uPlaneHeight;
  float planeWidth = planeHeight * uTextAspect;
  float wave = 5.0 * sin(uTime * uWaveSpeed);
  local.x -= sin(wave + local.y) * 0.5 * uWaves;
  local.y -= cos(wave) * 0.15 * uWaves;
  local.xy /= 1.0 + sin(wave + local.x) * uWaves / 30.0;
  vec2 uv = vec2(local.x / planeWidth + 0.5, 0.5 - local.y / planeHeight);
  float t = sin(uTime);
  float red = texture(uText, uv + cos(t + uv.x) * 0.01 * uChroma).a;
  float green = texture(uText, uv + clamp(tan(uv.x - t * 0.5), -3.0, 3.0) * 0.01 * uChroma).a;
  float blue = texture(uText, uv - cos(t * 3.0 + uv.y) * 0.01 * uChroma).a;
  float base = texture(uText, uv).a;
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  return vec4(red, green, blue, base) * inside;
}

void main() {
  vec2 pixel = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  vec2 cell = floor(pixel / uCell);
  vec2 local = fract(pixel / uCell);
  vec2 center = (cell + 0.5) * uCell;
  float tick = floor(uTime * 18.0);

  float ring = 0.0;
  vec2 push = vec2(0.0);
  for (int i = 0; i < RIPPLES; i++) {
    vec4 ripple = uRipples[i];
    if (ripple.w <= 0.0) continue;
    float radius = ripple.z * max(uSize.x, uSize.y) * 0.75;
    float gap = abs(distance(center, ripple.xy) - radius);
    float band = max(uCell.y * 3.0, 24.0);
    float strength = (1.0 - smoothstep(0.0, 1.2, ripple.z)) * (1.0 - smoothstep(0.0, band, gap));
    ring = max(ring, strength);
    push += normalize(center - ripple.xy + 0.001) * strength * uCell.y * 1.5;
  }

  vec4 base = scene(center - push);
  float content = step(0.02, base.a);
  // brightness picks the glyph; the chroma split makes the edges busier
  float gray = clamp(dot(base.rgb, vec3(0.3, 0.6, 0.1)), 0.0, 1.0);
  float index = content > 0.0 ? max(1.0, floor(gray * (uGlyphCount - 1.0) + 0.5)) : 0.0;
  float randomGlyph = 1.0 + floor(hash(cell * 1.7 + tick * 0.37) * (uGlyphCount - 1.0));

  float reach = uSize.y * 0.18 * (0.5 + uScramble);
  float scramble = uHover * uScramble * (1.0 - smoothstep(reach * 0.35, reach, distance(center, uPointer)));
  if (content > 0.0 && hash(cell + tick * 7.13) < scramble * 0.8) index = randomGlyph;
  if (hash(cell + tick * 3.1) < ring) index = randomGlyph;
  // 0→1: cells scramble, then drop out; 1→0: they come back scrambled, then settle
  float decoding = step(hash(cell * 0.37 + 2.1), min(1.0, uDissolve * 2.0));
  float vanish = step(hash(cell * 0.71 + 5.3), max(0.0, uDissolve * 2.0 - 1.0));
  if (content > 0.0 && decoding > 0.0) index = randomGlyph;

  float mask = texture(uGlyphs, vec2((index + local.x) / uGlyphCount, local.y)).a;
  float glyphAlpha = mask * max(content * (1.0 - decoding * 0.35) * (1.0 - vanish), ring * 0.75);

  float spread = length((pixel - uSize * 0.5) / (uSize * 0.5)) * 0.7071;
  vec3 tint = mix(mix(uColors[0], uColors[1], smoothstep(0.0, 0.5, spread)), uColors[2], smoothstep(0.5, 1.0, spread));
  // the word's own cells, dim behind the glyphs, in the chroma-split colours
  float blockAlpha = base.a * uBlocks * (1.0 - uDissolve);
  vec3 under = uFill * base.rgb * blockAlpha;
  vec3 color = mix(under, tint, glyphAlpha);
  float alpha = max(blockAlpha, glyphAlpha) * uReady;
  color = clamp(hueRotate(color, uHue), 0.0, 1.0) * uReady;
  fragColor = vec4(color, alpha);
}`

type RGB = [number, number, number]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

let probe: CanvasRenderingContext2D | null = null
/** Any CSS colour to 0…1 RGB, through a canvas so every syntax works. */
function toRgb(color: string): RGB {
  probe ??= document.createElement('canvas').getContext('2d')
  if (!probe) return [1, 1, 1]
  probe.fillStyle = '#ffffff'
  probe.fillStyle = color.trim() || '#ffffff'
  const value = String(probe.fillStyle)
  if (value.startsWith('#')) {
    const hex = parseInt(value.slice(1, 7), 16)
    return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]
  }
  const parts = value.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255]
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255]
}

function drawText(text: string, fontFamily: string, fontWeight: number) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const font = `${fontWeight} ${TEXT_PX}px ${fontFamily}`
  ctx.font = font
  const width = Math.max(TEXT_PX * 0.6, ctx.measureText(text || ' ').width)
  canvas.width = Math.ceil(width + TEXT_PX * 0.3)
  canvas.height = Math.ceil(TEXT_PX * 1.3)
  ctx.font = font
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  return canvas
}

function drawGlyphs(charset: string, fontFamily: string) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const chars = Array.from(charset)
  canvas.width = chars.length * GLYPH_WIDTH
  canvas.height = GLYPH_HEIGHT
  ctx.font = `500 ${GLYPH_HEIGHT * 0.74}px ${fontFamily}`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  chars.forEach((char, i) => ctx.fillText(char, i * GLYPH_WIDTH + GLYPH_WIDTH / 2, GLYPH_HEIGHT / 2 + GLYPH_HEIGHT * 0.04))
  return canvas
}

type Props = {
  /** One line, or several to take turns with. */
  text: string | string[]
  /** Seconds each line holds before the next. */
  hold?: number
  /** Height of one character cell, in CSS pixels. */
  asciiFontSize?: number
  charset?: string
  fontFamily?: string
  fontWeight?: number
  textScale?: number
  /** How much of the word's own shape shows dimly behind the glyphs, 0…1. */
  blocks?: number
  waves?: number
  waveSpeed?: number
  chroma?: number
  tilt?: number
  /** How far the hue swings with the pointer's angle, 0…2. */
  hueShift?: number
  scramble?: number
  className?: string
}

const UNIFORMS = [
  'uText', 'uGlyphs', 'uSize', 'uCell', 'uGlyphCount', 'uTextAspect', 'uPlaneHeight', 'uTilt', 'uTime',
  'uWaves', 'uWaveSpeed', 'uChroma', 'uBlocks', 'uColors', 'uFill', 'uHue', 'uPointer', 'uHover',
  'uScramble', 'uRipples', 'uDissolve', 'uReady',
] as const

export default function Ascii({
  text,
  hold = 3,
  asciiFontSize = 8,
  charset = CHARSET,
  fontFamily = FONT,
  fontWeight = 700,
  textScale = 1,
  blocks = 0.3,
  waves = 0.45,
  waveSpeed = 1,
  chroma = 0.6,
  tilt = 0.75,
  hueShift = 0.15,
  scramble = 0.6,
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buildRef = useRef<((values: string[], family: string, weight: number, characters: string) => void) | null>(null)
  const [fallback, setFallback] = useState(false)
  const glyphs = Array.from(charset).length > 1 ? charset : CHARSET
  const lines = (Array.isArray(text) ? text : [text]).filter(Boolean)
  const linesKey = lines.join('\n')
  const settings = {
    cellSize: Math.max(3, asciiFontSize),
    textScale: clamp(textScale, 0.1, 3),
    blocks: clamp(blocks, 0, 1),
    waves: Math.max(0, waves),
    waveSpeed: Math.max(0, waveSpeed),
    chroma: Math.max(0, chroma),
    tilt: Math.max(0, tilt),
    hueShift: clamp(hueShift, 0, 2),
    scramble: clamp(scramble, 0, 1),
    hold: Math.max(0.5, hold),
  }
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false })
    let program: WebGLProgram | null = null
    if (gl) {
      const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
      const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
      if (vertex && fragment) {
        program = gl.createProgram()
        gl.attachShader(program, vertex)
        gl.attachShader(program, fragment)
        gl.bindAttribLocation(program, 0, 'position')
        gl.linkProgram(program)
        gl.deleteShader(vertex)
        gl.deleteShader(fragment)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          gl.deleteProgram(program)
          program = null
        }
      }
    }
    if (!gl || !program) {
      setFallback(true)
      return
    }
    const prog = program

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const textTextures: WebGLTexture[] = []
    const glyphTexture = gl.createTexture()
    const u = Object.fromEntries(UNIFORMS.map(name => [name, gl.getUniformLocation(prog, name)])) as
      Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>

    const upload = (texture: WebGLTexture, source: HTMLCanvasElement, smooth: boolean) => {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, smooth ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, smooth ? gl.LINEAR : gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    const state = {
      ready: false, aspects: [1], maxAspect: 1, glyphCount: 1, time: 0,
      tiltX: 0, tiltY: 0, hue: 0, hover: 0,
      /** Which line shows, and how far through a swap it is (0 settled, 1 gone). */
      line: 0, dissolve: 0, phase: 'hold' as 'hold' | 'out' | 'in', held: 0,
      pointerX: 0, pointerY: 0, targetX: 0, targetY: 0,
      inside: false, visible: false, introPlayed: false,
      ripples: [] as { x: number; y: number; age: number }[],
    }
    const rippleData = new Float32Array(RIPPLES * 4)
    const colorData = new Float32Array(9)
    const fillData = new Float32Array(3)
    let colorKey = ''
    let colorsReadAt = -Infinity
    let raf = 0
    let last = performance.now()
    let alive = true
    let resizePending = true

    /** The ramp's hot end at the middle, cooling to the edges — the cursor's colours. */
    const readColors = (now: number) => {
      if (now - colorsReadAt < THEME_POLL_MS) return
      colorsReadAt = now
      const styles = getComputedStyle(container)
      const values = ['--heat-4', '--heat-3', '--heat-2', '--accent'].map(name => styles.getPropertyValue(name))
      const key = values.join()
      if (key === colorKey) return
      colorKey = key
      colorData.set(values.slice(0, 3).flatMap(toRgb))
      fillData.set(toRgb(values[3]))
    }

    const build = (values: string[], family: string, weight: number, characters: string) => {
      const canvases = values.map(value => drawText(value, family, weight))
      const glyphCanvas = drawGlyphs(characters, family)
      if (!glyphCanvas || canvases.some(c => !c)) return
      while (textTextures.length < canvases.length) textTextures.push(gl.createTexture())
      textTextures.splice(canvases.length).forEach(t => gl.deleteTexture(t))
      canvases.forEach((c, i) => upload(textTextures[i], c!, false))
      upload(glyphTexture, glyphCanvas, true)
      state.aspects = canvases.map(c => c!.width / c!.height)
      state.maxAspect = Math.max(...state.aspects)
      state.glyphCount = Array.from(characters).length
      // reduced motion keeps the last line, which is usually the point
      state.line = reduce ? canvases.length - 1 : Math.min(state.line, canvases.length - 1)
      state.ready = true
    }

    let drawnAt = -Infinity
    const frame = (now: number) => {
      raf = 0
      if (!alive) return
      if (now - drawnAt < FRAME_MS - 2) {
        if (state.visible) raf = requestAnimationFrame(frame)
        return
      }
      drawnAt = now
      if (resizePending) {
        resizePending = false
        const dpr = Math.min(devicePixelRatio || 1, 2)
        const w = Math.max(1, Math.round(container.clientWidth * dpr))
        const h = Math.max(1, Math.round(container.clientHeight * dpr))
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w
          canvas.height = h
        }
      }
      const s = settingsRef.current
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
      last = now
      state.time += reduce ? 0 : dt
      const dpr = canvas.width / Math.max(1, container.clientWidth)

      let targetX = 0
      let targetY = 0
      if (state.inside) {
        targetX = state.targetY * 0.5 * s.tilt
        targetY = state.targetX * 0.5 * s.tilt
      } else if (!reduce) {
        targetX = Math.sin(state.time * 0.55) * 0.12 * s.tilt
        targetY = Math.sin(state.time * 0.4 + 1.3) * 0.2 * s.tilt
      }
      const follow = reduce ? 1 : 1 - Math.exp(-dt / 0.3)
      state.tiltX += (targetX - state.tiltX) * follow
      state.tiltY += (targetY - state.tiltY) * follow
      const angle = Math.atan2(state.targetY, state.targetX)
      const hueTarget = state.inside ? angle * s.hueShift : 0
      let delta = hueTarget - state.hue
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      state.hue += delta * (reduce ? 1 : 1 - Math.exp(-dt / 0.25))
      state.hover += ((state.inside ? 1 : 0) - state.hover) * (reduce ? 1 : 1 - Math.exp(-dt / 0.2))
      const count = state.aspects.length
      if (state.phase === 'hold' && count > 1 && !reduce && (state.held += dt) >= s.hold) state.phase = 'out'
      if (state.phase === 'out' && (state.dissolve += dt / SWAP_OUT) >= 1) {
        state.dissolve = 1
        state.line = (state.line + 1) % count
        state.phase = 'in'
      } else if (state.phase === 'in' && (state.dissolve -= dt / SWAP_IN) <= 0) {
        state.dissolve = 0
        state.phase = 'hold'
        state.held = 0
      }

      rippleData.fill(0)
      state.ripples = state.ripples.filter(ripple => (ripple.age += dt) < 1.3)
      state.ripples.slice(-RIPPLES).forEach((ripple, i) => {
        rippleData.set([ripple.x * dpr, ripple.y * dpr, ripple.age, 1], i * 4)
      })
      readColors(now)

      const width = canvas.width
      const height = canvas.height
      gl.viewport(0, 0, width, height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(prog)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, textTextures[state.line] ?? null)
      gl.uniform1i(u.uText, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, glyphTexture)
      gl.uniform1i(u.uGlyphs, 1)
      gl.uniform2f(u.uSize, width, height)
      gl.uniform2f(u.uCell, s.cellSize * 0.62 * dpr, s.cellSize * dpr)
      gl.uniform1f(u.uGlyphCount, state.glyphCount)
      gl.uniform1f(u.uTextAspect, state.aspects[state.line] ?? 1)
      // as tall as asked, but the longest line never wider than the box, so every
      // line is the same size and a phone shrinks them all to fit
      gl.uniform1f(u.uPlaneHeight, Math.min(0.5 * s.textScale, (0.86 * width) / height / state.maxAspect))
      gl.uniform2f(u.uTilt, state.tiltX, state.tiltY)
      gl.uniform1f(u.uTime, state.time)
      gl.uniform1f(u.uWaves, s.waves)
      gl.uniform1f(u.uWaveSpeed, s.waveSpeed)
      gl.uniform1f(u.uChroma, s.chroma)
      gl.uniform1f(u.uBlocks, s.blocks)
      gl.uniform3fv(u.uColors, colorData)
      gl.uniform3fv(u.uFill, fillData)
      gl.uniform1f(u.uHue, state.hue)
      gl.uniform2f(u.uPointer, state.pointerX * dpr, state.pointerY * dpr)
      gl.uniform1f(u.uHover, state.hover)
      gl.uniform1f(u.uScramble, s.scramble)
      gl.uniform4fv(u.uRipples, rippleData)
      gl.uniform1f(u.uDissolve, state.dissolve)
      gl.uniform1f(u.uReady, state.ready ? 1 : 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      // Still under reduced motion: draw again only while something is settling.
      const settling = state.dissolve > 0 || state.ripples.length > 0
      if (state.visible && (!reduce || settling)) raf = requestAnimationFrame(frame)
    }

    const wake = () => {
      if (raf || !alive || !state.visible) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }

    buildRef.current = (values, family, weight, characters) => {
      build(values, family, weight, characters)
      wake()
    }

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      state.pointerX = x
      state.pointerY = y
      state.targetX = clamp((x / Math.max(1, rect.width)) * 2 - 1, -1, 1)
      state.targetY = clamp((y / Math.max(1, rect.height)) * 2 - 1, -1, 1)
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      locate(event)
      state.inside = true
      wake()
    }
    const onLeave = () => {
      state.inside = false
      wake()
    }
    const onDown = (event: PointerEvent) => {
      locate(event)
      state.ripples.push({ x: state.pointerX, y: state.pointerY, age: 0 })
      wake()
    }

    const resizeObserver = new ResizeObserver(() => {
      resizePending = true
      wake()
    })
    resizeObserver.observe(container)
    const visibility = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting)
      // decode in from noise the first time it's actually seen
      if (state.visible && !state.introPlayed) {
        state.introPlayed = true
        if (!reduce) {
          state.dissolve = 1
          state.phase = 'in'
        }
      }
      if (state.visible) wake()
    })
    visibility.observe(container)
    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerdown', onDown)
    container.addEventListener('pointerleave', onLeave)
    const themeObserver = new MutationObserver(() => {
      colorsReadAt = -Infinity
      wake()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-hour', 'data-neon'] })

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      buildRef.current = null
      resizeObserver.disconnect()
      visibility.disconnect()
      themeObserver.disconnect()
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointerleave', onLeave)
      textTextures.forEach(t => gl.deleteTexture(t))
      gl.deleteTexture(glyphTexture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(prog)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = () => {
      if (!cancelled) buildRef.current?.(linesKey.split('\n'), fontFamily, fontWeight, glyphs)
    }
    run()
    const fonts = document.fonts
    Promise.all([
      fonts.load(`${fontWeight} ${TEXT_PX}px ${fontFamily}`, linesKey.replace(/\n/g, '') || 'A'),
      fonts.load(`500 ${GLYPH_HEIGHT}px ${fontFamily}`, glyphs),
    ]).catch(() => null).then(run)
    fonts.addEventListener('loadingdone', run)
    return () => {
      cancelled = true
      fonts.removeEventListener('loadingdone', run)
    }
  }, [linesKey, fontFamily, fontWeight, glyphs])

  return (
    <div ref={containerRef} className={`ascii ${className}`} role="img" aria-label={lines.join(' ')}>
      <canvas ref={canvasRef} aria-hidden />
      {fallback && <span className="ascii-fallback" style={{ fontFamily, fontWeight }}>{lines[lines.length - 1]}</span>}
    </div>
  )
}
