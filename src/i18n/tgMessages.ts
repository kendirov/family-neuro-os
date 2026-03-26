export type TgTone = 'kid' | 'admin'

type Params = Record<string, string | number | boolean | null | undefined>

type TgMessages = Record<string, string>

const KID: TgMessages = {
  // navigation / common
  'ui.close': 'Закрыть',
  'ui.back': 'Назад',
  'ui.open': 'Открыть',

  // base / home
  'pilotHome.aria': 'База — Турбо-гараж',

  // missions / contracts
  'missions.card.aria': 'Миссии дня',
  'missions.countOpen': '{count} в деле',
  'missions.available': 'В деле',
  'missions.completed': 'Сделано',
  'missions.tapHint': 'Жми — получишь награду (пока макет)',
  'missions.allDone': '— всё сделано! Отлично! 🎉',
  'missions.item.aria': 'Миссия: {label}{lockedSuffix}',
  'missions.lockedSuffix': ' (пока закрыто)',

  // inventory
  'inventory.title': 'Инвентарь',
  'inventory.preview.aria': 'Инвентарь — быстрый просмотр',
  'inventory.preview.title': 'ИНВЕНТАРЬ',
  'inventory.preview.empty': 'Пусто. Открывай коробки — и будет добыча.',
  'inventory.preview.count': '{count} предметов в гараже',
  'inventory.preview.noneYet': '— пока пусто —',
  'inventory.openCta': 'ОТКРЫТЬ ИНВЕНТАРЬ',
  'inventory.drawer.aria': 'Инвентарь',
  'inventory.drawer.hint': 'Тапай предметы — открывай коробки (пока макет)',
  'inventory.drawer.close': 'ЗАКРЫТЬ',
  'inventory.drawer.closeAria': 'Закрыть инвентарь',
  'inventory.filter.aria': 'Фильтр: {label}',
  'inventory.emptyFilter': 'Здесь пока пусто.',
  'inventory.item.aria': 'Предмет: {name}. Статус: {status}. Тип: {type}.',
  'inventory.status.AVAILABLE': 'ГОТОВО',
  'inventory.status.USED': 'ИСПОЛЬЗОВАНО',
  'inventory.status.LOCKED': 'ЗАКРЫТО',
  'inventory.status.EXPIRED': 'ИСТЕКЛО',
  'inventory.cta.notReady': 'НЕ ГОТОВО',
  'inventory.cta.open': 'ОТКРЫТЬ',
  'inventory.cta.use': 'ИСПОЛЬЗОВАТЬ',
  'inventory.cta.view': 'СМОТРЕТЬ',
  'inventory.type.lootbox': 'ЛУТБОКС',

  // lootbox
  'lootbox.modal.aria': 'Открытие лутбокса',
  'lootbox.opening': 'ОТКРЫВАЕМ',
  'lootbox.close': 'ЗАКРЫТЬ',
  'lootbox.rolling': 'Крутим…',
  'lootbox.wait': 'Секундочку…',
  'lootbox.ready': 'Награда готова',
  'lootbox.skip': 'Пропустить',
  'lootbox.skipAria': 'Пропустить анимацию открытия',
  'lootbox.unknownReward': 'Неизвестная награда',
  'lootbox.subtitleMock': 'макет',

  // toasts / feedback (pilot)
  'toast.premiumFuel.title': 'Премиум-топливо',
  'toast.premiumFuel.msg': 'Супер-день! Турбо-коины летят быстрее.',
  'toast.overheat.title': 'Перегрев',
  'toast.overheat.msg': 'Сахарный режим. Бонус дня стал меньше.',
  'toast.microVictory.title': 'Микро-победа',
  'toast.microVictory.msg': '+{xp} XP (пока макет).',
  'toast.fuelSynced.title': 'Топливо синхронизировано',
  'toast.contractCleared.title': 'Миссия закрыта',
  'toast.missionReward.msg': '+{xp} XP (пока макет).',
  'toast.reward.title': 'Награда',

  // raid
  'raid.arena.aria': 'Арена рейда',
  'raid.arena.title': 'АРЕНА РЕЙДА',
  'raid.arena.closeAria': 'Закрыть арену',
  'raid.arena.close': 'ЗАКРЫТЬ',
  'raid.bossLabel': 'БОСС',
  'raid.victory': 'ПОБЕДА',
  'raid.reward': 'НАГРАДА',
  'raid.unlock': 'Открыто',
  'raid.lootboxId': 'ID коробки',
  'raid.tip': 'Подсказка: закрывай семейные контракты — и бей босса.',
  'raid.victory.aria': 'Победа в рейде',
  'raid.victory.title': 'ПОБЕДА',
  'raid.victory.defeated': '{name} побеждён',
  'raid.victory.unlockLine': 'Награда: {label}',
  'raid.victory.openLootbox': 'ОТКРЫТЬ КОРОБКУ',
  'raid.victory.backToGarage': 'В ГАРАЖ',

  // raid teaser (home)
  'raidTeaser.aria': 'Превью рейда — босс дня',
  'raidTeaser.title': 'БОСС ДНЯ',
  'raidTeaser.win': 'ПОБЕДА!',
  'raidTeaser.progress': 'Прогресс арены',
  'raidTeaser.keepBoosting': 'Качай рейд дальше.',
  'raidTeaser.winOverflow': 'ПОБЕДА +{overflow}',
  'raidTeaser.claimSoon': 'Заберём скоро',

  // boss hp
  'boss.hp.aria': 'Полоса здоровья босса',

  // family contracts
  'familyContracts.aria': 'Семейные контракты',
  'familyContracts.title': 'СЕМЕЙНЫЕ КОНТРАКТЫ',
  'familyContracts.openRaid': 'В РЕЙД',
  'familyContracts.openRaidAria': 'Открыть рейд',
  'familyContracts.stats.daily': 'День',
  'familyContracts.stats.weekly': 'Неделя',
  'familyContracts.stats.ready': 'Готово: {count}',
  'familyContracts.today': 'Сегодня',
  'familyContracts.week': 'Неделя',
  'familyContracts.tapClaim': 'Жми “ЗАБРАТЬ”, когда готово',
  'familyContracts.bigDamage': 'Сильный удар',

  // coop raid card (home)
  'coop.title': 'КОМАНДНЫЙ РЕЙД',
  'coop.hint': 'Открывай арену — увидишь фазы и урон.',
  'coop.open': 'В АРЕНУ',

  // timer / screen energy (pilot card)
  'timer.card.aria': 'Энергия экрана — таймер',
  'timer.title': 'ТАЙМЕР',
  'timer.waiting': 'Ждём запуск…',
  'timer.state.active': 'Таймер активен',
  'timer.state.safe': 'Таймер в безопасном режиме',
  'timer.burning': '⚡ Энергия тратится',
  'timer.elapsed': 'прошло {time}',
  'timer.heat': 'перегрев',
  'timer.safeRemaining': 'Осталось безопасно',
  'timer.stable': 'ровно',

  // garage scene
  'garage.hero.aria': 'Гараж',
  'garage.hero.low': 'БАЗА: ГАРАЖ',
  'garage.hero.mid': 'АПГРЕЙД-БОКС',
  'garage.hero.high': 'КОМАНДНЫЙ ГАРАЖ',
  'garage.lamp.statusA': 'СТАТУС A',
  'garage.lamp.statusB': 'СТАТУС B',
  'garage.lamp.statusC': 'СТАТУС C',
  'garage.manualControls': 'Ручные панели',
  'garage.reactorLamps': 'Лампы реактора',
  'garage.statusBoard': 'Статус-панель',
  'garage.fuelLink': 'ТОПЛИВО',
  'garage.xpBoost': 'УСИЛЕНИЕ ДНЯ',
  'garage.premiumPanels': 'Премиум-панели',
  'garage.level': 'УРОВЕНЬ {level}',
  'garage.heatControl': 'Контроль топлива',
  'garage.fuelState': 'СОСТОЯНИЕ',
  'garage.dayMult': 'МНОЖИТЕЛЬ ДНЯ',
  'garage.gateStatus': 'ШЛЮЗ',
  'garage.gateOpen': 'ОТКРЫТ',
  'garage.gateLocked': 'ЗАКРЫТ',
  'garage.activePanels': 'АКТИВНЫЕ ПАНЕЛИ',
  'garage.panelDanger': 'ТРЕВОГА',
  'garage.panelBoost': 'БУСТ',
  'garage.panelOnline': 'В СЕТИ',
  'garage.footer': 'НЕОН-КОНТУР',

  // HUD (pilot top)
  'hud.aria': 'HUD: уровень и турбо-коины',
  'hud.levelShort': 'УРОВ.',
  'hud.todayLine': 'Сегодня: {xp} · Топливо {mult}',
  'hud.coinsLabel': 'Турбо-коины',
  'hud.levelProgress': 'Прогресс уровня',
  'hud.nextAt': 'Следующий: {xp} XP',
  'hud.action.healthy': 'ПОЛЕЗНО',
  'hud.action.sweet': 'СЛАДКОЕ',
  'hud.action.boost': 'БУСТ',
  'hud.action.healthyAria': 'Полезная еда — включить премиум-топливо',
  'hud.action.sweetAria': 'Сладкое — риск перегрева',
  'hud.action.boostAria': 'Забрать награду за контракт (макет)',

  // fuel tank card
  'fuel.card.aria': 'Топливный бак',
  'fuel.title': 'ТОПЛИВО',
  'fuel.todayMult': 'Бонус дня {mult}',
  'fuel.state.aria': 'Состояние топлива: {label}',
  'fuel.state.low': 'МАЛО',
  'fuel.state.ok': 'ОК',
  'fuel.state.boost': 'БУСТ',
  'fuel.state.danger': 'ТРЕВОГА',
  'fuel.level.aria': 'Уровень топлива: {pct}%',
  'fuel.band.danger': 'Красная зона',
  'fuel.band.safe': 'Зелёная зона',
  'fuel.tag.heat': 'Жарко',
  'fuel.tag.boost': 'Буст',
  'fuel.tag.routine': 'Обычный',

  // misc aria
  'rewardLayer.aria': 'Слой наград',
  'inventory.grid.aria': 'Сетка инвентаря',
  'rewardReveal.aria': 'Показ награды',
}

const ADMIN: TgMessages = {
  'ui.close': 'Закрыть',
  'ui.back': 'Назад',
  'timer.costLabel': 'ТАРИФ',
  'timer.xpPerMin': '{value} XP/мин',
}

function format(template: string, params?: Params) {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
}

export function tgText(tone: TgTone, key: string, params?: Params): string {
  const dict = tone === 'admin' ? ADMIN : KID
  const raw = dict[key]
  if (raw) return format(raw, params)
  if (import.meta.env.DEV) {
    const g = globalThis as unknown as { __TG_I18N_MISSING__?: Set<string> }
    if (!g.__TG_I18N_MISSING__) g.__TG_I18N_MISSING__ = new Set()
    const missKey = `${tone}:${key}`
    if (!g.__TG_I18N_MISSING__.has(missKey)) {
      g.__TG_I18N_MISSING__.add(missKey)
      // eslint-disable-next-line no-console
      console.groupCollapsed('[TG_I18N] Missing key')
      // eslint-disable-next-line no-console
      console.warn(missKey)
      // eslint-disable-next-line no-console
      console.groupEnd()
    }
    return `⟦${tone}:${key}⟧`
  }
  return key
}

