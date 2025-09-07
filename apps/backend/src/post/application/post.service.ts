import {Inject, Injectable} from '@nestjs/common';
import {CreatePostRequest} from '@schema/post';
import {Post} from '@backend/post';
import {PostCreate} from "@backend/post/application/provided/post.create";
import {PostRepository} from "@backend/post/application/required/post.repository.port";

@Injectable()
export class PostService implements PostCreate {
    constructor(
        @Inject()
        private readonly postRepository: PostRepository,
    ) {
    }

    async create(createPostRequest: CreatePostRequest): Promise<Post> {
        return this.postRepository.create(Post.create(createPostRequest));
    }
}
