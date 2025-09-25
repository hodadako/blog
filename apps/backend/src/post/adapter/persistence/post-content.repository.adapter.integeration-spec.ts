import { Test, TestingModule } from '@nestjs/testing';
import { EntityRepository, MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { StartedMySqlContainer } from '@testcontainers/mysql';
import {
    startMySqlContainer,
    stopMySqlContainer,
} from '@backend/test';
import { Post, PostContent, PostTag, Tag } from '@backend/post';
import { PostModule } from '../../post.module';
import { MySqlDriver } from '@mikro-orm/mysql';
import { PostContentCreateRequest } from '@schema/post';

describe('PostContentRepositoryAdapter (Integration)', () => {
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

    it('should create a post content', async () => {
        const forkedEM = orm.em.fork();
        const postRepository: EntityRepository<Post> = forkedEM.getRepository(Post);
        const postContentRepository: EntityRepository<PostContent> = forkedEM.getRepository(PostContent);

        const post = Post.create();
        await forkedEM.persistAndFlush(post);

        const createRequest: PostContentCreateRequest = {
            title: 'Test Post Content',
            description: 'A description for the test post content.',
            content: 'The full content of the test post.',
            language: 'English',
            slug: 'test-post-content'
        };

        const postContent = PostContent.create(createRequest);
        postContent.post = post;

        const createdPostContent = postContentRepository.create(postContent);

        await forkedEM.flush();

        const foundPostContent = await forkedEM.findOne(PostContent, { id: createdPostContent.id }, { populate: ['post'] });

        expect(foundPostContent).not.toBeNull();
        expect(foundPostContent!.id).toEqual(createdPostContent.id);
        expect(foundPostContent!.title).toEqual(createRequest.title);
        expect(foundPostContent!.post).toBeDefined();
        expect(foundPostContent!.post.id).toEqual(post.id);
    });
});