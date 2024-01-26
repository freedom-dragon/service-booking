import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` add column `max_option` integer null')
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` drop column `max_option`')
}
