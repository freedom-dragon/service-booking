import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `booking` add column `ticket_id` integer null references `ticket`(`id`)')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `booking` drop column `ticket_id`')
}
