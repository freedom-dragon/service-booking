import { config as loadEnv } from 'dotenv'
import { populateEnv } from 'populate-env'
import { cwd } from 'process'

loadEnv()

export let env = {
  NODE_ENV: 'development' as 'development' | 'production',
  PORT: 8100,
  COOKIE_SECRET: '',
  EPOCH: 1, // to distinct initial run or restart in serve mode
  UPLOAD_DIR: 'uploads',
  EMAIL_SERVICE: 'google',
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: 587,
  EMAIL_USER: '',
  EMAIL_PASSWORD: '',
  ORIGIN: '',
  GOOGLE_CLIENT_ID:
    '181718440927-aj8ts47abu75a51prit944ha79nm36ui.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: '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',
  FACEBOOK_APP_ID: '586106162979247',
  FACEBOOK_APP_SECRET: '3206dc3d7053a235d9563beb160e2a10',
}
applyDefaultEnv()

function applyDefaultEnv() {
  if (process.env.NODE_ENV === 'production') return
  let PORT = process.env.PORT || env.PORT
  env.COOKIE_SECRET ||= process.env.COOKIE_SECRET || cwd()
  env.EMAIL_USER ||= process.env.EMAIL_USER || 'skip'
  env.EMAIL_PASSWORD ||= process.env.EMAIL_PASSWORD || 'skip'
  env.ORIGIN ||= process.env.ORIGIN || 'http://localhost:' + PORT
}

populateEnv(env, { mode: 'halt' })
