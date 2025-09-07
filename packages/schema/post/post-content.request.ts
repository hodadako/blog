import z from "zod";
import {postContentSchema} from "@schema/post/post-content.schema";

export const postContentCreateSchema = postContentSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    isPublished: true,
})

export type PostContentCreateRequest = z.infer<typeof postContentCreateSchema>;