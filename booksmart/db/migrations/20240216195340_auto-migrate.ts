import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('service', table => {
    table.renameColumn('price', 'price_unit')
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('service', table => {
    table.renameColumn('price_unit', 'price')
  })
}
