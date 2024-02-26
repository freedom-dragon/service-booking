import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `service` add column `desc` text null')

  if (!(await knex.schema.hasTable('service_remark'))) {
    await knex.schema.createTable('service_remark', table => {
      table.increments('id')
      table.integer('service_id').unsigned().notNullable().references('service.id')
      table.text('title').nullable()
      table.text('content').notNullable()
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('service_remark')
  await knex.raw('alter table `service` drop column `desc`')
}
