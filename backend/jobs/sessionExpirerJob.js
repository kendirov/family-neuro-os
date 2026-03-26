import { prisma } from '../prismaClient.js'
import { endScreenTimeSession } from '../services/screenTimeTimerService.js'

export async function runSessionExpirerJob({ now = new Date() } = {}) {
  // Expire ACTIVE sessions whose planned_end_at is reached.
  const due = await prisma.screenTimeSession.findMany({
    where: {
      status: 'ACTIVE',
      plannedEndAt: { lte: now },
    },
    select: { id: true, childMemberId: true, activityType: true, familyId: true },
  })

  for (const s of due) {
    await endScreenTimeSession({
      idempotencyKey: `session-expire:${s.id}`,
      familyId: s.familyId,
      childMemberId: s.childMemberId,
      activityType: s.activityType,
      sessionId: s.id,
    })
  }
}

