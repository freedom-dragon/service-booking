import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('package_service'))) {
    await knex.schema.createTable('package_service', table => {
      table.increments('id')
      table.integer('package_id').unsigned().notNullable().references('package.id')
      table.integer('service_id').unsigned().notNullable().references('service.id')
      table.integer('quantity').notNullable()
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('package_service')
}
