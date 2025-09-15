import { PostContent } from '@backend/post';

export abstract class PostContentRepository {
  abstract create(postContent: PostContent): PostContent;
}
