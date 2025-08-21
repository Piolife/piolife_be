import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyStockService } from './emergency.service';
describe('EmergencyStockService', () => {
  let service: EmergencyStockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmergencyStockService],
    }).compile();

    service = module.get<EmergencyStockService>(EmergencyStockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
