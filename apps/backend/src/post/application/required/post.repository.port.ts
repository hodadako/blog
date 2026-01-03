import { Post } from '@backend/post';
import { Language } from '@backend/common';

export abstract class PostRepository {
  abstract create(post: Post): Post;

  abstract findById(id: number): Promise<Post | null>;

  abstract findAll(
    limit: number,
    language: Language,
    tags?: string,
    cursor?: string,
  ): Promise<Post[]>;
}
