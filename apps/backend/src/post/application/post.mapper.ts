import {Post, PostContent} from "@backend/post";
import {FindPostsResponse} from "@schema/post";
import {FindPostsItem} from "@schema/post/post.response";
import {assertNotNull} from "@backend/common";

export class PostMapper {
    static toFindPostsResponse(posts: Post[], hasNext: boolean, nextCursor?: string): FindPostsResponse {
        return {
            posts: posts.map(this.toFindPostsItem),
            hasNext: hasNext,
            nextCursor: nextCursor,
        }
    }

    static toFindPostsItem(post: Post): FindPostsItem {
        assertNotNull<Post>(post, 'Post not found');
        const postContent = post.contents?.[0];

        assertNotNull<PostContent>(postContent, 'Post content not found');

        return {
            id: post.id,
            title: postContent?.title ?? '',
            description: postContent?.description ?? '',
            createdAt: postContent?.createdAt?.toISOString() ?? '',
            updatedAt: postContent?.updatedAt?.toISOString() ?? '',
            slug: postContent?.slug ?? '',
            tags: post.tags?.map(tag => tag.tag?.name).filter(Boolean) ?? [],
        }
    }
}