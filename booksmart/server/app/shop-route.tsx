import { Service, Shop, proxy } from '../../db/proxy.js'
import { title } from '../config.js'
import { DynamicContext } from './context.js'
import { ResolvedPageRoue } from './routes.js'
import { find } from 'better-sqlite3-proxy'
import { Redirect } from './components/router.js'
import { o } from './jsx/jsx.js'

export function resolveServiceRoute(
  context: DynamicContext,
  callback: (args: {
    service: Service
    shop: Shop
    shop_slug: string
    service_slug: string
  }) => ResolvedPageRoue,
): ResolvedPageRoue {
  let { shop_slug, service_slug } = context.routerMatch?.params
  let shop = find(proxy.shop, { slug: shop_slug })
  if (!shop) {
    return {
      title: title('shop not found'),
      description: 'The shop is not found by slug',
      node: <Redirect href={`/`} />,
    }
  }
  let service = find(proxy.service, {
    shop_id: shop.id!,
    slug: service_slug,
  })
  if (!service) {
    return {
      title: title('service not found'),
      description: 'The service is not found by slug',
      node: <Redirect href={`/shop/${shop_slug}`} />,
    }
  }
  return callback({ service, shop, shop_slug, service_slug })
}
