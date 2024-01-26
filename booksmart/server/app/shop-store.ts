import { filter } from 'better-sqlite3-proxy'
import { proxy } from '../../db/proxy.js'
import { readdirSync } from 'fs'

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

export function getShopCoverImage(shop_slug: string) {
  return `/assets/shops/${shop_slug}/cover.webp`
}

export function getServiceCoverImage(shop_slug: string, service_slug: string) {
  return `/assets/shops/${shop_slug}/${service_slug}/cover.webp`
}

export function getServiceImages(shop_slug: string, service_slug: string) {
  let dir = `assets/shops/${shop_slug}/${service_slug}`
  let filenames = readdirSync(`public/${dir}`)
  let urls: string[] = []
  for (let filename of filenames) {
    if (!filename.startsWith('cover')) {
      urls.push(`/${dir}/${filename}`)
    }
  }
  return urls
}
