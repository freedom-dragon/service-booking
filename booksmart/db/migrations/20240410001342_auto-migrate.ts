import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  {
    // alter column (service.quota) to be non-nullable

    let service_rows = await knex.select('*').from('service')
    let service_remark_rows = await knex.select('*').from('service_remark')
    let service_option_rows = await knex.select('*').from('service_option')
    let booking_rows = await knex.select('*').from('booking')
    let receipt_rows = await knex.select('*').from('receipt')
    let service_timeslot_rows = await knex.select('*').from('service_timeslot')
    let timeslot_hour_rows = await knex.select('*').from('timeslot_hour')

    await knex.schema.dropTable('timeslot_hour')
    await knex.schema.dropTable('service_timeslot')
    await knex.schema.dropTable('receipt')
    await knex.schema.dropTable('booking')
    await knex.schema.dropTable('service_option')
    await knex.schema.dropTable('service_remark')
    await knex.schema.dropTable('service')

    if (!(await knex.schema.hasTable('service'))) {
      await knex.schema.createTable('service', table => {
        table.increments('id')
        table.integer('shop_id').unsigned().notNullable().references('shop.id')
        table.text('slug').notNullable()
        table.text('name').notNullable()
        table.integer('times').nullable()
        table.text('hours').notNullable()
        table.integer('book_duration_minute').notNullable()
        table.text('unit_price').nullable()
        table.text('price_unit').notNullable()
        table.text('time').notNullable()
        table.integer('quota').notNullable()
        table.text('address').nullable()
        table.text('address_remark').nullable()
        table.text('desc').nullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('service_remark'))) {
      await knex.schema.createTable('service_remark', table => {
        table.increments('id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.text('title').nullable()
        table.text('content').notNullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('service_option'))) {
      await knex.schema.createTable('service_option', table => {
        table.increments('id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.text('name').notNullable()
        table.timestamps(false, true)
      })
    }
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
    if (!(await knex.schema.hasTable('service_timeslot'))) {
      await knex.schema.createTable('service_timeslot', table => {
        table.increments('id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.text('start_date').notNullable()
        table.text('end_date').notNullable()
        table.text('weekdays').notNullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('timeslot_hour'))) {
      await knex.schema.createTable('timeslot_hour', table => {
        table.increments('id')
        table.integer('service_timeslot_id').unsigned().notNullable().references('service_timeslot.id')
        table.text('start_time').notNullable()
        table.text('end_time').notNullable()
        table.timestamps(false, true)
      })
    }

    for (let row of service_rows) {
      await knex.insert(row).into('service')
    }
    for (let row of service_remark_rows) {
      await knex.insert(row).into('service_remark')
    }
    for (let row of service_option_rows) {
      await knex.insert(row).into('service_option')
    }
    for (let row of booking_rows) {
      await knex.insert(row).into('booking')
    }
    for (let row of receipt_rows) {
      await knex.insert(row).into('receipt')
    }
    for (let row of service_timeslot_rows) {
      await knex.insert(row).into('service_timeslot')
    }
    for (let row of timeslot_hour_rows) {
      await knex.insert(row).into('timeslot_hour')
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  {
    // alter column (service.quota) to be nullable

    let service_rows = await knex.select('*').from('service')
    let service_option_rows = await knex.select('*').from('service_option')
    let booking_rows = await knex.select('*').from('booking')
    let receipt_rows = await knex.select('*').from('receipt')
    let service_timeslot_rows = await knex.select('*').from('service_timeslot')
    let timeslot_hour_rows = await knex.select('*').from('timeslot_hour')
    let service_remark_rows = await knex.select('*').from('service_remark')

    await knex.schema.dropTable('service_remark')
    await knex.schema.dropTable('timeslot_hour')
    await knex.schema.dropTable('service_timeslot')
    await knex.schema.dropTable('receipt')
    await knex.schema.dropTable('booking')
    await knex.schema.dropTable('service_option')
    await knex.schema.dropTable('service')

    if (!(await knex.schema.hasTable('service'))) {
      await knex.schema.createTable('service', table => {
        table.increments('id')
        table.integer('shop_id').unsigned().notNullable().references('shop.id')
        table.text('name').notNullable()
        table.text('hours').notNullable()
        table.text('price_unit').notNullable()
        table.text('time').notNullable()
        table.integer('book_duration_minute').notNullable()
        table.text('slug').notNullable()
        table.text('address').nullable()
        table.text('address_remark').nullable()
        table.text('desc').nullable()
        table.text('unit_price').nullable()
        table.integer('times').nullable()
        table.integer('quota').nullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('service_option'))) {
      await knex.schema.createTable('service_option', table => {
        table.increments('id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.text('name').notNullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('booking'))) {
      await knex.schema.createTable('booking', table => {
        table.increments('id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.integer('submit_time').notNullable()
        table.integer('appointment_time').notNullable()
        table.integer('approve_time').nullable()
        table.integer('arrive_time').nullable()
        table.integer('reject_time').nullable()
        table.integer('amount').notNullable()
        table.integer('service_option_id').unsigned().notNullable().references('service_option.id')
        table.integer('cancel_time').nullable()
        table.integer('user_id').unsigned().notNullable().references('user.id')
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('receipt'))) {
      await knex.schema.createTable('receipt', table => {
        table.increments('id')
        table.integer('booking_id').unsigned().notNullable().references('booking.id')
        table.integer('upload_time').notNullable()
        table.text('filename').notNullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('service_timeslot'))) {
      await knex.schema.createTable('service_timeslot', table => {
        table.increments('id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.text('start_date').notNullable()
        table.text('end_date').notNullable()
        table.text('weekdays').notNullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('timeslot_hour'))) {
      await knex.schema.createTable('timeslot_hour', table => {
        table.increments('id')
        table.integer('service_timeslot_id').unsigned().notNullable().references('service_timeslot.id')
        table.text('start_time').notNullable()
        table.text('end_time').notNullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('service_remark'))) {
      await knex.schema.createTable('service_remark', table => {
        table.increments('id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.text('title').nullable()
        table.text('content').notNullable()
        table.timestamps(false, true)
      })
    }

    for (let row of service_rows) {
      await knex.insert(row).into('service')
    }
    for (let row of service_option_rows) {
      await knex.insert(row).into('service_option')
    }
    for (let row of booking_rows) {
      await knex.insert(row).into('booking')
    }
    for (let row of receipt_rows) {
      await knex.insert(row).into('receipt')
    }
    for (let row of service_timeslot_rows) {
      await knex.insert(row).into('service_timeslot')
    }
    for (let row of timeslot_hour_rows) {
      await knex.insert(row).into('timeslot_hour')
    }
    for (let row of service_remark_rows) {
      await knex.insert(row).into('service_remark')
    }
  }
}
