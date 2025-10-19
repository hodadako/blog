import {z} from "zod";

export const postContentSchema = z.object({
    id: z.number().nonoptional("게시글 ID가 필요합니다."),
    title: z.string().nonempty("게시글 제목이 필요합니다."),
    description: z.string().nonempty( "게시글 설명이 필요합니다."),
    content: z.string().nonempty("게시글 내용이 필요합니다."),
    isPublished: z.boolean(),
    slug: z.string().optional(),
    language: z.enum(["English", "Korean", "Japanese"]),
    createdAt: z.date(),
    updatedAt: z.date(),
})
