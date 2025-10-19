import { EntityRepository } from '@mikro-orm/core';
import { Post, PostContent, PostTag, Tag } from '@backend/post';
import { PostModule } from '../../post.module';
import { createPostRequestFixture } from '@schema/post';
import { setupDatabaseTest } from '@be-test/integration';

describe('PostRepositoryAdapter (Integration)', () => {
  const context = setupDatabaseTest(
    [Post, PostContent, PostTag, Tag],
    [PostModule],
  );

  it('should create a post without content', async () => {
    const { orm } = context();
    const forkedEM = orm.em.fork();
    const postRepository: EntityRepository<Post> = forkedEM.getRepository(Post);

    const createPostRequest = createPostRequestFixture();
    const post = Post.create(createPostRequest);
    const createdPost = postRepository.create(post);

    await forkedEM.flush();

    const foundPost = await forkedEM.findOne(Post, { id: createdPost.id });

    expect(foundPost).not.toBeNull();
    expect(foundPost!.id).toEqual(createdPost.id);
  });
});
