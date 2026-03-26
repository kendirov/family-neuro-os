/* global process */

import { startNodeCronScheduler } from './scheduler/nodeCronScheduler.js'

// Minimal always-on scheduler entrypoint.
// Later you can replace scheduler implementation without changing job/domain code.
const scheduler = startNodeCronScheduler()

console.log('[Turbo-Garage] scheduler started')

process.on('SIGINT', () => {
  scheduler.stopAll()
  console.log('[Turbo-Garage] scheduler stopped')
  process.exit(0)
})

