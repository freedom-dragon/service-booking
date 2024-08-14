import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  {
    // alter column (booking.service_option_id) to be nullable

    let booking_rows = await knex.select('*').from('booking')
    let booking_answer_rows = await knex.select('*').from('booking_answer')
    let receipt_rows = await knex.select('*').from('receipt')

    await knex.schema.dropTable('receipt')
    await knex.schema.dropTable('booking_answer')
    await knex.schema.dropTable('booking')

    if (!(await knex.schema.hasTable('booking'))) {
      await knex.schema.createTable('booking', table => {
        table.increments('id')
        table.integer('user_id').unsigned().notNullable().references('user.id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.integer('service_option_id').unsigned().nullable().references('service_option.id')
        table.integer('submit_time').notNullable()
        table.integer('appointment_time').notNullable()
        table.integer('arrive_time').nullable()
        table.integer('approve_time').nullable()
        table.integer('reject_time').nullable()
        table.integer('cancel_time').nullable()
        table.integer('amount').notNullable()
        table.text('total_price').nullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('booking_answer'))) {
      await knex.schema.createTable('booking_answer', table => {
        table.increments('id')
        table.integer('booking_id').unsigned().notNullable().references('booking.id')
        table.integer('service_question_id').unsigned().notNullable().references('service_question.id')
        table.text('answer').notNullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('receipt'))) {
      await knex.schema.createTable('receipt', table => {
        table.increments('id')
        table.integer('booking_id').unsigned().notNullable().references('booking.id')
        table.text('filename').notNullable()
        table.integer('upload_time').notNullable()
        table.timestamps(false, true)
      })
    }

    for (let row of booking_rows) {
      await knex.insert(row).into('booking')
    }
    for (let row of booking_answer_rows) {
      await knex.insert(row).into('booking_answer')
    }
    for (let row of receipt_rows) {
      await knex.insert(row).into('receipt')
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  {
    // alter column (booking.service_option_id) to be non-nullable

    let booking_rows = await knex.select('*').from('booking')
    let booking_answer_rows = await knex.select('*').from('booking_answer')
    let receipt_rows = await knex.select('*').from('receipt')

    await knex.schema.dropTable('receipt')
    await knex.schema.dropTable('booking_answer')
    await knex.schema.dropTable('booking')

    if (!(await knex.schema.hasTable('booking'))) {
      await knex.schema.createTable('booking', table => {
        table.increments('id')
        table.integer('user_id').unsigned().notNullable().references('user.id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.integer('service_option_id').unsigned().notNullable().references('service_option.id')
        table.integer('submit_time').notNullable()
        table.integer('appointment_time').notNullable()
        table.integer('arrive_time').nullable()
        table.integer('approve_time').nullable()
        table.integer('reject_time').nullable()
        table.integer('cancel_time').nullable()
        table.integer('amount').notNullable()
        table.text('total_price').nullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('booking_answer'))) {
      await knex.schema.createTable('booking_answer', table => {
        table.increments('id')
        table.integer('booking_id').unsigned().notNullable().references('booking.id')
        table.integer('service_question_id').unsigned().notNullable().references('service_question.id')
        table.text('answer').notNullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('receipt'))) {
      await knex.schema.createTable('receipt', table => {
        table.increments('id')
        table.integer('booking_id').unsigned().notNullable().references('booking.id')
        table.text('filename').notNullable()
        table.integer('upload_time').notNullable()
        table.timestamps(false, true)
      })
    }

    for (let row of booking_rows) {
      await knex.insert(row).into('booking')
    }
    for (let row of booking_answer_rows) {
      await knex.insert(row).into('booking_answer')
    }
    for (let row of receipt_rows) {
      await knex.insert(row).into('receipt')
    }
  }
}
