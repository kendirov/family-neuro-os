import { prisma } from '../prismaClient.js'
import { getLocalDateStringInTimezone } from '../lib/timezone.js'

function toPgDate(dateStrYYYYMMDD) {
  return new Date(`${dateStrYYYYMMDD}T00:00:00.000Z`)
}

export async function runTaskInstanceGeneratorJob({
  now = new Date(),
  // Currently: generate instances for all templates for each KID each local day.
  // Later this can be refined by time_block/category.
} = {}) {
  const families = await prisma.family.findMany()

  for (const family of families) {
    const localDate = getLocalDateStringInTimezone(family.timezone, now)
    const localDatePg = toPgDate(localDate)

    const kidMembers = await prisma.familyMember.findMany({
      where: { familyId: family.id, role: 'KID' },
    })
    if (kidMembers.length === 0) continue

    const templates = await prisma.taskTemplate.findMany({
      where: { familyId: family.id },
    })
    if (templates.length === 0) continue

    const data = []
    for (const template of templates) {
      for (const kid of kidMembers) {
        data.push({
          templateId: template.id,
          assigneeMemberId: kid.id,
          localDate: localDatePg,
          status: 'PENDING',
        })
      }
    }

    // Unique constraint is (templateId, assigneeMemberId, localDate); skip duplicates.
    await prisma.taskInstance.createMany({
      data,
      skipDuplicates: true,
    })
  }
}

