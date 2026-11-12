export function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 -]/g, '').trim()
}

export function buildSpayd(iban: string, amount: number, name: string, variableSymbol: string = '20261101'): string {
  const account = iban.replace(/\s/g, '').toUpperCase()
  if (!/^CZ\d{22}$/.test(account) || !Number.isFinite(amount) || amount <= 0 || !/^\d{1,10}$/.test(variableSymbol)) return ''
  const message = `Spolubyt Najem 11/2026 ${stripDiacritics(name)}`.slice(0, 60)
  return `SPD*1.0*ACC:${account}*AM:${amount.toFixed(2)}*CC:CZK*MSG:${message}*X-VS:${variableSymbol}`
}
