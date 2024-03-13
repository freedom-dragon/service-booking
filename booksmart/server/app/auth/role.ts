import { proxy } from '../../../db/proxy.js'
import { Context } from '../context.js'
import { getAuthUser } from './user.js'
import { find } from 'better-sqlite3-proxy'

export function getAuthRole(context: Context) {
  let user = getAuthUser(context)
  let shop = user ? find(proxy.shop, { owner_id: user.id }) : null
  return { user, shop }
}
