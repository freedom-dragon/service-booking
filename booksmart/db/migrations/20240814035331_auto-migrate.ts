import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('package'))) {
    await knex.schema.createTable('package', table => {
      table.increments('id')
      table.integer('price').notNullable()
      table.integer('shop_id').unsigned().notNullable().references('shop.id')
      table.text('title').notNullable()
      table.integer('start_time').notNullable()
      table.integer('end_time').notNullable()
      table.integer('duration_time').notNullable()
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('ticket'))) {
    await knex.schema.createTable('ticket', table => {
      table.increments('id')
      table.integer('package_id').unsigned().notNullable().references('package.id')
      table.integer('user_id').unsigned().notNullable().references('user.id')
      table.integer('purchase_time').notNullable()
      table.integer('expire_time').notNullable()
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ticket')
  await knex.schema.dropTableIfExists('package')
}
