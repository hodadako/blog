import {z} from "zod/index";

export const tagSchema = z.object({
    id: z.number().nonoptional("태그 ID가 필요합니다."),
    name: z.string().nonempty("태그 이름이 필요합니다."),
    createdAt: z.date(),
    updatedAt: z.date(),
})