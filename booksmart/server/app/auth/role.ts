import { DynamicContext } from '../context.js'
import { getContextShop } from './shop.js'
import { getAuthUser } from './user.js'

export function getAuthRole(context: DynamicContext) {
  let shop = getContextShop(context)
  let user = getAuthUser(context)
  let is_owner = user && user.id == shop.owner_id
  return { shop, user, is_owner }
}
