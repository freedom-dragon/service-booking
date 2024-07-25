import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  {
    // alter column (shop.owner_id) to be non-nullable

    let shop_rows = await knex.select('*').from('shop')
    let verification_code_rows = await knex.select('*').from('verification_code')
    let shop_locale_rows = await knex.select('*').from('shop_locale')
    let service_rows = await knex.select('*').from('service')
    let service_question_rows = await knex.select('*').from('service_question')
    let booking_answer_rows = await knex.select('*').from('booking_answer')
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
    await knex.schema.dropTable('booking_answer')
    await knex.schema.dropTable('service_question')
    await knex.schema.dropTable('service')
    await knex.schema.dropTable('shop_locale')
    await knex.schema.dropTable('verification_code')
    await knex.schema.dropTable('shop')

    if (!(await knex.schema.hasTable('shop'))) {
      await knex.schema.createTable('shop', table => {
        table.increments('id')
        table.integer('owner_id').unsigned().notNullable().references('user.id')
        table.text('slug').notNullable().unique()
        table.text('name').notNullable()
        table.text('bio').nullable()
        table.text('desc').nullable()
        table.text('owner_name').notNullable()
        table.text('address').nullable()
        table.text('address_remark').nullable()
        table.text('tel').nullable()
        table.text('email').nullable()
        table.text('facebook').nullable()
        table.text('messenger').nullable()
        table.text('instagram').nullable()
        table.text('youtube').nullable()
        table.text('whatsapp').nullable()
        table.text('telegram').nullable()
        table.text('twitter').nullable()
        table.text('floating_contact_method').nullable()
        table.text('payme_tel').nullable()
        table.text('payme_link').nullable()
        table.text('fps_tel').nullable()
        table.text('fps_email').nullable()
        table.text('fps_id').nullable()
        table.text('bank_name').nullable()
        table.text('bank_account_num').nullable()
        table.text('bank_account_name').nullable()
        table.boolean('accept_cash').nullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('verification_code'))) {
      await knex.schema.createTable('verification_code', table => {
        table.increments('id')
        table.specificType('passcode', 'char(6)').notNullable()
        table.string('email', 320).notNullable()
        table.integer('request_time').notNullable()
        table.integer('revoke_time').nullable()
        table.integer('match_id').unsigned().nullable().references('verification_attempt.id')
        table.integer('user_id').unsigned().nullable().references('user.id')
        table.integer('shop_id').unsigned().nullable().references('shop.id')
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('shop_locale'))) {
      await knex.schema.createTable('shop_locale', table => {
        table.increments('id')
        table.integer('shop_id').unsigned().notNullable().references('shop.id')
        table.text('key').notNullable()
        table.text('value').notNullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('service'))) {
      await knex.schema.createTable('service', table => {
        table.increments('id')
        table.integer('shop_id').unsigned().notNullable().references('shop.id')
        table.text('slug').notNullable()
        table.text('name').notNullable()
        table.integer('times').nullable()
        table.integer('book_duration_minute').notNullable()
        table.text('original_price').nullable()
        table.text('unit_price').nullable()
        table.text('price_unit').notNullable()
        table.integer('peer_amount').nullable()
        table.text('peer_price').nullable()
        table.text('time').notNullable()
        table.integer('quota').notNullable()
        table.text('address').nullable()
        table.text('address_remark').nullable()
        table.text('desc').nullable()
        table.integer('archive_time').nullable()
        table.integer('timeslot_interval').nullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('service_question'))) {
      await knex.schema.createTable('service_question', table => {
        table.increments('id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.text('question').notNullable()
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
        table.text('total_price').nullable()
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

    for (let row of shop_rows) {
      await knex.insert(row).into('shop')
    }
    for (let row of verification_code_rows) {
      await knex.insert(row).into('verification_code')
    }
    for (let row of shop_locale_rows) {
      await knex.insert(row).into('shop_locale')
    }
    for (let row of service_rows) {
      await knex.insert(row).into('service')
    }
    for (let row of service_question_rows) {
      await knex.insert(row).into('service_question')
    }
    for (let row of booking_answer_rows) {
      await knex.insert(row).into('booking_answer')
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
    // alter column (shop.owner_id) to be nullable

    let shop_rows = await knex.select('*').from('shop')
    let verification_code_rows = await knex.select('*').from('verification_code')
    let shop_locale_rows = await knex.select('*').from('shop_locale')
    let service_rows = await knex.select('*').from('service')
    let service_remark_rows = await knex.select('*').from('service_remark')
    let service_option_rows = await knex.select('*').from('service_option')
    let booking_rows = await knex.select('*').from('booking')
    let receipt_rows = await knex.select('*').from('receipt')
    let booking_answer_rows = await knex.select('*').from('booking_answer')
    let service_timeslot_rows = await knex.select('*').from('service_timeslot')
    let timeslot_hour_rows = await knex.select('*').from('timeslot_hour')
    let service_question_rows = await knex.select('*').from('service_question')

    await knex.schema.dropTable('service_question')
    await knex.schema.dropTable('timeslot_hour')
    await knex.schema.dropTable('service_timeslot')
    await knex.schema.dropTable('booking_answer')
    await knex.schema.dropTable('receipt')
    await knex.schema.dropTable('booking')
    await knex.schema.dropTable('service_option')
    await knex.schema.dropTable('service_remark')
    await knex.schema.dropTable('service')
    await knex.schema.dropTable('shop_locale')
    await knex.schema.dropTable('verification_code')
    await knex.schema.dropTable('shop')

    if (!(await knex.schema.hasTable('shop'))) {
      await knex.schema.createTable('shop', table => {
        table.increments('id')
        table.text('name').notNullable()
        table.text('owner_name').notNullable()
        table.text('slug').notNullable().unique()
        table.text('address').nullable()
        table.text('address_remark').nullable()
        table.text('bio').nullable()
        table.text('desc').nullable()
        table.text('tel').nullable()
        table.text('email').nullable()
        table.text('facebook').nullable()
        table.text('messenger').nullable()
        table.text('instagram').nullable()
        table.text('youtube').nullable()
        table.text('whatsapp').nullable()
        table.text('telegram').nullable()
        table.text('twitter').nullable()
        table.text('payme_tel').nullable()
        table.text('payme_link').nullable()
        table.text('fps_tel').nullable()
        table.text('fps_email').nullable()
        table.text('fps_id').nullable()
        table.text('bank_name').nullable()
        table.text('bank_account_num').nullable()
        table.text('bank_account_name').nullable()
        table.integer('owner_id').unsigned().nullable().references('user.id')
        table.text('floating_contact_method').nullable()
        table.boolean('accept_cash').nullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('verification_code'))) {
      await knex.schema.createTable('verification_code', table => {
        table.increments('id')
        table.string('email', 320).notNullable()
        table.integer('request_time').notNullable()
        table.integer('revoke_time').nullable()
        table.specificType('passcode', 'char(6)').notNullable()
        table.integer('match_id').unsigned().nullable().references('verification_attempt.id')
        table.integer('user_id').unsigned().nullable().references('user.id')
        table.integer('shop_id').unsigned().nullable().references('shop.id')
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('shop_locale'))) {
      await knex.schema.createTable('shop_locale', table => {
        table.increments('id')
        table.integer('shop_id').unsigned().notNullable().references('shop.id')
        table.text('key').notNullable()
        table.text('value').notNullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('service'))) {
      await knex.schema.createTable('service', table => {
        table.increments('id')
        table.integer('shop_id').unsigned().notNullable().references('shop.id')
        table.text('slug').notNullable()
        table.text('name').notNullable()
        table.integer('times').nullable()
        table.integer('book_duration_minute').notNullable()
        table.text('unit_price').nullable()
        table.text('price_unit').notNullable()
        table.text('time').notNullable()
        table.integer('quota').notNullable()
        table.text('address').nullable()
        table.text('address_remark').nullable()
        table.text('desc').nullable()
        table.integer('archive_time').nullable()
        table.text('original_price').nullable()
        table.integer('peer_amount').nullable()
        table.text('peer_price').nullable()
        table.integer('timeslot_interval').nullable()
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
        table.text('total_price').nullable()
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
    if (!(await knex.schema.hasTable('booking_answer'))) {
      await knex.schema.createTable('booking_answer', table => {
        table.increments('id')
        table.integer('booking_id').unsigned().notNullable().references('booking.id')
        table.integer('service_question_id').unsigned().notNullable().references('service_question.id')
        table.text('answer').notNullable()
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
    if (!(await knex.schema.hasTable('service_question'))) {
      await knex.schema.createTable('service_question', table => {
        table.increments('id')
        table.integer('service_id').unsigned().notNullable().references('service.id')
        table.text('question').notNullable()
        table.timestamps(false, true)
      })
    }

    for (let row of shop_rows) {
      await knex.insert(row).into('shop')
    }
    for (let row of verification_code_rows) {
      await knex.insert(row).into('verification_code')
    }
    for (let row of shop_locale_rows) {
      await knex.insert(row).into('shop_locale')
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
    for (let row of booking_answer_rows) {
      await knex.insert(row).into('booking_answer')
    }
    for (let row of service_timeslot_rows) {
      await knex.insert(row).into('service_timeslot')
    }
    for (let row of timeslot_hour_rows) {
      await knex.insert(row).into('timeslot_hour')
    }
    for (let row of service_question_rows) {
      await knex.insert(row).into('service_question')
    }
  }
}
