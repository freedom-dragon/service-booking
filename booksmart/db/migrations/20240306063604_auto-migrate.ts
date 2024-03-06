import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `shop` add column `payme_tel` text null')
  await knex.raw('alter table `shop` add column `payme_link` text null')
  await knex.raw('alter table `shop` add column `fps_tel` text null')
  await knex.raw('alter table `shop` add column `fps_email` text null')
  await knex.raw('alter table `shop` add column `fps_id` text null')
  await knex.raw('alter table `shop` add column `bank_name` text null')
  await knex.raw('alter table `shop` add column `bank_account_num` text null')
  await knex.raw('alter table `shop` add column `bank_account_name` text null')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `shop` drop column `bank_account_name`')
  await knex.raw('alter table `shop` drop column `bank_account_num`')
  await knex.raw('alter table `shop` drop column `bank_name`')
  await knex.raw('alter table `shop` drop column `fps_id`')
  await knex.raw('alter table `shop` drop column `fps_email`')
  await knex.raw('alter table `shop` drop column `fps_tel`')
  await knex.raw('alter table `shop` drop column `payme_link`')
  await knex.raw('alter table `shop` drop column `payme_tel`')
}
