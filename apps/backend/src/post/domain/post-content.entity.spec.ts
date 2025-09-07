import { PostContent } from '@backend/post';
import { PostContentCreateRequest } from '@schema/post';

describe('PostContent Entity', () => {
  describe('create', () => {
    it('should set the isPublished field to true by default upon creation', () => {
      const request: PostContentCreateRequest = {
        title: 'Test Title',
        description: 'Test Description',
        content: 'This is the test content.',
        language: 'English',
        slug: 'test-slug',
      };

      const postContent = PostContent.create(request);

      expect(postContent.isPublished).toBe(true);
    });
  });
});
