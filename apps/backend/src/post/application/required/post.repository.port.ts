import { Post } from '@backend/post';

export abstract class PostRepository {
  abstract create(post: Post): Promise<Post>;
}
