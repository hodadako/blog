import {Post} from "@backend/post";

export abstract class PostRepository {
    abstract register(post: Post): Promise<Post>;
}