/* global process */
import assert from 'node:assert/strict'

import { seedTurboGarage } from '../seed/seedTurboGarage.js'
import {
  awardTaskRewards,
  purchaseTimeTokens,
  spendCoins,
} from '../services/economyService.js'
import {
  startScreenTimeSession,
} from '../services/screenTimeTimerService.js'
import { prisma } from '../prismaClient.js'

function toPgDate(dateStrYYYYMMDD) {
  return new Date(`${dateStrYYYYMMDD}T00:00:00.000Z`)
}

async function run() {
  const seeded = await seedTurboGarage({ defaultHardCapMinutesPerDay: 10 })

  const { familyId, localDate, members, taskTemplateIds, users } = seeded
  const kid1MemberId = members.kid1Id

  // Seed created screen_time_daily for today with remaining=0.
  const kidDaily0 = await prisma.screenTimeDaily.findUnique({
    where: { userId_localDate: { userId: users.kid1UserId, localDate: toPgDate(localDate) } },
  })
  assert.equal(kidDaily0.timeTokensRemainingMinutes, 0n)

  // 1) double click reward doesn't double-apply.
  {
    const templateId = taskTemplateIds.help_clean // xpReward=5, timeTokensRewardMinutes=5
    const taskInstance = await prisma.taskInstance.create({
      data: {
        templateId,
        assigneeMemberId: kid1MemberId,
        localDate: toPgDate(localDate),
        status: 'PENDING',
      },
    })

    const idempotencyKey = 'test-reward-double-click'
    await awardTaskRewards({ idempotencyKey, familyId, taskInstanceId: taskInstance.id })
    const after1 = await prisma.walletBalance.findUnique({ where: { familyMemberId: kid1MemberId } })
    const dailyAfter1 = await prisma.dailyUserState.findUnique({
      where: { userId_localDate: { userId: users.kid1UserId, localDate: toPgDate(localDate) } },
    })
    const screenAfter1 = await prisma.screenTimeDaily.findUnique({
      where: { userId_localDate: { userId: users.kid1UserId, localDate: toPgDate(localDate) } },
    })

    await awardTaskRewards({ idempotencyKey, familyId, taskInstanceId: taskInstance.id })

    const after2 = await prisma.walletBalance.findUnique({ where: { familyMemberId: kid1MemberId } })
    const dailyAfter2 = await prisma.dailyUserState.findUnique({
      where: { userId_localDate: { userId: users.kid1UserId, localDate: toPgDate(localDate) } },
    })
    const screenAfter2 = await prisma.screenTimeDaily.findUnique({
      where: { userId_localDate: { userId: users.kid1UserId, localDate: toPgDate(localDate) } },
    })

    assert.equal(after1.xpTotal, 5n)
    assert.equal(dailyAfter1.xpTotal, 5n)
    assert.equal(screenAfter1.timeTokensRemainingMinutes, 5n)

    assert.equal(after2.xpTotal, after1.xpTotal)
    assert.equal(dailyAfter2.xpTotal, dailyAfter1.xpTotal)
    assert.equal(screenAfter2.timeTokensRemainingMinutes, screenAfter1.timeTokensRemainingMinutes)
  }

  // 2) cannot buy time tokens beyond cap.
  {
    const txIdem = 'test-time-tokens-cap-violation'
    let threw = false
    try {
      await purchaseTimeTokens({
        idempotencyKey: txIdem,
        familyId,
        subjectMemberId: kid1MemberId,
        timeTokensMinutesToPurchase: 11,
        coinsToSpend: 100,
        defaultHardCapMinutesPerDay: 10,
      })
    } catch (e) {
      threw = true
      assert.match(String(e.message ?? e), /cap/i)
    }
    assert.equal(threw, true)

    const screen = await prisma.screenTimeDaily.findUnique({
      where: { userId_localDate: { userId: users.kid1UserId, localDate: toPgDate(localDate) } },
    })
    // Still 5 after reward; cap is 10, so buying 11 would exceed (5+11=16)
    assert.equal(screen.timeTokensRemainingMinutes, 5n)
  }

  // 3) cannot start second active timer.
  {
    // Ensure remaining > 0. Already 5 after reward.
    const start1 = await startScreenTimeSession({
      idempotencyKey: 'start-1',
      familyId,
      childMemberId: kid1MemberId,
      activityType: 'GAME',
    })
    assert.ok(start1.sessionId)

    let threw = false
    try {
      await startScreenTimeSession({
        idempotencyKey: 'start-2',
        familyId,
        childMemberId: kid1MemberId,
        activityType: 'GAME',
      })
    } catch {
      threw = true
    }
    assert.equal(threw, true)

    const activeCount = await prisma.screenTimeSession.count({
      where: { childMemberId: kid1MemberId, status: 'ACTIVE' },
    })
    assert.equal(activeCount, 1)
  }

  // 4) coins cannot go negative.
  {
    const wallet = await prisma.walletBalance.findUnique({ where: { familyMemberId: kid1MemberId } })
    let threw = false
    try {
      await spendCoins({
        idempotencyKey: 'coins-no-negative',
        familyId,
        subjectMemberId: kid1MemberId,
        coinsToSpend: Number(wallet.coinsBalance) + 1,
        reason: 'overspend',
      })
    } catch {
      threw = true
    }
    assert.equal(threw, true)

    const walletAfter = await prisma.walletBalance.findUnique({ where: { familyMemberId: kid1MemberId } })
    assert.equal(walletAfter.coinsBalance, wallet.coinsBalance)
  }

  console.log('[Turbo-Garage] runtime assertions: OK')
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[Turbo-Garage] runtime assertions: FAILED', e)
    process.exit(1)
  })

