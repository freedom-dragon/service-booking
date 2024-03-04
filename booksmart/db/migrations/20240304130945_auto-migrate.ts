import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `booking` drop column `name`')
  await knex.raw('alter table `booking` drop column `tel`')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `booking` add column `tel` text not null')
  await knex.raw('alter table `booking` add column `name` text not null')
}
