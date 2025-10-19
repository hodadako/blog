import {z} from "zod";

export const postSchema = z.object({
    id: z.number().nonoptional("게시글 ID가 필요합니다."),
    name: z.string().nonempty("게시글 이름이 필요합니다.").max(255, "게시글 이름은 최대 255자까지 가능합니다."),
    viewCount: z.number().nonoptional("게시글 조회수가 필요합니다."),
    createdAt: z.date(),
    updatedAt: z.date(),
})
