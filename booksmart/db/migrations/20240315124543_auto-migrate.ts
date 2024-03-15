import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  {
    const rows = await knex.select('id', 'quota').from('service')
    await knex.raw('alter table `service` drop column `quota`')
    await knex.raw("alter table `service` add column `quota` integer null")
    for (let row of rows) {
      await knex('service').update({ quota: row.quota }).where({ id: row.id })
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  {
    const rows = await knex.select('id', 'quota').from('service')
    await knex.raw('alter table `service` drop column `quota`')
    await knex.raw("alter table `service` add column `quota` text null")
    for (let row of rows) {
      await knex('service').update({ quota: row.quota }).where({ id: row.id })
    }
  }
}
