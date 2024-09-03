import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `package_service` drop column `quantity`')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `package_service` add column `quantity` integer not null')
}
