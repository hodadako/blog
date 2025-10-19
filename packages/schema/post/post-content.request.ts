import z from "zod";
import {postContentSchema} from "@schema/post/post-content.schema";

export const createPostContentRequest = postContentSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    isPublished: true,
})

export type CreatePostContentRequest = z.infer<typeof createPostContentRequest>;