import { Test, TestingModule } from '@nestjs/testing';
import { MedLabStockService } from './medlab-stock.service';
describe('MedLabStockService', () => {
  let service: MedLabStockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedLabStockService],
    }).compile();

    service = module.get<MedLabStockService>(MedLabStockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
