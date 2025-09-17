import { Test, TestingModule } from '@nestjs/testing';
import { EntityRepository, MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { StartedMySqlContainer } from '@testcontainers/mysql';
import {
  startMySqlContainer,
  stopMySqlContainer,
} from '../../../test/testcontainer.config';
import { Post, PostContent, PostTag, Tag } from '@backend/post';
import { PostModule } from '../../post.module';
import { MySqlDriver } from '@mikro-orm/mysql';

describe('PostRepositoryAdapter (Integration)', () => {
  let module: TestingModule;
  let orm: MikroORM;
  let container: StartedMySqlContainer;

  beforeAll(async () => {
    container = await startMySqlContainer();

    module = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          dbName: 'test',
          user: 'test-user',
          password: 'test-password',
          host: container.getHost(),
          port: container.getPort(),
          driver: MySqlDriver,
          entities: [Post, PostContent, PostTag, Tag],
        }),
        PostModule,
      ],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    await orm.getSchemaGenerator().updateSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    await stopMySqlContainer();
    await module.close();
  });

  beforeEach(async () => {
    await orm.getSchemaGenerator().clearDatabase();
  });

  it('should create a post without content', async () => {
    const forkedEM = orm.em.fork();
    const postRepository: EntityRepository<Post> = forkedEM.getRepository(Post);

    const post = Post.create();
    const createdPost = postRepository.create(post);

    await forkedEM.flush();

    const foundPost = await forkedEM.findOne(Post, { id: createdPost.id });

    expect(foundPost).not.toBeNull();
    expect(foundPost!.id).toEqual(createdPost.id);
  });
});
