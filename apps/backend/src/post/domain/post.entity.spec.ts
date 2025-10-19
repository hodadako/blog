import {Post} from "@backend/post";

describe('Post Entity', () => {
    describe('create', () => {
        it('should create a Post with viewCount initialized to 0', () => {
            const post = Post.create();

            expect(post.viewCount).toBe(0);
        });
    });
})
