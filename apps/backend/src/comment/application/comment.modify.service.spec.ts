import { Test, TestingModule } from '@nestjs/testing';
import { CommentModifyService } from './comment.modify.service';

describe('CommentModifyService', () => {
  let service: CommentModifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentModifyService],
    }).compile();

    service = module.get<CommentModifyService>(CommentModifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
