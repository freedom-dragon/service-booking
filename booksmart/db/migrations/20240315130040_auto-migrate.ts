import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  {
    const rows = await knex.select('id', 'unit_price').from('service')
    await knex.raw('alter table `service` drop column `unit_price`')
    await knex.raw("alter table `service` add column `unit_price` text null")
    for (let row of rows) {
      await knex('service').update({ unit_price: row.unit_price }).where({ id: row.id })
    }
  }
  {
    const rows = await knex.select('id', 'unit_price').from('service')
    await knex.raw('alter table `service` drop column `unit_price`')
    await knex.raw("alter table `service` add column `unit_price` text null")
    for (let row of rows) {
      await knex('service').update({ unit_price: row.unit_price }).where({ id: row.id })
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  // FIXME: alter column (service.unit_price) to be non-nullable not supported in sqlite
  // you may set it to be non-nullable with sqlite browser manually
  {
    const rows = await knex.select('id', 'unit_price').from('service')
    await knex.raw('alter table `service` drop column `unit_price`')
    await knex.raw("alter table `service` add column `unit_price` integer not null")
    for (let row of rows) {
      await knex('service').update({ unit_price: row.unit_price }).where({ id: row.id })
    }
  }
}
