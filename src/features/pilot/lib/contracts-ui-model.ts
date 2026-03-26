export type ContractStatus = 'LOCKED' | 'IN_PROGRESS' | 'READY_TO_CLAIM' | 'COMPLETED' | 'FAILED'

export type ContractCadence = 'DAILY' | 'WEEKLY'

export type ContractConditionKind =
  | 'BOTH_TASK_DONE'
  | 'BOTH_MEALS_DONE'
  | 'BOTH_NO_PENALTY'
  | 'BOTH_REQUIRED_DONE'

export interface ContractConditionDisplay {
  id: string
  kind: ContractConditionKind
  label: string
  /**
   * Per-pilot contribution to condition.
   * UI-only: do not mutate anything here.
   */
  byPilot: Record<'kirill' | 'roma', boolean>
}

export interface FamilyContractDisplayModel {
  id: string
  cadence: ContractCadence
  title: string
  shortTitle: string
  description: string
  damage: number
  status: ContractStatus
  conditions: ContractConditionDisplay[]
  progressPct: number
  rewardLabel: string
}

export interface FamilyContractsUiModel {
  daily: FamilyContractDisplayModel[]
  weekly: FamilyContractDisplayModel[]
}

export interface ContractsApiShape {
  fetchFamilyContracts: () => Promise<FamilyContractsUiModel>
  claimContract: (contractId: string) => Promise<{ ok: boolean }>
}

