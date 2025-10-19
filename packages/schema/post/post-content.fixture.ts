import {CreatePostContentRequest} from "@schema/post/post-content.request";

export function createPostContentRequestFixture(): CreatePostContentRequest {
    return {
        title: '그래서 나는 Bean Validation을 그만두었다',
        description: '우리는 어째서 Bean Validation이 된걸까?',
        content: 'Bean Validation은...',
        language: 'Korean',
        slug: 'no-more-bean-validation',
    };
}