import { Shop, proxy } from '../../../db/proxy.js'
import { config } from '../../config.js'
import type { DynamicContext } from '../context'
import { find } from 'better-sqlite3-proxy'

export function getShop(
  context: DynamicContext & Partial<ShopContext>,
): Shop | null {
  let slug = config.shop_slug
  let shop = find(proxy.shop, { slug })
  if (!shop) return null
  context.shop = shop
  return shop
}

export type ShopContext = DynamicContext & {
  shop: Shop
}
