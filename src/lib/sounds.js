/**
 * Sound effects: browser Audio API with Web Audio fallback when .mp3 missing.
 */

const SOUNDS = {
  coin: '/sounds/coin.mp3',
  start: '/sounds/start.mp3',
  alarm: '/sounds/alarm.mp3',
  error: '/sounds/error.mp3',
  siren: '/sounds/siren.mp3',
}

let audioContext = null
function getContext() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)()
  return audioContext
}

function playMp3(name, onError) {
  const audio = new Audio(SOUNDS[name])
  audio.volume = 0.7
  if (onError) audio.addEventListener('error', onError)
  audio.play().catch(() => onError?.())
}

function coinFallback() {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.type = 'sine'
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  } catch (_) {}
}

function startFallback() {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch (_) {}
}

function alarmFallback() {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, now + i * 0.5)
      osc.frequency.setValueAtTime(660, now + i * 0.5 + 0.15)
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, now + i * 0.5)
      gain.gain.linearRampToValueAtTime(0.4, now + i * 0.5 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.5 + 0.4)
      osc.start(now + i * 0.5)
      osc.stop(now + i * 0.5 + 0.4)
    }
  } catch (_) {}
}

/** Error/buzz when penalty applied */
function errorFallback() {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.setValueAtTime(80, now + 0.1)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
    osc.start(now)
    osc.stop(now + 0.25)
  } catch (_) {}
}

/** Engine revving when timer starts */
function engineRevFallback() {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(80, now)
    osc.frequency.linearRampToValueAtTime(120, now + 0.15)
    osc.frequency.linearRampToValueAtTime(200, now + 0.4)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
    osc.start(now)
    osc.stop(now + 0.5)
  } catch (_) {}
}

/** Siren once when entering overdrive */
function sirenFallback() {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.linearRampToValueAtTime(900, now + 0.3)
    osc.frequency.linearRampToValueAtTime(600, now + 0.6)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7)
    osc.start(now)
    osc.stop(now + 0.7)
  } catch (_) {}
}

/** Positive ding / coin when points added */
export function playCoin() {
  playMp3('coin', coinFallback)
}

/** Sci-fi power-up (legacy) */
export function playStart() {
  playMp3('start', startFallback)
}

/** Engine rev when timer starts */
export function playEngineRev() {
  playMp3('start', engineRevFallback)
}

/** Alarm when timer ends */
export function playAlarm() {
  playMp3('alarm', alarmFallback)
}

/** Error/buzz when penalty */
export function playError() {
  playMp3('error', errorFallback)
}

/** Siren once when entering overdrive */
export function playSiren() {
  playMp3('siren', sirenFallback)
}
