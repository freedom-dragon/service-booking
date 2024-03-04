import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  // FIXME: alter column (user.tel) to be non-nullable not supported in sqlite
  // you may set it to be non-nullable with sqlite browser manually
  await knex.raw('alter table `user` add column `nickname` text null')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `user` drop column `nickname`')
}
