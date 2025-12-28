import { Post } from '@backend/post';

export abstract class PostRepository {
  abstract create(post: Post): Post;
  abstract findById(id: number): Promise<Post | null>;
}
