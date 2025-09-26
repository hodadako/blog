import {TestingModule} from '@nestjs/testing';
import {EntityRepository, MikroORM} from '@mikro-orm/core';
import {StartedMySqlContainer} from '@testcontainers/mysql';
import {teardownDatabaseTestModule,} from '@backend/test';
import {Post, PostContent, PostTag, Tag} from '@backend/post';
import {PostModule} from '../../post.module';

describe('PostRepositoryAdapter (Integration)', () => {
    let module: TestingModule;
    let orm: MikroORM;
    let container: StartedMySqlContainer;

    beforeAll(async () => {
        const result = await setupDatabaseTestModule(
            [Post, PostContent, PostTag, Tag], [PostModule]);
        ({module, orm, container} = result);
    })

    afterAll(async () => {
        await teardownDatabaseTestModule({module, orm, container})
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

        const foundPost = await forkedEM.findOne(Post, {id: createdPost.id});

        expect(foundPost).not.toBeNull();
        expect(foundPost!.id).toEqual(createdPost.id);
    });
});
