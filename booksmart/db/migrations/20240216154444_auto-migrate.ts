import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

  if (!(await knex.schema.hasTable('service_timeslot'))) {
    await knex.schema.createTable('service_timeslot', table => {
      table.increments('id')
      table.integer('service_id').unsigned().notNullable().references('service.id')
      table.text('start_date').notNullable()
      table.text('end_date').notNullable()
      table.text('weekdays').notNullable()
      table.text('hours').notNullable()
      table.timestamps(false, true)
    })
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('service_timeslot')
}
