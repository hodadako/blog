import {CreatePostRequest} from "@schema/post/post.request";

export function createPostRequestFixture() : CreatePostRequest {
    return {
        name: '言って。',
        contents: [],
    };
}
