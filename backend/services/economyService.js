import { prisma } from '../prismaClient.js'
import { getLocalDateStringInTimezone } from '../lib/timezone.js'
import { assert, assertNonNegativeInt, assertPositiveInt } from '../lib/assert.js'
import { withSuffix } from '../lib/idempotency.js'

function computeLevelFromXp(xpTotalBigInt) {
  // Minimal leveling curve: level = floor(xp/500) + 1
  const base = 500n
  const level = xpTotalBigInt / base + 1n
  // Prisma field is Int; assume level fits.
  return Number(level)
}

function bigInt(value) {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(Math.trunc(value))
  return BigInt(String(value))
}

function toPgDate(dateStrYYYYMMDD) {
  // dateStr is expected as YYYY-MM-DD.
  // Prisma/@db.Date expects a Date instance.
  return new Date(`${dateStrYYYYMMDD}T00:00:00.000Z`)
}

async function getOrCreateDailyUserState(tx, { userId, familyId, localDate }) {
  const existing = await tx.dailyUserState.findUnique({
    where: { userId_localDate: { userId, localDate } },
  })
  if (existing) return existing

  return tx.dailyUserState.create({
    data: {
      userId,
      familyId,
      localDate,
      xpTotal: 0n,
      level: 1,
      coinsBalance: 0n,
    },
  })
}

async function getOrCreateWalletBalance(tx, { familyMemberId }) {
  const existing = await tx.walletBalance.findUnique({
    where: { familyMemberId },
  })
  if (existing) return existing

  return tx.walletBalance.create({
    data: {
      familyMemberId,
      xpTotal: 0n,
      coinsBalance: 0n,
    },
  })
}

async function getOrCreateScreenTimeDaily(tx, { userId, familyId, localDate, defaultHardCapMinutesPerDay }) {
  const existing = await tx.screenTimeDaily.findUnique({
    where: { userId_localDate: { userId, localDate } },
  })
  if (existing) return existing

  return tx.screenTimeDaily.create({
    data: {
      userId,
      familyId,
      localDate,
      hardCapMinutesPerDay: defaultHardCapMinutesPerDay,
      timeTokensSpentMinutes: 0n,
      timeTokensRemainingMinutes: 0n,
      timeTokensExpiredMinutes: 0n,
    },
  })
}

export async function awardTaskRewards({ idempotencyKey, familyId, taskInstanceId, defaultHardCapMinutesPerDay = 60 }) {
  assert(idempotencyKey, 'idempotencyKey is required')

  return prisma.$transaction(async (tx) => {
    const inst = await tx.taskInstance.findUnique({
      where: { id: taskInstanceId },
      include: { template: true },
    })
    assert(inst, 'TaskInstance not found')
    assert(inst.template.familyId === familyId, 'TaskInstance belongs to a different family')

    // Fast path: already completed (avoids unnecessary projection reads).
    if (inst.status !== 'PENDING') {
      return { taskInstanceId, status: inst.status, skipped: true }
    }

    const now = new Date()
    const family = await tx.family.findUnique({ where: { id: familyId } })
    assert(family, 'Family not found')
    const localDateStr = getLocalDateStringInTimezone(family.timezone, now)
    const localDate = toPgDate(localDateStr)

    // Ledger + projections for subject member.
    const subjectMemberId = inst.assigneeMemberId

    const template = inst.template
    const xpReward = bigInt(template.xpReward)
    const coinsReward = bigInt(template.coinsReward)
    const timeTokensRewardMinutes = Number(template.timeTokensRewardMinutes ?? 0)

    // Compute new projections first to fail fast on caps.
    const subjectWallet = await getOrCreateWalletBalance(tx, { familyMemberId: subjectMemberId })
    const dailyUser = await getOrCreateDailyUserState(tx, { userId: await subjectUserId(tx, subjectMemberId), familyId, localDate })

    let screenTimeDaily = null
    if (timeTokensRewardMinutes > 0) {
      const subjectUserIdVal = await subjectUserId(tx, subjectMemberId)
      screenTimeDaily = await getOrCreateScreenTimeDaily(tx, {
        userId: subjectUserIdVal,
        familyId,
        localDate,
        defaultHardCapMinutesPerDay,
      })

      const hardCap = BigInt(screenTimeDaily.hardCapMinutesPerDay)
      const nextRemaining = bigInt(screenTimeDaily.timeTokensRemainingMinutes) + BigInt(timeTokensRewardMinutes)
      assert(nextRemaining <= hardCap, 'Time tokens cap exceeded')
    }

    // Mark completed first (atomic state transition) to avoid concurrent double-awards.
    const updated = await tx.taskInstance.updateMany({
      where: { id: taskInstanceId, status: 'PENDING' },
      data: { status: 'COMPLETED', completedAt: now },
    })
    if (updated.count !== 1) {
      return { taskInstanceId, status: inst.status, skipped: true }
    }

    // Create ledger rows (idempotency keys derived per asset).
    const ledgerCreates = []

    if (xpReward > 0n) {
      ledgerCreates.push(
        tx.economyTransaction.create({
          data: {
            familyId,
            subjectMemberId,
            assetType: 'XP',
            txType: 'XP_EARN',
            amount: xpReward,
            idempotencyKey: withSuffix(idempotencyKey, 'xp'),
            localDate,
            sourceEntity: 'TASK_INSTANCE',
            sourceId: taskInstanceId,
            taskInstanceId,
            meta: null,
          },
        })
      )
    }

    if (coinsReward > 0n) {
      ledgerCreates.push(
        tx.economyTransaction.create({
          data: {
            familyId,
            subjectMemberId,
            assetType: 'COINS',
            txType: 'COINS_EARN',
            amount: coinsReward,
            idempotencyKey: withSuffix(idempotencyKey, 'coins'),
            localDate,
            sourceEntity: 'TASK_INSTANCE',
            sourceId: taskInstanceId,
            taskInstanceId,
            meta: null,
          },
        })
      )
    }

    if (timeTokensRewardMinutes > 0) {
      ledgerCreates.push(
        tx.economyTransaction.create({
          data: {
            familyId,
            subjectMemberId,
            assetType: 'TIME_TOKENS',
            txType: 'TIME_TOKENS_EARN',
            amount: BigInt(timeTokensRewardMinutes),
            idempotencyKey: withSuffix(idempotencyKey, 'time_tokens'),
            localDate,
            sourceEntity: 'TASK_INSTANCE',
            sourceId: taskInstanceId,
            taskInstanceId,
            meta: null,
          },
        })
      )
    }

    await Promise.all(ledgerCreates)

    // Apply projections.
    if (xpReward > 0n) {
      const nextXpTotal = bigInt(subjectWallet.xpTotal) + xpReward
      await tx.walletBalance.update({
        where: { familyMemberId: subjectMemberId },
        data: { xpTotal: nextXpTotal },
      })

      const nextDailyXp = bigInt(dailyUser.xpTotal) + xpReward
      await tx.dailyUserState.update({
        where: { userId_localDate: { userId: dailyUser.userId, localDate } },
        data: { xpTotal: nextDailyXp, level: computeLevelFromXp(nextDailyXp) },
      })
    }

    if (coinsReward > 0n) {
      const nextCoins = bigInt(subjectWallet.coinsBalance) + coinsReward
      await tx.walletBalance.update({
        where: { familyMemberId: subjectMemberId },
        data: { coinsBalance: nextCoins },
      })

      const nextDailyCoins = bigInt(dailyUser.coinsBalance) + coinsReward
      await tx.dailyUserState.update({
        where: { userId_localDate: { userId: dailyUser.userId, localDate } },
        data: { coinsBalance: nextDailyCoins },
      })
    }

    if (timeTokensRewardMinutes > 0 && screenTimeDaily) {
      const nextRemaining = bigInt(screenTimeDaily.timeTokensRemainingMinutes) + BigInt(timeTokensRewardMinutes)
      await tx.screenTimeDaily.update({
        where: { userId_localDate: { userId: screenTimeDaily.userId, localDate } },
        data: {
          timeTokensRemainingMinutes: nextRemaining,
        },
      })
    }

    return { taskInstanceId, status: 'COMPLETED', skipped: false }
  })
}

async function subjectUserId(tx, subjectMemberId) {
  const m = await tx.familyMember.findUnique({ where: { id: subjectMemberId } })
  assert(m, 'FamilyMember not found')
  return m.userId
}

export async function spendCoins({ idempotencyKey, familyId, subjectMemberId, coinsToSpend, reason = 'COINS_SPEND' }) {
  assert(idempotencyKey, 'idempotencyKey is required')
  assertNonNegativeInt(coinsToSpend, 'coinsToSpend')
  assert(coinsToSpend > 0, 'coinsToSpend must be > 0')

  return prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWalletBalance(tx, { familyMemberId: subjectMemberId })
    assert(wallet.coinsBalance >= BigInt(coinsToSpend), 'insufficient coins')

    const now = new Date()
    const family = await tx.family.findUnique({ where: { id: familyId } })
    assert(family, 'Family not found')
    const localDateStr = getLocalDateStringInTimezone(family.timezone, now)
    const localDate = toPgDate(localDateStr)

    await tx.walletBalance.update({
      where: { familyMemberId: subjectMemberId },
      data: { coinsBalance: bigInt(wallet.coinsBalance) - BigInt(coinsToSpend) },
    })

    // Projection update: keep daily snapshot aligned (minimal consistency).
    const userId = await subjectUserId(tx, subjectMemberId)
    const dailyUser = await getOrCreateDailyUserState(tx, { userId, familyId, localDate })
    await tx.dailyUserState.update({
      where: { userId_localDate: { userId: dailyUser.userId, localDate } },
      data: { coinsBalance: bigInt(dailyUser.coinsBalance) - BigInt(coinsToSpend) },
    })

    await tx.economyTransaction.create({
      data: {
        familyId,
        subjectMemberId,
        assetType: 'COINS',
        txType: 'COINS_SPEND',
        amount: BigInt(coinsToSpend),
        idempotencyKey,
        localDate,
        sourceEntity: 'SYSTEM',
        sourceId: reason,
        meta: null,
      },
    })

    return { ok: true }
  })
}

export async function purchaseTimeTokens({
  idempotencyKey,
  familyId,
  subjectMemberId,
  timeTokensMinutesToPurchase,
  coinsToSpend,
  defaultHardCapMinutesPerDay = 60,
  reason = 'TIME_TOKENS_PURCHASE',
}) {
  assert(idempotencyKey, 'idempotencyKey is required')
  assertPositiveInt(timeTokensMinutesToPurchase, 'timeTokensMinutesToPurchase')
  assertPositiveInt(coinsToSpend, 'coinsToSpend')

  return prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWalletBalance(tx, { familyMemberId: subjectMemberId })
    assert(wallet.coinsBalance >= BigInt(coinsToSpend), 'insufficient coins')

    const now = new Date()
    const family = await tx.family.findUnique({ where: { id: familyId } })
    assert(family, 'Family not found')
    const localDateStr = getLocalDateStringInTimezone(family.timezone, now)
    const localDate = toPgDate(localDateStr)

    const member = await tx.familyMember.findUnique({ where: { id: subjectMemberId } })
    assert(member, 'FamilyMember not found')
    const userId = member.userId

    const screen = await getOrCreateScreenTimeDaily(tx, {
      userId,
      familyId,
      localDate,
      defaultHardCapMinutesPerDay,
    })

    const hardCap = BigInt(screen.hardCapMinutesPerDay)
    const nextRemaining = bigInt(screen.timeTokensRemainingMinutes) + BigInt(timeTokensMinutesToPurchase)
    assert(nextRemaining <= hardCap, 'Time tokens cap exceeded')

    // Apply projection changes + ledger in one DB transaction.
    await tx.walletBalance.update({
      where: { familyMemberId: subjectMemberId },
      data: { coinsBalance: bigInt(wallet.coinsBalance) - BigInt(coinsToSpend) },
    })

    await tx.screenTimeDaily.update({
      where: { userId_localDate: { userId: screen.userId, localDate } },
      data: { timeTokensRemainingMinutes: nextRemaining },
    })

    // Ledger: coins spend + time tokens earn.
    await tx.economyTransaction.create({
      data: {
        familyId,
        subjectMemberId,
        assetType: 'COINS',
        txType: 'COINS_SPEND',
        amount: BigInt(coinsToSpend),
        idempotencyKey: withSuffix(idempotencyKey, 'coins'),
        localDate,
        sourceEntity: 'SYSTEM',
        sourceId: reason,
        meta: null,
      },
    })

    await tx.economyTransaction.create({
      data: {
        familyId,
        subjectMemberId,
        assetType: 'TIME_TOKENS',
        txType: 'TIME_TOKENS_EARN',
        amount: BigInt(timeTokensMinutesToPurchase),
        idempotencyKey: withSuffix(idempotencyKey, 'time_tokens'),
        localDate,
        sourceEntity: 'SYSTEM',
        sourceId: reason,
        meta: null,
      },
    })

    return { ok: true }
  })
}

