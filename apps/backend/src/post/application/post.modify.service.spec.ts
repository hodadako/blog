import { setupDatabaseTest } from '@be-test/integration';
import { Post, PostContent, PostTag, Tag } from '@backend/post';
import { PostModule } from '@backend/post/post.module';
import { PostModify } from '@backend/post/application/provided/post.modify';

describe('PostModifyService', () => {
  const context = setupDatabaseTest(
    [Post, PostContent, PostTag, Tag],
    [PostModule],
  );

  it('should create service instance', async () => {
    const { module } = context();

    const service = module.get<PostModify>(PostModify);
    expect(service).toBeDefined();
  });

  it('should be found in orm ', async () => {
    const { orm } = context();
    const forkedEM = orm.em.fork();
  });
});
