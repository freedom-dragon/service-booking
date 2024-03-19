import { Service, Shop } from '../../db/proxy.js'
import { env } from '../env.js'

export function toShopUrl(shop: Shop) {
  return `${env.ORIGIN}/shop/${shop.slug}`
}

export function toServiceUrl(service: Service) {
  let shop = service.shop!
  return `${env.ORIGIN}/shop/${shop.slug}/service/${service.slug}`
}
