/* global process */

import { seedTurboGarage } from './seedTurboGarage.js'

const hardCap = process.env.DEFAULT_HARD_CAP_MINUTES_PER_DAY ? Number(process.env.DEFAULT_HARD_CAP_MINUTES_PER_DAY) : 60

seedTurboGarage({ defaultHardCapMinutesPerDay: hardCap })
  .then((res) => {
    console.log('[Turbo-Garage] seeded:', {
      familyId: res.familyId,
      members: res.members,
      rewardCatalogCodes: res.rewardCatalogCodes,
    })
  })
  .catch((e) => {
    console.error('[Turbo-Garage] seed failed', e)
    process.exit(1)
  })

