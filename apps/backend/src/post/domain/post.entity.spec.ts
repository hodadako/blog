import { Post } from '@backend/post';
import { createPostRequestFixture } from '@schema/post';

describe('Post Entity', () => {
  describe('create', () => {
    it('should create a Post with viewCount initialized to 0', () => {
      const request = createPostRequestFixture();

      const post = Post.create(request);

      expect(post.viewCount).toBe(0);
    });
  });
});
