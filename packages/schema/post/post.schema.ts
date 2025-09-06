import {z} from "zod";

export const postSchema = z.object({
    id: z.number().nonoptional("게시글 ID가 필요합니다."),
    viewCount: z.number().nonoptional("게시글 조회수가 필요합니다."),
    createdAt: z.date(),
    updatedAt: z.date(),
})
