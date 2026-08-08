// Builds a WhatsApp "click-to-chat" link (wa.me) pre-filled with a receipt
// message. There's no way to check ahead of time whether a number is
// actually on WhatsApp — clicking the link is the only real test; WhatsApp
// itself shows an error if the number isn't registered.
export function toWhatsAppNumber(phone) {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('92')) return digits
  if (digits.startsWith('0')) return '92' + digits.slice(1)
  return digits
}

export function buildReceiptMessage(order, businessName) {
  const lines = order.items.map((oi) => `${oi.item.name} x${oi.quantity}`).join('\n')
  return (
    `Receipt — Order #${order.id}\n` +
    `${lines}\n` +
    `Total: Rs ${order.total_amount}\n\n` +
    `Thank you for shopping with ${businessName || 'us'}!`
  )
}

export function buildWhatsAppReceiptUrl(order, phone, businessName) {
  const number = toWhatsAppNumber(phone)
  const message = encodeURIComponent(buildReceiptMessage(order, businessName))
  return `https://wa.me/${number}?text=${message}`
}
