import {Post} from "@backend/post";
import {CreatePostRequest} from "@schema/post";

describe('Post Entity', () => {
    describe('create', () => {
        it('should create a Post with viewCount initialized to 0', () => {
            const request: CreatePostRequest = {
                name: '言って。',
                contents: []
            }

            const post = Post.create(request);

            expect(post.viewCount).toBe(0);
        });
    });
})
