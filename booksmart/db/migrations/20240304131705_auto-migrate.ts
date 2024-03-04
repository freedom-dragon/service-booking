import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('delete from `booking`')
  await knex.raw('alter table `booking` add column `user_id` integer not null references `user`(`id`)')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `booking` drop column `user_id`')
}
