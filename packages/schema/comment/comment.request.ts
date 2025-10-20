import {z} from "zod";
import {commentSchema} from "@schema/comment/comment.schema";

export const createCommentSchema = commentSchema.omit({
    id: true,
    isBlocked: true,
    createdAt: true,
    updatedAt: true,
})

export type CreateCommentRequest = z.infer<typeof createCommentSchema>;