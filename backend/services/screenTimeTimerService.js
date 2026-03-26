import { prisma } from '../prismaClient.js'
import { getLocalDateStringInTimezone } from '../lib/timezone.js'
import { assert } from '../lib/assert.js'
import { withSuffix } from '../lib/idempotency.js'

function bigInt(value) {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(Math.trunc(value))
  return BigInt(String(value))
}

function floorMinutesFromSeconds(secondsBigInt) {
  // secondsBigInt is bigint
  return secondsBigInt / 60n
}

function toPgDate(dateStrYYYYMMDD) {
  return new Date(`${dateStrYYYYMMDD}T00:00:00.000Z`)
}

async function getCurrentSession(tx, { childMemberId }) {
  // We allow either ACTIVE or PAUSED session to exist. active uniqueness is enforced by DB.
  return tx.screenTimeSession.findFirst({
    where: {
      childMemberId,
      status: { in: ['ACTIVE', 'PAUSED'] },
    },
    orderBy: { startedAt: 'desc' },
  })
}

export async function startScreenTimeSession({
  idempotencyKey: _idempotencyKey,
  familyId,
  childMemberId,
  activityType,
}) {
  // idempotencyKey is accepted for interface consistency; start itself doesn't write ledger.
  // DB partial unique index protects "two active sessions".
  void _idempotencyKey
  assert(familyId, 'familyId is required')
  assert(childMemberId, 'childMemberId is required')
  assert(activityType, 'activityType is required')

  return prisma.$transaction(async (tx) => {
    const now = new Date()
    const family = await tx.family.findUnique({ where: { id: familyId } })
    assert(family, 'Family not found')

    const localDateStr = getLocalDateStringInTimezone(family.timezone, now)
    const localDate = toPgDate(localDateStr)
    const child = await tx.familyMember.findUnique({ where: { id: childMemberId } })
    assert(child, 'Child member not found')
    const userId = child.userId

    const existing = await getCurrentSession(tx, { childMemberId })
    assert(!existing || existing.status === 'PAUSED', 'Session already exists (ACTIVE/PAUSED)')
    // If PAUSED exists, treat start as "resume" use-case; reject to keep semantics strict.
    if (existing && existing.status === 'PAUSED') {
      throw new Error('Cannot start: there is an existing PAUSED session; call resumeScreenTimeSession')
    }

    const screenDaily = await tx.screenTimeDaily.findUnique({
      where: { userId_localDate: { userId, localDate } },
    })
    assert(screenDaily, 'screen_time_daily missing for today; run daily jobs/seed')
    const remaining = bigInt(screenDaily.timeTokensRemainingMinutes)
    assert(remaining > 0n, 'No time tokens remaining')

    const plannedEnd = new Date(now.getTime() + Number(remaining) * 60 * 1000)

    const created = await tx.screenTimeSession.create({
      data: {
        familyId,
        childMemberId,
        activityType,
        status: 'ACTIVE',
        startedAt: now,
        plannedEndAt: plannedEnd,
        accumulatedSeconds: 0n,
        pausedAt: null,
        totalPausedSeconds: 0n,
        completedAt: null,
        meta: null,
      },
    })

    return { ok: true, sessionId: created.id }
  })
}

export async function pauseScreenTimeSession({
  idempotencyKey,
  familyId,
  childMemberId,
  activityType,
}) {
  assert(idempotencyKey, 'idempotencyKey is required')
  return prisma.$transaction(async (tx) => {
    const now = new Date()
    const family = await tx.family.findUnique({ where: { id: familyId } })
    assert(family, 'Family not found')
    const localDateStr = getLocalDateStringInTimezone(family.timezone, now)
    const localDate = toPgDate(localDateStr)

    const child = await tx.familyMember.findUnique({ where: { id: childMemberId } })
    assert(child, 'Child member not found')

    const session = await tx.screenTimeSession.findFirst({
      where: { childMemberId, status: 'ACTIVE', activityType },
      orderBy: { startedAt: 'desc' },
    })
    assert(session, 'No active session to pause')

    const daily = await tx.screenTimeDaily.findUnique({
      where: { userId_localDate: { userId: child.userId, localDate } },
    })
    assert(daily, 'screen_time_daily missing for today; run daily jobs/seed')

    // Compute elapsed excluding paused time.
    const startedMs = session.startedAt ? session.startedAt.getTime() : now.getTime()
    const elapsedSecondsBig = bigInt(Math.floor((now.getTime() - startedMs) / 1000)) - bigInt(session.totalPausedSeconds)
    const consumableMinutesTotal = floorMinutesFromSeconds(elapsedSecondsBig)
    const alreadyChargedMinutes = floorMinutesFromSeconds(bigInt(session.accumulatedSeconds))
    const deltaMinutes = consumableMinutesTotal - alreadyChargedMinutes

    const delta = deltaMinutes > 0n ? deltaMinutes : 0n
    const remainingBefore = bigInt(daily.timeTokensRemainingMinutes)
    const actualSpendMinutes = delta > remainingBefore ? remainingBefore : delta

    // Update projections + ledger only if something is actually spent.
    if (actualSpendMinutes > 0n) {
      await tx.economyTransaction.create({
        data: {
          familyId,
          subjectMemberId: childMemberId,
          assetType: 'TIME_TOKENS',
          txType: 'TIME_TOKENS_SPEND',
          amount: actualSpendMinutes,
          idempotencyKey: withSuffix(idempotencyKey, 'spend'),
          localDate,
          sourceEntity: 'SCREEN_TIME_SESSION',
          sourceId: session.id,
          screenTimeSessionId: session.id,
          meta: null,
        },
      })

      await tx.screenTimeDaily.update({
        where: { userId_localDate: { userId: child.userId, localDate } },
        data: {
          timeTokensRemainingMinutes: remainingBefore - actualSpendMinutes,
          timeTokensSpentMinutes: bigInt(daily.timeTokensSpentMinutes) + actualSpendMinutes,
        },
      })
    }

    // Charge-time progress: session accumulates *elapsed minutes*; even if tokens hit zero,
    // accumulatedSeconds ensures next delta calculation is correct (no per-second DB writes).
    const consumedSecondsTotal = consumableMinutesTotal * 60n

    // Pause the session (or complete it if tokens exhausted).
    const updatedDaily = actualSpendMinutes > 0n ? await tx.screenTimeDaily.findUnique({ where: { userId_localDate: { userId: child.userId, localDate } } }) : daily
    const remainingAfter = bigInt(updatedDaily.timeTokensRemainingMinutes)

    const setStatus = remainingAfter === 0n ? 'COMPLETED' : 'PAUSED'

    await tx.screenTimeSession.update({
      where: { id: session.id },
      data: {
        status: setStatus,
        pausedAt: setStatus === 'PAUSED' ? now : null,
        completedAt: setStatus === 'COMPLETED' ? now : null,
        accumulatedSeconds: consumedSecondsTotal,
        lastEventAt: now,
      },
    })

    return { ok: true, remainingAfter }
  })
}

export async function resumeScreenTimeSession({
  idempotencyKey,
  familyId,
  childMemberId,
  activityType,
}) {
  assert(idempotencyKey, 'idempotencyKey is required')
  return prisma.$transaction(async (tx) => {
    const now = new Date()
    const family = await tx.family.findUnique({ where: { id: familyId } })
    assert(family, 'Family not found')
    const localDateStr = getLocalDateStringInTimezone(family.timezone, now)
    const localDate = toPgDate(localDateStr)

    const child = await tx.familyMember.findUnique({ where: { id: childMemberId } })
    assert(child, 'Child member not found')

    const session = await tx.screenTimeSession.findFirst({
      where: { childMemberId, status: 'PAUSED', activityType },
      orderBy: { startedAt: 'desc' },
    })
    assert(session, 'No paused session to resume')
    assert(session.pausedAt, 'paused_at must be set for PAUSED session')

    const daily = await tx.screenTimeDaily.findUnique({
      where: { userId_localDate: { userId: child.userId, localDate } },
    })
    assert(daily, 'screen_time_daily missing for today; run daily jobs/seed')
    assert(bigInt(daily.timeTokensRemainingMinutes) > 0n, 'No time tokens remaining')

    // Add paused duration to total_paused_seconds.
    const pausedSeconds = bigInt(Math.floor((now.getTime() - session.pausedAt.getTime()) / 1000))
    const nextTotalPaused = bigInt(session.totalPausedSeconds) + pausedSeconds

    const plannedEnd = new Date(now.getTime() + Number(bigInt(daily.timeTokensRemainingMinutes)) * 60 * 1000)

    // Resume to ACTIVE; consumption doesn't advance during pause, so no time tokens spent on resume.
    await tx.screenTimeSession.update({
      where: { id: session.id },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        totalPausedSeconds: nextTotalPaused,
        plannedEndAt: plannedEnd,
        lastEventAt: now,
      },
    })

    return { ok: true }
  })
}

export async function endScreenTimeSession({
  idempotencyKey,
  familyId,
  childMemberId,
  activityType,
  sessionId,
}) {
  assert(idempotencyKey, 'idempotencyKey is required')
  return prisma.$transaction(async (tx) => {
    const now = new Date()
    const family = await tx.family.findUnique({ where: { id: familyId } })
    assert(family, 'Family not found')
    const localDateStr = getLocalDateStringInTimezone(family.timezone, now)
    const localDate = toPgDate(localDateStr)

    const child = await tx.familyMember.findUnique({ where: { id: childMemberId } })
    assert(child, 'Child member not found')

    const session = sessionId
      ? await tx.screenTimeSession.findUnique({ where: { id: sessionId } })
      : await tx.screenTimeSession.findFirst({
          where: { childMemberId, status: { in: ['ACTIVE', 'PAUSED'] }, activityType },
          orderBy: { startedAt: 'desc' },
        })
    assert(session, 'ScreenTimeSession not found')

    const daily = await tx.screenTimeDaily.findUnique({
      where: { userId_localDate: { userId: child.userId, localDate } },
    })
    assert(daily, 'screen_time_daily missing for today; run daily jobs/seed')

    let effectiveTotalPausedSeconds = bigInt(session.totalPausedSeconds)
    if (session.status === 'PAUSED' && session.pausedAt) {
      effectiveTotalPausedSeconds =
        effectiveTotalPausedSeconds + bigInt(Math.floor((now.getTime() - session.pausedAt.getTime()) / 1000))
    }

    const startedMs = session.startedAt ? session.startedAt.getTime() : now.getTime()
    const elapsedSecondsBig = bigInt(Math.floor((now.getTime() - startedMs) / 1000)) - effectiveTotalPausedSeconds
    const consumableMinutesTotal = floorMinutesFromSeconds(elapsedSecondsBig)
    const alreadyChargedMinutes = floorMinutesFromSeconds(bigInt(session.accumulatedSeconds))
    const deltaMinutes = consumableMinutesTotal - alreadyChargedMinutes

    const delta = deltaMinutes > 0n ? deltaMinutes : 0n
    const remainingBefore = bigInt(daily.timeTokensRemainingMinutes)
    const actualSpendMinutes = delta > remainingBefore ? remainingBefore : delta

    if (actualSpendMinutes > 0n) {
      await tx.economyTransaction.create({
        data: {
          familyId,
          subjectMemberId: childMemberId,
          assetType: 'TIME_TOKENS',
          txType: 'TIME_TOKENS_SPEND',
          amount: actualSpendMinutes,
          idempotencyKey: withSuffix(idempotencyKey, 'spend'),
          localDate,
          sourceEntity: 'SCREEN_TIME_SESSION',
          sourceId: session.id,
          screenTimeSessionId: session.id,
          meta: null,
        },
      })

      await tx.screenTimeDaily.update({
        where: { userId_localDate: { userId: child.userId, localDate } },
        data: {
          timeTokensRemainingMinutes: remainingBefore - actualSpendMinutes,
          timeTokensSpentMinutes: bigInt(daily.timeTokensSpentMinutes) + actualSpendMinutes,
        },
      })
    }

    const consumedSecondsTotal = consumableMinutesTotal * 60n

    await tx.screenTimeSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        pausedAt: null,
        totalPausedSeconds: effectiveTotalPausedSeconds,
        accumulatedSeconds: consumedSecondsTotal,
        completedAt: now,
        plannedEndAt: null,
        lastEventAt: now,
      },
    })

    return { ok: true }
  })
}

