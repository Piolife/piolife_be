import { Test, TestingModule } from '@nestjs/testing';
import { MedLabStockController } from './medlab-stock.controller';

describe('MedLabStockController', () => {
  let controller: MedLabStockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedLabStockController],
    }).compile();

    controller = module.get<MedLabStockController>(MedLabStockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
