import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('booking'))) {
    await knex.schema.createTable('booking', table => {
      table.increments('id')
      table.integer('service_id').unsigned().notNullable().references('service.id')
      table.integer('submit_time').notNullable()
      table.integer('appointment_time').notNullable()
      table.integer('approve_time').nullable()
      table.integer('reject_time').nullable()
      table.integer('amount').notNullable()
      table.integer('service_option_id').unsigned().notNullable().references('service_option.id')
      table.text('tel').notNullable()
      table.text('name').notNullable()
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('booking')
}
