import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` drop column `question`')

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
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('booking_answer')
  await knex.schema.dropTableIfExists('service_question')
  await knex.raw('alter table `service` add column `question` text null')
}
