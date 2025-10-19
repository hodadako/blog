import { Test, TestingModule } from '@nestjs/testing';
import { EntityClass, MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { StartedMySqlContainer } from '@testcontainers/mysql';
import { startMySqlContainer, stopMySqlContainer } from '@backend/test';
import { MySqlDriver } from '@mikro-orm/mysql';
import { DynamicModule, ForwardReference, Type } from '@nestjs/common';

export interface TestSetupResult {
  module: TestingModule;
  orm: MikroORM;
  container: StartedMySqlContainer;
}

async function setupDatabaseTestModule(
  entities: EntityClass<any>[],
  imports: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference<any>
  > = [],
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

export function setupDatabaseTest(
  entities: EntityClass<any>[],
  imports: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference<any>
  > = [],
): () => TestSetupResult {
  let result: TestSetupResult;

  beforeAll(async () => {
    result = await setupDatabaseTestModule(entities, imports);
  });

  afterAll(async () => {
    await teardownDatabaseTestModule(result);
  });

  beforeEach(async () => {
    await result.orm.getSchemaGenerator().clearDatabase();
  });

  return () => result;
}
