import {z} from "zod";

export const postSchema = z.object({
    id: z.number().nonoptional("게시글 ID가 필요합니다."),
    title: z.string().nonempty("게시글 제목이 필요합니다."),
    content: z.string().nonempty("게시글 내용이 필요합니다."),
    createAt: z.date(),
    updatedAt: z.date(),
    isPublished: z.boolean(),
    slug: z.string().optional(),
    tags: z.array(z.string()).optional()
})