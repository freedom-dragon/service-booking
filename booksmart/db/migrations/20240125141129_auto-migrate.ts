import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `shop` add column `slug` text not null')
  await knex.schema.alterTable(`shop`, table => table.unique([`slug`]))
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(`shop`, table => table.dropUnique([`slug`]))
  await knex.raw('alter table `shop` drop column `slug`')
}
