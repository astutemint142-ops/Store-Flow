// Consistent PKR money formatting used across every page — always
// "Rs 1,234.00" (thousands separator + 2 decimals), regardless of whether
// the source value is a string from the API or a client-computed number.
export function formatCurrency(value) {
  const amount = Number(value) || 0
  return `Rs ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
