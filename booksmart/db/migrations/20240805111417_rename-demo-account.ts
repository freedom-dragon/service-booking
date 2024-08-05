import { existsSync, renameSync } from 'fs'
import type { Knex } from 'knex'
import { join } from 'path'

let dir = find_dir()

function find_dir() {
  for (let dir of [
    'public/assets/shops',
    '../public/assets/shops',
    '../../public/assets/shops',
  ]) {
    if (existsSync(dir)) {
      return dir
    }
  }
  throw new Error('failed to resolve assets directory')
}

export async function up(knex: Knex): Promise<void> {
  await knex('user')
    .where({ tel: '+85262787635' })
    .update({ tel: '+85265432198' })
  await knex('shop')
    .where({ slug: 'lab.on.the.balconi' })
    .update({ slug: 'demo.on.the.balconi' })
  renameSync(join(dir, 'lab.on.the.balconi'), join(dir, 'demo.on.the.balconi'))
}

export async function down(knex: Knex): Promise<void> {
  await knex('user')
    .where({ tel: '+85265432198' })
    .update({ tel: '+85262787635' })
  await knex('shop')
    .where({ slug: 'demo.on.the.balconi' })
    .update({ slug: 'lab.on.the.balconi' })
  renameSync(join(dir, 'demo.on.the.balconi'), join(dir, 'lab.on.the.balconi'))
}
