import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` add column `question` text null')
  await knex.raw('alter table `booking` add column `answer` text null')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `booking` drop column `answer`')
  await knex.raw('alter table `service` drop column `question`')
}
