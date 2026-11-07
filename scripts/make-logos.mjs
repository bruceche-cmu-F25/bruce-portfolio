#!/usr/bin/env node
/** Redraws the organisation logos as colour dither, in each brand's own colours.
 *
 *    node scripts/make-logos.mjs
 *
 *  Each logo is trimmed of its white margin, scaled to twice the size the page
 *  draws it at (so on a retina screen one dither dot is one device pixel),
 *  and error-diffused down to solid dots on transparent. A dot keeps the
 *  colour of the logo under it, lifted just enough to read on the dark page:
 *  near-black ink turns to a light grey, and very dark brand colours (UCSD's
 *  navy) are raised to a mid tone. White inside a mark, like the branch on
 *  AGAI's shield, drops out, so the page shows through it.
 *
 *  Every mark is fitted to the same box — `box` below, in CSS pixels — so the
 *  symbols stand the same height and the wordmark spans the same width.
 *
 *  There is no image library in this repo, so the drawing is done by the
 *  system's Chrome, driven headless over the DevTools protocol.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'logos', 'color')
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/** `box` is [width, height] in CSS pixels: the mark is scaled to fit inside it. */
const LOGOS = {
  agai: { src: 'public/logos/agai.webp', box: [34, 34] },
  convoloo: { src: 'public/logos/convoloo.webp', box: [34, 34] },
  cmu: { src: 'public/images/cmu-seal.webp', box: [34, 34] },
  ucsd: { src: 'public/images/ucsd-seal.webp', box: [34, 34] },
  helport: { src: 'public/logos/helport.webp', box: [84, 34] },
}
const SCALE = 2

const sleep = ms => new Promise(r => setTimeout(r, ms))
const PORT = 9400 + Math.floor(Math.random() * 500)
const profile = mkdtempSync(join(tmpdir(), 'logos-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' })
setTimeout(() => { console.error('logos: Chrome timed out'); try { chrome.kill('SIGKILL') } catch {} process.exit(2) }, 60_000).unref()

let target
for (let i = 0; i < 40 && !target; i++) {
  await sleep(250)
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(t => t.type === 'page') } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(r => ws.addEventListener('open', r))
let id = 0
const pending = new Map()
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } })
const send = (method, params = {}) => new Promise(r => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })) })

/** Runs in the page: returns { png, w, h } for one logo. */
const draw = (dataUrl, boxW, boxH) => new Promise(resolve => {
  const img = new Image()
  img.onload = () => {
    // 1. read the source at full size, flattened onto white
    const src = document.createElement('canvas')
    src.width = img.naturalWidth; src.height = img.naturalHeight
    const s = src.getContext('2d', { willReadFrequently: true })
    s.fillStyle = '#fff'; s.fillRect(0, 0, src.width, src.height); s.drawImage(img, 0, 0)
    const full = s.getImageData(0, 0, src.width, src.height).data
    const ink = (r, g, b) => Math.max(0, Math.min(1, (255 - Math.min(r, g, b)) / 190))
    // 2. trim the white margin
    let x0 = src.width, y0 = src.height, x1 = -1, y1 = -1
    for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
      const i = (y * src.width + x) * 4
      if (ink(full[i], full[i + 1], full[i + 2]) > 0.12) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
    }
    const tw = x1 - x0 + 1, th = y1 - y0 + 1
    // 3. fit it to the box, at twice the size it will be drawn
    const fit = Math.min(boxW / tw, boxH / th)
    const w = Math.max(1, Math.round(tw * fit * 2)), h = Math.max(1, Math.round(th * fit * 2))
    const small = document.createElement('canvas')
    small.width = w; small.height = h
    const c = small.getContext('2d', { willReadFrequently: true })
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, h)
    c.imageSmoothingQuality = 'high'
    c.drawImage(src, x0, y0, tw, th, 0, 0, w, h)
    const px = c.getImageData(0, 0, w, h)
    const d = px.data
    // 4. coverage per pixel, error-diffused (Floyd–Steinberg) into solid dots
    const cover = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) cover[i] = ink(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])
    const keep = new Uint8Array(w * h)
    const err = Float32Array.from(cover)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x
      const on = err[i] >= 0.5 ? 1 : 0
      keep[i] = on
      const e = err[i] - on
      if (x + 1 < w) err[i + 1] += e * 7 / 16
      if (y + 1 < h) {
        if (x > 0) err[i + w - 1] += e * 3 / 16
        err[i + w] += e * 5 / 16
        if (x + 1 < w) err[i + w + 1] += e * 1 / 16
      }
    }
    // 5. each dot takes the logo's own colour, un-mixed from the white it was
    //    blended with and lifted to read on a dark page
    const toHsl = (r, g, b) => {
      r /= 255; g /= 255; b /= 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
      if (max === min) return [0, 0, l]
      const dd = max - min, sat = l > 0.5 ? dd / (2 - max - min) : dd / (max + min)
      const hue = max === r ? (g - b) / dd + (g < b ? 6 : 0) : max === g ? (b - r) / dd + 2 : (r - g) / dd + 4
      return [hue / 6, sat, l]
    }
    const fromHsl = (hh, ss, ll) => {
      if (!ss) return [ll, ll, ll].map(v => Math.round(v * 255))
      const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss, p = 2 * ll - q
      const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p }
      return [f(hh + 1 / 3), f(hh), f(hh - 1 / 3)].map(v => Math.round(v * 255))
    }
    for (let i = 0; i < w * h; i++) {
      if (!keep[i]) { d[i * 4 + 3] = 0; continue }
      const a = Math.max(0.35, cover[i])
      const un = k => Math.max(0, Math.min(255, 255 - (255 - d[i * 4 + k]) / a))
      let [hh, ss, ll] = toHsl(un(0), un(1), un(2))
      if (ss < 0.18) ll = Math.max(ll, 0.74)           // black type → light grey
      else ll = Math.min(0.8, Math.max(ll, 0.44))      // dark brand colours → mid tone
      const [r, g, b] = fromHsl(hh, ss, ll)
      d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255
    }
    c.putImageData(px, 0, 0)
    resolve({ png: small.toDataURL('image/png').split(',')[1], w, h })
  }
  img.src = dataUrl
})

mkdirSync(OUT, { recursive: true })
for (const [name, spec] of Object.entries(LOGOS)) {
  const file = join(ROOT, spec.src)
  const type = file.endsWith('.png') ? 'png' : 'webp'
  const dataUrl = `data:image/${type};base64,${readFileSync(file).toString('base64')}`
  const r = await send('Runtime.evaluate', {
    expression: `(${draw.toString()})(${JSON.stringify(dataUrl)}, ${spec.box[0]}, ${spec.box[1]})`,
    awaitPromise: true, returnByValue: true,
  })
  const { png, w, h } = r.result.value
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(png, 'base64'))
  console.log(`logos: public/logos/color/${name}.png — ${w}×${h} (drawn at ${w / SCALE}×${h / SCALE})`)
}

ws.close()
chrome.kill('SIGKILL')
await sleep(300)
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
