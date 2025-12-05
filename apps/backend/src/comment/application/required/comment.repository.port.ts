import {Comment} from "@backend/comment/domain/comment.entity";

export abstract class CommentRepository {
    abstract create(comment: Comment): Comment;
}
