import { Test, TestingModule } from '@nestjs/testing';
import { PostQueryService } from './post.query.service';

describe('PostQueryService', () => {
  let service: PostQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostQueryService],
    }).compile();

    service = module.get<PostQueryService>(PostQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
