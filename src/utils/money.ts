import type { CalculationKey, Roommate } from '../types'

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function splitAmount(total: number, participants: Roommate[], key: CalculationKey): Record<string, number> {
  if (!Number.isFinite(total) || total <= 0 || participants.length === 0) return {}

  const cents = Math.round(total * 100)
  const weights = participants.map(r => key === 'BY_AREA' ? r.roomAreaM2 : 1)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  if (weights.some(weight => !Number.isFinite(weight) || weight <= 0)) return {}

  const allocations = weights.map((weight, index) => {
    const exact = cents * weight / totalWeight
    return { index, cents: Math.floor(exact), remainder: exact - Math.floor(exact) }
  })
  const remaining = cents - allocations.reduce((sum, allocation) => sum + allocation.cents, 0)
  // Assign leftover haléře by largest remainder, keeping equal ties in participant order.
  const ranked = [...allocations].sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  for (let i = 0; i < remaining; i++) ranked[i].cents++

  return Object.fromEntries(allocations.map(a => [participants[a.index].id, a.cents / 100]))
}
