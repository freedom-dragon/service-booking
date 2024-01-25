import { filter } from 'better-sqlite3-proxy'
import { proxy } from '../../db/proxy.js'

export function getShopLocale(shop_id: number) {
  let rows = filter(proxy.shop_locale, { shop_id })
  let locale: Record<string, string> = {}
  for (let row of rows) {
    locale[row.key] = row.value
  }
  return locale as {
    tutor: string
    service: string
  }
}
