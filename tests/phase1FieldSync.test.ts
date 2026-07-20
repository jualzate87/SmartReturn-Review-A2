import { describe, expect, it } from 'vitest'
import {
  countPhase1FlagsForW2Payer,
  countPhase1FlagsForW2Tab,
  getTabFlagCounts,
  isBox12FlagResolved,
  isPhase1FlagResolved,
  PHASE1_FLAG_KEYS,
} from '../src/pages/data-review/phase1FieldSync'

function reviewed(...keys: string[]) {
  return new Map(keys.map(k => [k, { by: 'test', at: 'now' }]))
}

describe('ProtoA2 — no import field flags', () => {
  it('defines zero Phase 1 flag keys', () => {
    expect(PHASE1_FLAG_KEYS.length).toBe(0)
  })

  it('returns zero tab and payer badge counts', () => {
    const empty = new Map<string, unknown>()
    expect(countPhase1FlagsForW2Payer('techCircle', empty)).toBe(0)
    expect(countPhase1FlagsForW2Tab(empty)).toBe(0)
    expect(getTabFlagCounts(empty).w2s).toBe(0)
    expect(getTabFlagCounts(empty)['1099-rs']).toBe(0)
  })

  it('reports zero remaining flags via count helpers', () => {
    const empty = new Map<string, unknown>()
    const fields = reviewed('wages-techCircle', 'ssn-techCircle')
    expect(countPhase1FlagsForW2Payer('techCircle', fields)).toBe(0)
    expect(countPhase1FlagsForW2Tab(fields)).toBe(0)
  })

  it('still resolves box12 when sub-rows are reviewed (legacy helper)', () => {
    const fields = reviewed(
      'box12a-techCircle',
      'box12b-techCircle',
      'box12c-techCircle',
      'box12d-techCircle',
    )
    expect(isBox12FlagResolved(fields)).toBe(true)
    expect(isPhase1FlagResolved('box12', fields)).toBe(true)
    expect(countPhase1FlagsForW2Payer('techCircle', fields)).toBe(0)
  })
})
