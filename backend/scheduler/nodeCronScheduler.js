import cron from 'node-cron'

import { runDailyRolloverJob } from '../jobs/dailyRolloverJob.js'
import { runTaskInstanceGeneratorJob } from '../jobs/taskInstanceGeneratorJob.js'
import { runSessionExpirerJob } from '../jobs/sessionExpirerJob.js'

export function startNodeCronScheduler({ defaultHardCapMinutesPerDay = 60 } = {}) {
  // Domain jobs are separated from scheduling so we can swap scheduler later.

  const jobs = []

  // daily-rollover: run at 00:10 UTC
  jobs.push(
    cron.schedule('10 0 * * *', () => {
      runDailyRolloverJob({ defaultHardCapMinutesPerDay }).catch((e) => console.error('daily-rollover failed', e))
    })
  )

  // task-instance-generator: run at 00:20 UTC
  jobs.push(
    cron.schedule('20 0 * * *', () => {
      runTaskInstanceGeneratorJob().catch((e) => console.error('task-instance-generator failed', e))
    })
  )

  // session-expirer: run every minute
  jobs.push(
    cron.schedule('* * * * *', () => {
      runSessionExpirerJob().catch((e) => console.error('session-expirer failed', e))
    })
  )

  return {
    stopAll() {
      for (const j of jobs) j.stop()
    },
  }
}

