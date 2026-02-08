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

/** Chime when a daily mission is completed (placeholder: reuses coin sound). */
export function playChime() {
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

/** Cash register / deduct sound when session finishes */
function cashRegisterFallback() {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(1200, now)
    osc1.frequency.setValueAtTime(900, now + 0.08)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.02)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
    osc1.start(now)
    osc1.stop(now + 0.12)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(800, now + 0.1)
    osc2.frequency.setValueAtTime(600, now + 0.18)
    gain2.gain.setValueAtTime(0, now + 0.1)
    gain2.gain.linearRampToValueAtTime(0.1, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22)
    osc2.start(now + 0.1)
    osc2.stop(now + 0.22)
  } catch (_) {}
}

export function playCashRegister() {
  playMp3('coin', cashRegisterFallback)
}

/** Very quiet tick when 1 XP is deducted each minute (burn cycle complete). */
function burnTickFallback() {
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
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.04, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    osc.start(now)
    osc.stop(now + 0.06)
  } catch (_) {}
}

export function playBurnTick() {
  burnTickFallback()
}
