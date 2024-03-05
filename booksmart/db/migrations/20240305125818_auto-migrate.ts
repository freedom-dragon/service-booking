import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('receipt'))) {
    await knex.schema.createTable('receipt', table => {
      table.increments('id')
      table.integer('booking_id').unsigned().notNullable().references('booking.id')
      table.integer('upload_time').notNullable()
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('receipt')
}
