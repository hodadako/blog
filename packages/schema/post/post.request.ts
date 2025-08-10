import {postSchema} from "./post.schema";
import {z} from "zod";

export const createPostSchema = postSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    isPublished: true,
})

export const updatePostSchema = postSchema.omit({
    createdAt: true,
    updatedAt: true,
    isPublished: true,
})

export type CreatePostSchema = z.infer<typeof createPostSchema>;
export type UpdatePostSchema = z.infer<typeof updatePostSchema>;
