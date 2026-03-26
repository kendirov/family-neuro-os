import { prisma } from '../prismaClient.js'
import { getLocalDateStringInTimezone } from '../lib/timezone.js'

async function getOrCreateUserByName(tx, name) {
  // Minimal seed: create new users each run; name is not unique in schema.
  // This function exists to keep code readable.
  const u = await tx.user.create({
    data: { displayName: name },
  })
  return u
}

export async function seedTurboGarage({ timezone = 'Europe/Moscow', defaultHardCapMinutesPerDay = 60 } = {}) {
  const family = await prisma.family.create({
    data: { timezone },
  })

  const localDate = getLocalDateStringInTimezone(family.timezone, new Date())

  // Users: 2 kids, 2 admins, 1 adult_user.
  const [userAdmin1, userAdmin2, userKid1, userKid2, userAdult] = await Promise.all([
    getOrCreateUserByName(prisma, 'Admin 1'),
    getOrCreateUserByName(prisma, 'Admin 2'),
    getOrCreateUserByName(prisma, 'Kid 1'),
    getOrCreateUserByName(prisma, 'Kid 2'),
    getOrCreateUserByName(prisma, 'Adult 1'),
  ])

  const mkMember = async (userId, role) => {
    const m = await prisma.familyMember.create({
      data: { familyId: family.id, userId, role },
    })

    await prisma.walletBalance.create({
      data: {
        familyMemberId: m.id,
        xpTotal: 0n,
        // Kids start with some coins so purchaseTimeTokens can be tested without extra setup.
        coinsBalance: role === 'KID' ? 1000n : 5000n,
      },
    })

    await prisma.dailyUserState.create({
      data: {
        userId,
        familyId: family.id,
        localDate: new Date(`${localDate}T00:00:00.000Z`),
        xpTotal: 0n,
        level: 1,
        coinsBalance: role === 'KID' ? 1000n : 5000n,
      },
    })

    await prisma.screenTimeDaily.create({
      data: {
        userId,
        familyId: family.id,
        localDate: new Date(`${localDate}T00:00:00.000Z`),
        hardCapMinutesPerDay: defaultHardCapMinutesPerDay,
        timeTokensSpentMinutes: 0n,
        timeTokensRemainingMinutes: 0n,
        timeTokensExpiredMinutes: 0n,
      },
    })

    return m
  }

  const [admin1, admin2, kid1, kid2, adult] = await Promise.all([
    mkMember(userAdmin1.id, 'ADMIN'),
    mkMember(userAdmin2.id, 'ADMIN'),
    mkMember(userKid1.id, 'KID'),
    mkMember(userKid2.id, 'KID'),
    mkMember(userAdult.id, 'ADULT_USER'),
  ])

  // Task templates: a minimal set.
  const taskTemplates = await Promise.all([
    prisma.taskTemplate.create({
      data: {
        familyId: family.id,
        code: 'wake_on_time',
        label: 'Проснулся вовремя',
        timeBlock: 'MORNING',
        category: 'ROUTINE',
        sortOrder: 10,
        xpReward: 10n,
        coinsReward: 0n,
        timeTokensRewardMinutes: 0,
      },
    }),
    prisma.taskTemplate.create({
      data: {
        familyId: family.id,
        code: 'make_bed',
        label: 'Убрал постель',
        timeBlock: 'MORNING',
        category: 'ROUTINE',
        sortOrder: 20,
        xpReward: 10n,
        coinsReward: 0n,
        timeTokensRewardMinutes: 0,
      },
    }),
    prisma.taskTemplate.create({
      data: {
        familyId: family.id,
        code: 'breakfast',
        label: 'Завтрак',
        timeBlock: 'MORNING',
        category: 'FOOD',
        sortOrder: 40,
        xpReward: 20n,
        coinsReward: 5n,
        timeTokensRewardMinutes: 0,
      },
    }),
    prisma.taskTemplate.create({
      data: {
        familyId: family.id,
        code: 'help_clean',
        label: 'Помог с уборкой',
        timeBlock: 'AFTERNOON',
        category: 'BONUS',
        sortOrder: 90,
        xpReward: 5n,
        coinsReward: 0n,
        timeTokensRewardMinutes: 5,
      },
    }),
  ])

  // Reward catalog: include TIME_PACK, SPIN, SKIN.
  const rewardCatalog = await Promise.all([
    prisma.rewardCatalog.create({
      data: {
        familyId: family.id,
        rewardCode: 'TIME_PACK',
        kind: 'TIME_TOKENS',
        assetType: 'TIME_TOKENS',
        amount: 30n,
        meta: null,
      },
    }),
    prisma.rewardCatalog.create({
      data: {
        familyId: family.id,
        rewardCode: 'SPIN',
        kind: 'COINS',
        assetType: 'COINS',
        amount: 50n,
        meta: null,
      },
    }),
    prisma.rewardCatalog.create({
      data: {
        familyId: family.id,
        rewardCode: 'SKIN',
        kind: 'INVENTORY_ITEM',
        assetType: 'INVENTORY_ITEM',
        inventoryItemSku: 'SKIN_BLUE',
        amount: null,
        meta: null,
      },
    }),
  ])

  // Inventory items (minimal for SKIN).
  await prisma.inventoryItem.create({
    data: {
      familyId: family.id,
      ownerMemberId: kid1.id,
      itemSku: 'SKIN_BLUE',
      quantity: 0n,
      meta: null,
    },
  })

  // Return IDs for tests/bootstrapping.
  return {
    familyId: family.id,
    localDate,
    members: {
      admin1Id: admin1.id,
      admin2Id: admin2.id,
      kid1Id: kid1.id,
      kid2Id: kid2.id,
      adultUserId: adult.id,
    },
    users: {
      kid1UserId: kid1.userId,
      kid2UserId: kid2.userId,
    },
    taskTemplateIds: taskTemplates.reduce((acc, t) => {
      acc[t.code] = t.id
      return acc
    }, {}),
    rewardCatalogCodes: rewardCatalog.map((r) => r.rewardCode),
  }
}

