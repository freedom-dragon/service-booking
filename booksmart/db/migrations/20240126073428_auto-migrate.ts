import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `shop` add column `bio` text null')
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `shop` drop column `bio`')
}
