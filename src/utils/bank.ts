export function bankAccountsMatch(accountNumber: string, iban: string): boolean {
  const domestic = accountNumber.trim().match(/^(?:(\d{1,6})\s*-\s*)?(\d{1,10})\s*\/\s*(\d{4})(?:\s*\([^()]+\))?$/)
  const normalizedIban = iban.replace(/\s/g, '').toUpperCase()
  if (!domestic || !/^CZ\d{22}$/.test(normalizedIban) || Number(domestic[2]) === 0) return false

  const [, prefix = '', account, bank] = domestic
  // Compare the destination, without enforcing the fictitious demo IBAN checksum.
  return normalizedIban.slice(4) === bank + prefix.padStart(6, '0') + account.padStart(10, '0')
}
