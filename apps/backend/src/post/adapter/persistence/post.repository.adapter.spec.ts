import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { StartedMySqlContainer } from '@testcontainers/mysql';
import {
  startMySqlContainer,
  stopMySqlContainer,
} from '../../../test/testcontainer.config';
import { PostRepository } from '../../application/required/post.repository.port';
import { Post } from '@backend/post';
import { PostContent } from '../../domain/post-content.entity';
import { PostTag } from '../../domain/post-tag.entity';
import { Tag } from '../../domain/tag.entity';
import { PostModule } from '../../post.module';
import { Language } from '../../../common';
import { PostContentCreateRequest } from '@schema/post';

describe('PostRepositoryAdapter (Integration)', () => {
  let module: TestingModule;
  let orm: MikroORM;
  let postRepository: PostRepository;
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
          type: 'mysql',
          entities: [Post, PostContent, PostTag, Tag],
          synchronize: true,
        }),
        PostModule,
      ],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    postRepository = module.get<PostRepository>(PostRepository);

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
    // Arrange
    const post = Post.create({ contents: [] });

    // Act
    const createdPost = await postRepository.create(post);

    // Assert
    expect(createdPost.id).toBeDefined();
    const foundPost = await orm.em.findOne(Post, { id: createdPost.id });
    expect(foundPost).not.toBeNull();
    expect(foundPost.id).toEqual(createdPost.id);
  });

  it('should create a post but fail to persist its content due to missing cascade option', async () => {
    // Arrange
    const post = Post.create({ contents: [] });

    const contentRequest: PostContentCreateRequest = {
      title: 'Test Title',
      description: 'Test Description',
      content: 'Test content body.',
      language: 'Korean',
      slug: 'test-title',
    };
    const postContent = PostContent.create(contentRequest);

    // Manually associate the content with the post
    post.contents.add(postContent);

    // Act
    const createdPost = await postRepository.create(post);

    // Assert
    expect(createdPost.id).toBeDefined();

    // 1. Check if the post was created
    const foundPost = await orm.em.findOne(
      Post,
      { id: createdPost.id },
      { populate: ['contents'] },
    );
    expect(foundPost).not.toBeNull();
    expect(foundPost.id).toEqual(createdPost.id);

    // 2. Check that the content was NOT persisted
    // The Post.contents collection is a OneToMany relationship.
    // Without `cascade: [Cascade.PERSIST]` or `cascade: [Cascade.ALL]` on the
    // `@OneToMany` decorator in `Post.entity.ts`, the related `PostContent` entity
    // will not be automatically persisted when the `Post` is persisted.
    expect(foundPost.contents.count()).toBe(0);

    const foundContent = await orm.em.findOne(PostContent, {
      post: { id: createdPost.id },
    });
    expect(foundContent).toBeNull();
  });
});
