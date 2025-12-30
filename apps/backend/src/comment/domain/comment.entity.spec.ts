import { createCommentRequestFixture } from '@schema/comment';
import { Comment } from '@backend/comment/domain/comment.entity';
import { Post } from '@backend/post';
import { createPostRequestFixture } from '@schema/post';
import { PendingCommentPayload } from '@backend/comment';

describe('Comment Entity', () => {
  describe('create', () => {
    it('should create a Comment with isBlocked initialized to false', () => {
      const request = createCommentRequestFixture();
      const post = Post.create(createPostRequestFixture());
      const comment = Comment.create(
        PendingCommentPayload.create(request, 1),
        post,
      );

      expect(comment.isBlocked).toBe(false);
    });
  });
});
