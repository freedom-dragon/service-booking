import { Shop, proxy } from '../../../db/proxy.js'
import { HttpError } from '../../exception.js'
import type { DynamicContext } from '../context'
import { find } from 'better-sqlite3-proxy'

export function getContextShopSlug(context: DynamicContext): string {
  let { shop_slug } = context.routerMatch?.params
  if (!shop_slug) throw new HttpError(400, 'missing shop slug')
  return shop_slug
}

export function getContextShop(
  context: DynamicContext & Partial<ShopContext>,
): Shop {
  if (context.shop) return context.shop

  let shop_slug = getContextShopSlug(context)
  let shop = find(proxy.shop, { slug: shop_slug })
  if (!shop) throw new HttpError(404, 'shop not found')

  context.shop = shop
  return shop
}

export type ShopContext = DynamicContext & {
  shop: Shop
}
