import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `shop` add column `background_color` text null')
  await knex.raw('alter table `shop` add column `font_family` text null')
  await knex.raw('alter table `shop` add column `top_banner` integer null')
  await knex.raw('alter table `shop` add column `booking_banner` integer null')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `shop` drop column `booking_banner`')
  await knex.raw('alter table `shop` drop column `top_banner`')
  await knex.raw('alter table `shop` drop column `font_family`')
  await knex.raw('alter table `shop` drop column `background_color`')
}
