import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('delete from `service_option`')
  await knex.raw('delete from `service`')
  await knex.raw('alter table `service` add column `unit_price` integer not null')
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` drop column `unit_price`')
}
