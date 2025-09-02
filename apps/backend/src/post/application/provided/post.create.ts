import {CreatePostRequest} from "@schema/post";
import {Post} from "@backend/post";

export abstract class PostCreate {
    abstract create(createPostRequest: CreatePostRequest): Promise<Post>;
}