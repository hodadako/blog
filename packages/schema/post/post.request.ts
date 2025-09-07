import {postSchema} from "./post.schema";
import {z} from "zod";

export const createPostSchema = postSchema.omit({
    id: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
}).extend({

})

export type CreatePostRequest = z.infer<typeof createPostSchema>;
