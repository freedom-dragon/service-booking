import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` add column `peer_amount` integer null')
  await knex.raw('alter table `service` add column `peer_price` text null')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` drop column `peer_price`')
  await knex.raw('alter table `service` drop column `peer_amount`')
}
