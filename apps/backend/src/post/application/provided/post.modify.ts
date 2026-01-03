import { CreatePostRequest } from '@schema/post';
import { Post } from '@backend/post';

export abstract class PostModify {
  abstract create(createPostRequest: CreatePostRequest): Promise<Post>;
}
