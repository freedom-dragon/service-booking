export function formatPrice(price: number): string {
  if (!price) return '-'
  return '$' + price.toLocaleString()
}
