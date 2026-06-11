import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryProvider } from './cloudinary';

describe('CloudinaryProvider', () => {
  let provider: unknown;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryProvider],
    }).compile();

    provider = module.get('CLOUDINARY');
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
