import { describe, it, expect } from 'vitest'
import { validatePackage } from './v-func'


describe('validatePackage', () => {
  it('returns errors for empty package', () => {
    const errors = validatePackage({})

    expect(errors).toEqual({
      branch: 'Branch is required',
      name: 'Package name is required',
      duration: 'Valid duration is required',
      type: 'Duration type must be either "days" or "months"',
      price: 'Valid package fee is required',
    })
  })

  it('returns error when branch is missing', () => {
    const errors = validatePackage({
      name: 'Gold',
      duration: 30,
      duration_type: 'days',
      price: 100,
    })

    expect(errors.branch).toBe('Branch is required')
  })

  it('returns error when name is empty', () => {
    const errors = validatePackage({
      branch_id: '1',
      name: '',
      duration: 30,
      duration_type: 'days',
      price: 100,
    })

    expect(errors.name).toBe('Package name is required')
  })

  it('returns error for invalid duration', () => {
    const errors = validatePackage({
      branch_id: '1',
      name: 'Gold',
      duration: 0,
      duration_type: 'days',
      price: 100,
    })

    expect(errors.duration).toBe('Valid duration is required')
  })

  it('returns error for invalid duration type', () => {
    const errors = validatePackage({
      branch_id: '1',
      name: 'Gold',
      duration: 30,
      duration_type: 'years',
      price: 100,
    })

    expect(errors.type).toBe(
      'Duration type must be either "days" or "months"'
    )
  })

  it('returns error for invalid price', () => {
    const errors = validatePackage({
      branch_id: '1',
      name: 'Gold',
      duration: 30,
      duration_type: 'months',
      price: -10,
    })

    expect(errors.price).toBe('Valid package fee is required')
  })

  it('returns no errors for a valid package', () => {
    const errors = validatePackage({
      branch_id: '1',
      name: 'Gold',
      duration: 30,
      duration_type: 'days',
      price: 100,
    })

    expect(errors).toEqual({})
  })
})
