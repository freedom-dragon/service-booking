import { Service, Shop } from '../../db/proxy.js'
import { config } from '../config.js'

export function toShopUrl(shop: Shop) {
  return `${config.origin}/shop/${shop.slug}`
}

export function toServiceUrl(service: Service) {
  let shop = service.shop!
  return `${config.origin}/shop/${shop.slug}/service/${service.slug}`
}
