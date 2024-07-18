import { env } from './env.js'

let production = env.NODE_ENV === 'production'
let development = env.NODE_ENV === 'development'

function fixEpoch() {
  // workaround of initial build twice since esbuild v0.17
  if (env.EPOCH >= 2) {
    return env.EPOCH - 1
  }
  return env.EPOCH
}

let epoch = fixEpoch()

export enum LayoutType {
  navbar = 'navbar',
  sidebar = 'sidebar',
  ionic = 'ionic',
}

export let config = {
  production,
  development,
  minify: production,
  site_name: 'BookSmart Booking System',
  short_site_name: 'BookSmart',
  site_description:
    '方便易用的服務預約平台。預約水管工、電工、髮型師等各種專業服務。瀏覽各種服務供應商，比較價格和評論，輕鬆預約所需服務。立即使用可靠的服務預約網站，節省時間和精力。',
  setup_robots_txt: false,
  epoch,
  auto_open: !production && development && epoch === 1,
  client_target: 'es2020',
  layout_type: LayoutType.ionic,
}

const titleSuffix = ' | ' + config.site_name

export function title(page: string) {
  return page + titleSuffix
}

export let apiEndpointTitle = title('API Endpoint')
