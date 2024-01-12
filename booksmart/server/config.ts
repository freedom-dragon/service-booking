import { config as loadEnv } from 'dotenv'
import { populateEnv } from 'populate-env'
import { cwd } from 'process'

loadEnv()

let env = {
  NODE_ENV: 'development',
  PORT: 8100,
  COOKIE_SECRET: ' ',
  EPOCH: 1, // to distinct initial run or restart in serve mode
  UPLOAD_DIR: 'uploads',
  EMAIL_SERVICE: 'google',
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: 587,
  EMAIL_USER: '',
  EMAIL_PASSWORD: '',
  ORIGIN: '',
}

populateEnv(env, { mode: 'halt' })

let production = env.NODE_ENV === 'production' || process.argv[2] === '--prod'
let development = env.NODE_ENV === 'development' || process.argv[2] === '--dev'

if (production && env.COOKIE_SECRET == ' ') {
  console.error('Missing COOKIE_SECRET in env')
  process.exit(1)
}
if (env.COOKIE_SECRET == ' ') {
  env.COOKIE_SECRET = cwd()
}

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
  port: env.PORT,
  origin: env.ORIGIN,
  cookie_secret: env.COOKIE_SECRET,
  site_name: 'ts-liveview Demo',
  short_site_name: 'demo-site',
  site_description: 'Demo website of ts-liveview',
  setup_robots_txt: false,
  epoch,
  auto_open: !production && development && epoch === 1,
  upload_dir: env.UPLOAD_DIR,
  client_target: 'es2020',
  layout_type: LayoutType.navbar,
  email: {
    service: env.EMAIL_SERVICE,
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASSWORD,
    },
  },
}

const titleSuffix = ' | ' + config.site_name

export function title(page: string) {
  return page + titleSuffix
}

export let apiEndpointTitle = title('API Endpoint')
