import { setupDatabaseTest } from '@be-test/integration';
import { Comment } from '@backend/comment';
import { CommentModule } from '@backend/comment/comment.module';
import { createCommentRequestFixture } from '@schema/comment';
import { Post } from '@backend/post';
import { createPostRequestFixture } from '@schema/post';

describe('CommentRepositoryAdapter (Integration)', () => {
  const context = setupDatabaseTest([Comment], [CommentModule]);

  it('should create a comment', async () => {
    const { orm } = context();
    const forkedEM = orm.em.fork();
    const commentRepository = forkedEM.getRepository(Comment);

    const post = Post.create(createPostRequestFixture());
    const comment = Comment.create(createCommentRequestFixture(), post);
    const createdComment = commentRepository.create(comment);

    await forkedEM.flush();

    const foundComment = await forkedEM.findOne(Comment, {
      id: createdComment.id,
    });

    expect(foundComment).not.toBeNull();
    expect(foundComment!.id).toEqual(createdComment.id);
    expect(foundComment!.content).toEqual(createdComment.content);
  });
});
