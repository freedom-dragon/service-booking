import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `service_timeslot` drop column `hours`')

  if (!(await knex.schema.hasTable('timeslot_hour'))) {
    await knex.schema.createTable('timeslot_hour', table => {
      table.increments('id')
      table.integer('service_timeslot_id').unsigned().notNullable().references('service_timeslot.id')
      table.text('start_time').notNullable()
      table.text('end_time').notNullable()
      table.timestamps(false, true)
    })
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('timeslot_hour')
  await knex.raw('alter table `service_timeslot` add column `hours` text not null')
}
