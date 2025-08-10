import {postSchema} from "./post.schema";
import {z} from "zod";

export const getPostSchema = postSchema.pick({
    id: true,
    title: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    slug: true,
    tags: true,
})

export const getPostListSchema = getPostSchema.pick({
    id: true,
    title: true,
    description: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    slug: true,
    tags: true,
})

export type GetPostResponse = z.infer<typeof getPostSchema>;
export type GetPostListResponse = z.infer<typeof getPostListSchema[]>;