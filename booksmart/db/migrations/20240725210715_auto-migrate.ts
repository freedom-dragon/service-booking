import { Knex } from 'knex'
import { proxy } from '../proxy'

async function reset(knex: Knex) {
  await knex('user').update({ shop_id: null })
  for (let table of Object.keys(proxy).reverse()) {
    console.log('reset', table)
    await knex(table).delete()
  }
}

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await reset(knex)
  await knex.schema.alterTable('user',table=>{
    table.dropUnique(['shop_id','username'])
    table.dropUnique(['shop_id','email'])
    table.dropUnique(['shop_id','tel'])
  })
  await knex.raw('alter table `user` drop column `shop_id`')
  await knex.schema.alterTable('user',table=>{
    table.unique(['username'])
    table.unique(['email'])
    table.unique(['tel'])
  })
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user',table=>{
    table.dropUnique(['username'])
    table.dropUnique(['email'])
    table.dropUnique(['tel'])
  })
  await knex.raw('alter table `user` add column `shop_id` integer null references `shop`(`id`)')
  await knex.schema.alterTable('user',table=>{
    table.unique(['shop_id','username'])
    table.unique(['shop_id','email'])
    table.unique(['shop_id','tel'])
  })
}
