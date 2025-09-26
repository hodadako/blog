import {EntityRepository} from '@mikro-orm/core';
import {Post, PostContent, PostTag, Tag} from '@backend/post';
import {PostModule} from '../../post.module';

describe('PostRepositoryAdapter (Integration)', () => {
    const context = setupDatabaseTest([Post, PostContent, PostTag, Tag], [PostModule]);

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
