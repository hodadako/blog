import {PostContent} from '@backend/post';
import {CreatePostContentRequest} from '@schema/post';

describe('PostContent Entity', () => {
    describe('create', () => {
        it('should set the isPublished field to true by default upon creation', () => {
            const request: CreatePostContentRequest = {
                title: '그래서 나는 Bean Validation을 그만두었다',
                description: '우리는 어째서 Bean Validation이 된걸까?',
                content: 'Bean Validation은...',
                language: 'Korean',
                slug: 'no-more-bean-validation',
            };

            const postContent = PostContent.create(request);

            expect(postContent.isPublished).toBe(true);
        });
    });
});
