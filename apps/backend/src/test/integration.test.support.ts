import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { StartedMySqlContainer } from '@testcontainers/mysql';
import { startMySqlContainer, stopMySqlContainer } from '@backend/test';
import { MySqlDriver } from '@mikro-orm/mysql';

export interface TestSetupResult {
  module: TestingModule;
  orm: MikroORM;
  container: StartedMySqlContainer;
}

async function setupDatabaseTestModule(
  entities: any[],
  imports: any[] = [],
  dbName = 'test',
): Promise<TestSetupResult> {
  const container = await startMySqlContainer();

  const module = await Test.createTestingModule({
    imports: [
      MikroOrmModule.forRoot({
        dbName,
        user: 'test-user',
        password: 'test-password',
        host: container.getHost(),
        port: container.getPort(),
        driver: MySqlDriver,
        entities,
      }),
      ...imports,
    ],
  }).compile();

  const orm = module.get<MikroORM>(MikroORM);
  await orm.getSchemaGenerator().updateSchema();

  return { module, orm, container };
}

async function teardownDatabaseTestModule(result: TestSetupResult) {
  await result.orm.close(true);
  await stopMySqlContainer();
  await result.module.close();
}

export async function setupDatabaseTest(entities: any[], imports: any[] = []) {
  let result: TestSetupResult;

  beforeAll(async () => {
    result = await setupDatabaseTestModule(entities, imports);
  });

  afterAll(() => {
    await teardownDatabaseTestModule(result);
  });

  beforeEach(async () => {
    await context.orm.getSchemaGenerator().clearDatabase();
  });

  return () => context;
}
