import {z} from "zod";

export const commentSchema = z.object({
    id: z.number().nonoptional("댓글 ID가 필요합니다."),
    content: z.string().nonempty("댓글 내용이 필요합니다."),
    password: z.string().nonempty("댓글 비밀번호가 필요합니다."),
    isBlocked: z.boolean().nonoptional("댓글 차단 여부가 필요합니다."),
    author: z.string().nonempty("댓글 작성자가 필요합니다.").max(255, "댓글 작성자는 최대 255자까지 가능합니다."),
    language: z.enum(["English", "Korean", "Japanese"]),
    createdAt: z.date(),
    updatedAt: z.date(),
})