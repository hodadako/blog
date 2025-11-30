import {CreateCommentRequest} from "@schema/comment/comment.request";

export function createCommentRequestFixture() : CreateCommentRequest {
    return {
        content: 'What have you done?',
        password: 'whathaveyoudone',
        author: 'Jane Doe',
        language: 'English',
    };
}