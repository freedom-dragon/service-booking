import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `shop` add column `address` text null')
  await knex.raw('alter table `service` add column `address` text null')
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` drop column `address`')
  await knex.raw('alter table `shop` drop column `address`')
}
