/** The homepage's sound: off unless the visitor turns it on.
 *
 *  Everything is synthesised on the spot with Web Audio — square waves and
 *  crushed noise, like an old console's sound chip — so there are no files to
 *  download and it matches the pixels. Two moments make a sound:
 *
 *    boom(neon)  the held-click burst (Trail.tsx): a falling thump, a crackle,
 *                and a four-note run that climbs when neon comes on and falls
 *                when it goes off
 *    hum(...)    the black-hole passage (BlackHole.tsx): a drone that sinks
 *                lower and darker the closer you fall, then climbs and opens
 *                up as the light pours out, and fades — set by scroll like
 *                the picture is, so scrolling back plays it backwards
 *
 *    tick(...)   any single click: a soft, short blip, a touch brighter on
 *                something that does something (SoundToggle.tsx)
 *
 *  The choice is remembered in localStorage. A browser only lets a page make
 *  sound after a click or key press, so a visitor who left it on last time
 *  hears it from their first click this time. A hidden tab goes quiet.
 */

const KEY = 'home-sound'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let enabled = false
const listeners = new Set<(on: boolean) => void>()

type Hum = { gain: GainNode; filter: BiquadFilterNode; low: OscillatorNode; fifth: OscillatorNode; level: number; pitch: number; open: number }
let drone: Hum | null = null

export const soundOn = () => enabled

export function onSoundChange(listener: (on: boolean) => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.45
    master.connect(ctx.destination)
    // a short run of noise held in steps of six samples: the bit-crushed hiss
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0, v = 0; i < data.length; i++) {
      if (i % 6 === 0) v = Math.random() * 2 - 1
      data[i] = v
    }
  }
  if (ctx.state === 'suspended' && enabled && !document.hidden) void ctx.resume()
  return ctx
}

export function setSound(on: boolean) {
  enabled = on
  try { localStorage.setItem(KEY, on ? '1' : '0') } catch {}
  if (on) audio()
  else {
    hum(0)
    if (ctx) void ctx.suspend()
  }
  listeners.forEach(listener => listener(on))
}

/** Picks up last visit's choice; the first click or key press lets it play. */
export function restoreSound() {
  let saved = false
  try { saved = localStorage.getItem(KEY) === '1' } catch {}
  if (!saved) return () => {}
  enabled = true
  listeners.forEach(listener => listener(true))
  const unlock = () => { if (enabled) audio() }
  addEventListener('pointerdown', unlock, { once: true, capture: true })
  addEventListener('keydown', unlock, { once: true, capture: true })
  return () => {
    removeEventListener('pointerdown', unlock, { capture: true })
    removeEventListener('keydown', unlock, { capture: true })
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) void ctx.suspend()
    else if (enabled) void ctx.resume()
  })
}

function square(c: AudioContext, at: number, freq: number, length: number, volume: number) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(gain).connect(master!)
  osc.start(at)
  osc.stop(at + length + 0.02)
}

/** The held-click burst. `neon` is whether the page has just gone neon. */
export function boom(neon: boolean) {
  if (!enabled) return
  const c = audio()
  const t = c.currentTime + 0.01

  // the thump: a square wave falling through two octaves, softened a little
  const thump = c.createOscillator()
  const thumpGain = c.createGain()
  const soften = c.createBiquadFilter()
  thump.type = 'square'
  thump.frequency.setValueAtTime(190, t)
  thump.frequency.exponentialRampToValueAtTime(36, t + 0.34)
  soften.type = 'lowpass'
  soften.frequency.value = 1100
  thumpGain.gain.setValueAtTime(0.0001, t)
  thumpGain.gain.exponentialRampToValueAtTime(0.55, t + 0.008)
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.48)
  thump.connect(soften).connect(thumpGain).connect(master!)
  thump.start(t)
  thump.stop(t + 0.5)

  // the crackle: crushed noise whose top end closes down as it dies
  const crackle = c.createBufferSource()
  const crackleFilter = c.createBiquadFilter()
  const crackleGain = c.createGain()
  crackle.buffer = noise
  crackleFilter.type = 'lowpass'
  crackleFilter.frequency.setValueAtTime(5200, t)
  crackleFilter.frequency.exponentialRampToValueAtTime(260, t + 0.4)
  crackleGain.gain.setValueAtTime(0.32, t)
  crackleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42)
  crackle.connect(crackleFilter).connect(crackleGain).connect(master!)
  crackle.start(t)
  crackle.stop(t + 0.45)

  // the run: C E G C up into neon, back down out of it
  const notes = [523.25, 659.25, 783.99, 1046.5]
  ;(neon ? notes : [...notes].reverse()).forEach((freq, i) => square(c, t + 0.16 + i * 0.065, freq, 0.12, 0.09))
}

/** A single click: a quiet triangle blip that dips as it dies, a little
 *  brighter on a link or button. Its pitch wanders a hair each time so a run
 *  of clicks doesn't sound like a machine. */
export function tick(active = false) {
  if (!enabled) return
  const c = audio()
  const t = c.currentTime + 0.005
  const osc = c.createOscillator()
  const gain = c.createGain()
  const soft = c.createBiquadFilter()
  const freq = (active ? 1180 : 780) * (1 + (Math.random() - 0.5) * 0.06)
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.62, t + 0.05)
  soft.type = 'lowpass'
  soft.frequency.value = 2400
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(active ? 0.075 : 0.055, t + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.075)
  osc.connect(soft).connect(gain).connect(master!)
  osc.start(t)
  osc.stop(t + 0.09)
}

/** The passage's drone. `level` 0…1 is how loud; `pitch` multiplies its
 *  resting note (below 1 lower, above 1 higher); `open` 0…1 is how bright. */
export function hum(level: number, pitch = 1, open = 0.3) {
  if (!ctx || (!enabled && !drone)) return
  if (!enabled) level = 0
  if (!drone) {
    if (level < 0.005) return
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const low = ctx.createOscillator()
    const fifth = ctx.createOscillator()
    gain.gain.value = 0
    filter.type = 'lowpass'
    filter.Q.value = 4
    low.type = 'sawtooth'
    fifth.type = 'triangle'
    low.frequency.value = 55
    fifth.frequency.value = 82.4
    low.connect(filter)
    fifth.connect(filter)
    filter.connect(gain).connect(master!)
    low.start()
    fifth.start()
    drone = { gain, filter, low, fifth, level: -1, pitch: -1, open: -1 }
  }
  // the passage redraws every frame; only re-aim the drone when it really moves
  if (Math.abs(level - drone.level) < 0.01 && Math.abs(pitch - drone.pitch) < 0.005 && Math.abs(open - drone.open) < 0.01) return
  drone.level = level
  drone.pitch = pitch
  drone.open = open
  const t = ctx.currentTime
  drone.gain.gain.setTargetAtTime(level * 0.32, t, 0.08)
  // never fully shut: laptop speakers can't play the fundamental, only its overtones
  drone.filter.frequency.setTargetAtTime(220 + open * 1800, t, 0.1)
  drone.low.frequency.setTargetAtTime(55 * pitch, t, 0.12)
  drone.fifth.frequency.setTargetAtTime(82.4 * pitch, t, 0.12)
}
