import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `shop` add column `tel` text null')
  await knex.raw('alter table `shop` add column `email` text null')
  await knex.raw('alter table `shop` add column `facebook` text null')
  await knex.raw('alter table `shop` add column `messenger` text null')
  await knex.raw('alter table `shop` add column `instagram` text null')
  await knex.raw('alter table `shop` add column `youtube` text null')
  await knex.raw('alter table `shop` add column `whatsapp` text null')
  await knex.raw('alter table `shop` add column `telegram` text null')
  await knex.raw('alter table `shop` add column `twitter` text null')
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `shop` drop column `twitter`')
  await knex.raw('alter table `shop` drop column `telegram`')
  await knex.raw('alter table `shop` drop column `whatsapp`')
  await knex.raw('alter table `shop` drop column `youtube`')
  await knex.raw('alter table `shop` drop column `instagram`')
  await knex.raw('alter table `shop` drop column `messenger`')
  await knex.raw('alter table `shop` drop column `facebook`')
  await knex.raw('alter table `shop` drop column `email`')
  await knex.raw('alter table `shop` drop column `tel`')
}
