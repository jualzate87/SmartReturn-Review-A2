/** Output forms / schedules shown beside the 1040 Summary in the left panel. */

export type OutputFormId =
  | 'summary'
  | '1040'
  | 'sch1'
  | 'schC'
  | 'schA'
  | 'schD'
  | 'f8960'
  | 'f2210'

export const OUTPUT_FORM_OPTIONS: { id: OutputFormId; label: string; shortLabel: string }[] = [
  { id: 'summary', label: 'Return Summary', shortLabel: 'Summary' },
  { id: '1040', label: 'Form 1040', shortLabel: '1040' },
  { id: 'sch1', label: 'Schedule 1 — Additional Income', shortLabel: 'Sch 1' },
  { id: 'schC', label: 'Schedule C — Business', shortLabel: 'Sch C' },
  { id: 'schA', label: 'Schedule A — Itemized Deductions', shortLabel: 'Sch A' },
  { id: 'schD', label: 'Schedule D — Capital Gains', shortLabel: 'Sch D' },
  { id: 'f8960', label: 'Form 8960 — NIIT', shortLabel: '8960' },
  { id: 'f2210', label: 'Form 2210 — Underpayment', shortLabel: '2210' },
]
