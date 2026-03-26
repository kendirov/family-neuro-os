import { prisma } from '../prismaClient.js'
import { getLocalDateStringInTimezone } from '../lib/timezone.js'
function bigInt(v) {
  if (typeof v === 'bigint') return v
  if (typeof v === 'number') return BigInt(Math.trunc(v))
  return BigInt(String(v))
}

function toPgDate(dateStrYYYYMMDD) {
  return new Date(`${dateStrYYYYMMDD}T00:00:00.000Z`)
}

export async function runDailyRolloverJob({ now = new Date(), defaultHardCapMinutesPerDay = 60 } = {}) {
  const families = await prisma.family.findMany()

  for (const family of families) {
    // Expire "yesterday" in family-local timezone.
    const yesterdayLocal = getLocalDateStringInTimezone(
      family.timezone,
      new Date(now.getTime() - 24 * 60 * 60 * 1000)
    )
    const todayLocal = getLocalDateStringInTimezone(family.timezone, now)

    const kidMembers = await prisma.familyMember.findMany({
      where: { familyId: family.id, role: 'KID' },
    })
    const kidUserIds = kidMembers.map((m) => m.userId)
    const userIdToMemberId = new Map(kidMembers.map((m) => [m.userId, m.id]))

    await prisma.$transaction(async (tx) => {
      // 1) Expire unused tokens for yesterday (remaining -> expired, remaining -> 0).
      const dailyRows = await tx.screenTimeDaily.findMany({
        where: {
          familyId: family.id,
          localDate: toPgDate(yesterdayLocal),
          userId: { in: kidUserIds },
        },
      })

      for (const row of dailyRows) {
        const remaining = bigInt(row.timeTokensRemainingMinutes)
        if (remaining <= 0n) continue

        const idem = `expire:${family.id}:${row.userId}:${yesterdayLocal}`
        const exists = await tx.economyTransaction.findUnique({
          where: { idempotencyKey: idem },
          select: { id: true },
        })
        if (exists) continue

        await tx.economyTransaction.create({
          data: {
            familyId: family.id,
            subjectMemberId: userIdToMemberId.get(row.userId),
            assetType: 'TIME_TOKENS',
            txType: 'TIME_TOKENS_EXPIRE',
            amount: remaining,
            idempotencyKey: idem,
            localDate: toPgDate(yesterdayLocal),
            sourceEntity: 'SYSTEM',
            sourceId: 'daily-rollover',
            meta: null,
          },
        })

        await tx.screenTimeDaily.update({
          where: { userId_localDate: { userId: row.userId, localDate: toPgDate(yesterdayLocal) } },
          data: {
            timeTokensRemainingMinutes: 0n,
            timeTokensExpiredMinutes: bigInt(row.timeTokensExpiredMinutes) + remaining,
          },
        })
      }

      // 2) Ensure screen_time_daily exists for today for all kids.
      for (const member of kidMembers) {
        const userId = member.userId
        const existing = await tx.screenTimeDaily.findUnique({
          where: { userId_localDate: { userId, localDate: toPgDate(todayLocal) } },
          select: { id: true },
        })
        if (existing) continue

        await tx.screenTimeDaily.create({
          data: {
            userId,
            familyId: family.id,
            localDate: toPgDate(todayLocal),
            hardCapMinutesPerDay: defaultHardCapMinutesPerDay,
            timeTokensSpentMinutes: 0n,
            timeTokensRemainingMinutes: 0n,
            timeTokensExpiredMinutes: 0n,
          },
        })
      }
    })
  }
}

