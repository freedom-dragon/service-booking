import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` drop column `cover_image`')
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` add column `cover_image` text not null')
}
