import { proxy } from '../../db/proxy.js'
import { find } from 'better-sqlite3-proxy'

export function findUserByTel(tel: string) {
  return find(proxy.user, { tel }) || find(proxy.user, { tel: tel.slice(-8) })
}
