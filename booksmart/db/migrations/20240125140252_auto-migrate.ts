import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

  if (!(await knex.schema.hasTable('shop'))) {
    await knex.schema.createTable('shop', table => {
      table.increments('id')
      table.text('name').notNullable()
      table.text('owner_name').notNullable()
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
      table.text('name').notNullable()
      table.text('hours').notNullable()
      table.text('price').notNullable()
      table.text('time').notNullable()
      table.text('quota').notNullable()
      table.text('cover_image').notNullable()
      table.integer('book_duration_minute').notNullable()
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
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('service_option')
  await knex.schema.dropTableIfExists('service')
  await knex.schema.dropTableIfExists('shop_locale')
  await knex.schema.dropTableIfExists('shop')
}
