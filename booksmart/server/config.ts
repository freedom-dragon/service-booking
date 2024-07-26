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
    '為各類店鋪輕鬆設置專屬的預訂系統，提升服務效率和客戶體驗。無論是美容院、工作坊、瑜伽還是舞蹈工作室，都能輕鬆管理預約，節省時間，讓業務運行更順暢。',
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
