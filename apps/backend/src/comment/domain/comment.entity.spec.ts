import { createCommentRequestFixture } from '@schema/comment';
import { Comment } from '@backend/comment/domain/comment.entity';

describe('Comment Entity', () => {
  describe('create', () => {
    it('should create a Comment with isBlocked initialized to false', () => {
      const request = createCommentRequestFixture();

      const comment = Comment.create(request);

      expect(comment.isBlocked).toBe(false);
    });
  });
});
