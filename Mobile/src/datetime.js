// Consistent date+time formatting for order timestamps — converts the
// backend's UTC ISO string to the viewer's local date/time automatically.
export function formatDateTime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
