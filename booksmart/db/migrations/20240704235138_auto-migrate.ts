import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user', table => {
    table.dropUnique(['username'])
    table.dropUnique(['email'])
    table.dropUnique(['tel'])
  })
  await knex.schema.alterTable('user', table => {
    table.unique(['shop_id','username'])
    table.unique(['shop_id','email'])
    table.unique(['shop_id','tel'])
  })
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user', table => {
    table.dropUnique(['shop_id','tel'])
    table.dropUnique(['shop_id','email'])
    table.dropUnique(['shop_id','username'])
  })
  await knex.schema.alterTable('user', table => {
    table.unique(['tel'])
    table.unique(['email'])
    table.unique(['username'])
  })
}
