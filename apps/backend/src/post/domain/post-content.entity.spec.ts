import { PostContent } from '@backend/post';
import {CreatePostContentRequest, createPostContentRequestFixture} from '@schema/post';

describe('PostContent Entity', () => {
  describe('create', () => {
    it('should set the isPublished field to true by default upon creation', () => {
      const request = createPostContentRequestFixture();

      const postContent = PostContent.create(request);

      expect(postContent.isPublished).toBe(true);
    });
  });
});
