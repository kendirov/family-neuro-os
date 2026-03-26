export function AdminRewardsPage() {
  const [mode, setMode] = useState<RewardsMode>('store')
  const [items, setItems] = useState<RewardItem[]>(() => REWARDS_MOCK.slice())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const visibleItems = useMemo(() => {
    return items
      .filter((x) => !x.archived)
      .filter((x) => x.source === mode)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items, mode])

  const summary = useMemo(() => calcRewardsSummary(items), [items])

  const editingItem = useMemo(() => {
    if (!editingId) return null
    return items.find((x) => x.id === editingId) ?? null
  }, [editingId, items])

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingId(null)
  }

  const openNew = () => {
    setEditingId(null)
    setEditorOpen(true)
  }

  const openEdit = (id: string) => {
    setEditingId(id)
    setEditorOpen(true)
  }

  const onSave = (draft: Pick<RewardItem, 'name' | 'costCoins' | 'type' | 'dropRate' | 'enabled' | 'source'>) => {
    const now = new Date().toISOString()
    setItems((prev) => {
      if (!editingId) {
        const id = `rw_${draft.source}_${Math.random().toString(16).slice(2)}`
        const next: RewardItem = {
          id,
          name: draft.name.trim(),
          costCoins: clampInt(draft.costCoins, 0, 9999),
          type: draft.type,
          dropRate: draft.source === 'wheel' ? clampRate01(draft.dropRate ?? 0) : null,
          enabled: draft.enabled,
          archived: false,
          source: draft.source,
          updatedAt: now,
        }
        return [next, ...prev]
      }
      return prev.map((x) =>
        x.id === editingId
          ? {
              ...x,
              name: draft.name.trim(),
              costCoins: clampInt(draft.costCoins, 0, 9999),
              type: draft.type,
              dropRate: draft.source === 'wheel' ? clampRate01(draft.dropRate ?? 0) : null,
              enabled: draft.enabled,
              source: draft.source,
              updatedAt: now,
            }
          : x
      )
    })
    closeEditor()
  }

  const toggleEnabled = (id: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, enabled: !x.enabled, updatedAt: new Date().toISOString() } : x)))
  }

  const archive = (id: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, archived: true, enabled: false, updatedAt: new Date().toISOString() } : x)))
  }

  const moveSource = (id: string, next: RewardSource) => {
    setItems((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              source: next,
              dropRate: next === 'wheel' ? x.dropRate ?? 0.1 : null,
              updatedAt: new Date().toISOString(),
            }
          : x
      )
    )
  }

  return (
    <div className="min-h-0">
      <AdminPageHeader
        title="Награды"
        description="Каталог магазина и записи колеса. Строгие поля, быстрые действия, готовность к аудиту."
        right={
          <div className="flex items-center gap-2">
            <RewardsModeSwitch mode={mode} onChange={setMode} />
            <button
              type="button"
              onClick={openNew}
              className={cn(
                'h-[42px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition',
                'hover:bg-white/[0.08] hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
              )}
            >
              Добавить
            </button>
          </div>
        }
        className="mb-4"
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[
          { label: 'items', value: String(summary.total) },
          { label: 'enabled', value: String(summary.enabled) },
          { label: 'store', value: String(summary.store) },
          { label: 'wheel', value: String(summary.wheel) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{s.label}</div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-100">{s.value}</div>
          </div>
        ))}
      </div>

      <RewardsTable
        items={visibleItems}
        onEdit={openEdit}
        onToggleEnabled={toggleEnabled}
        onArchive={archive}
        onMoveSource={moveSource}
      />

      <RewardEditorSheet
        open={editorOpen}
        mode={mode}
        item={editingItem}
        onClose={closeEditor}
        onSave={onSave}
      />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { AdminPageHeader } from '../components/common/AdminPageHeader'
import { RewardsModeSwitch } from '../components/rewards/RewardsModeSwitch'
import { RewardsTable } from '../components/rewards/RewardsTable'
import { RewardEditorSheet } from '../components/rewards/RewardEditorSheet'
import { REWARDS_MOCK } from '../mocks/rewards.mock'
import type { RewardItem, RewardSource, RewardsMode } from '../lib/admin-rewards-ui-model'
import { calcRewardsSummary, clampInt, clampRate01 } from '../lib/admin-rewards-ui-model'
