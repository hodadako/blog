import {postSchema} from "./post.schema";
import {z} from "zod";
import {postContentCreateSchema} from "@schema/post/post-content.request";

export const createPostSchema = postSchema.omit({
    id: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
}).extend({
    contents: z.array(postContentCreateSchema).min(1),
})

export type CreatePostRequest = z.infer<typeof createPostSchema>;
