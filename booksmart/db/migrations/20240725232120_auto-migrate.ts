import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('service', table => {
    table.renameColumn('timeslot_interval', 'timeslot_interval_minute')
  })
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('service', table => {
    table.renameColumn('timeslot_interval_minute', 'timeslot_interval')
  })
}
