/**
 * Logistics SLAs — объективные дедлайны для оператора.
 * Только timestamp и boolean. Без геймификации.
 */
export const OPERATOR_SLAS = [
  { id: 'breakfast_ready', label: 'Завтрак готов', deadlineTime: '08:00' },
  { id: 'school_leave', label: 'Выход в школу', deadlineTime: '07:45' },
  { id: 'lunch_ready', label: 'Обед готов', deadlineTime: '14:00' },
  { id: 'snack_ready', label: 'Полдник готов', deadlineTime: '16:00' },
  { id: 'dinner_ready', label: 'Ужин готов', deadlineTime: '19:00' },
  { id: 'screen_timeout', label: 'Ограничение экрана', deadlineTime: '21:00' },
  { id: 'sleep_prep', label: 'Подготовка ко сну', deadlineTime: '21:30' },
]
