import { Knex } from 'knex'
import { Booking } from '../proxy'
import { calcBookingTotalFee } from '../service-store'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  let rows = await knex.raw('select * from booking where total_price is null')
  for (let row of rows) {
    let booking: Booking = row
    let rows = await knex.raw('select * from service where id = :id', { id: booking.service_id })
    booking.service = rows[0]
    let fee = calcBookingTotalFee(booking)
    await knex.raw(
      'update booking set total_price = :total_price where id = :id',
      {
        id: booking.id,
        total_price: fee.total_fee
      },
    )
  }
  {
    // alter column (booking.total_price) to be non-nullable

    let booking_rows = await knex.select('*').from('booking')
    let receipt_rows = await knex.select('*').from('receipt')

    await knex.schema.dropTable('receipt')
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
        table.integer('total_price').notNullable()
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
    for (let row of receipt_rows) {
      await knex.insert(row).into('receipt')
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  {
    // alter column (booking.total_price) to be nullable

    let booking_rows = await knex.select('*').from('booking')
    let receipt_rows = await knex.select('*').from('receipt')

    await knex.schema.dropTable('receipt')
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
        table.integer('total_price').nullable()
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
    for (let row of receipt_rows) {
      await knex.insert(row).into('receipt')
    }
  }
}
