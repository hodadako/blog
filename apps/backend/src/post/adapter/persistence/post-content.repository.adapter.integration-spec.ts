import {EntityRepository} from '@mikro-orm/core';
import {setupDatabaseTest} from '@backend/test';
import {Post, PostContent, PostTag, Tag} from '@backend/post';
import {PostModule} from '../../post.module';
import {createPostContentRequestFixture, createPostRequestFixture} from '@schema/post';

describe('PostContentRepositoryAdapter (Integration)', () => {
    const context = setupDatabaseTest(
        [Post, PostContent, PostTag, Tag],
        [PostModule],
    );

    it('should create a post content', async () => {
        const {orm} = context();
        const forkedEM = orm.em.fork();
        const postContentRepository: EntityRepository<PostContent> =
            forkedEM.getRepository(PostContent);

        const createPostRequest = createPostRequestFixture();

        const post = Post.create(createPostRequest);
        await forkedEM.persistAndFlush(post);

        const createPostContentRequest = createPostContentRequestFixture();

        const postContent = PostContent.create(createPostContentRequest);
        postContent.post = post;

        const createdPostContent = postContentRepository.create(postContent);

        await forkedEM.flush();

        const foundPostContent = await forkedEM.findOne(
            PostContent,
            {id: createdPostContent.id},
            {populate: ['post']},
        );

        expect(foundPostContent).not.toBeNull();
        expect(foundPostContent!.id).toEqual(createdPostContent.id);
        expect(foundPostContent!.title).toEqual(createdPostContent.title);
        expect(foundPostContent!.post).toBeDefined();
        expect(foundPostContent!.post.id).toEqual(post.id);
    });
});
