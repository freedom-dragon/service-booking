export function formatPrice(price: string | number | null): string | number {
  if (!price) return '-'
  if (price == '0' || +price!) price = +price!
  if (price == 0) return '$0 (Free)'
  if (price) return '$' + price.toLocaleString()
  return price
}
