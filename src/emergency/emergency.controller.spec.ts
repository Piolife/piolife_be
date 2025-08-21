import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyStockController } from './emergency.controller';

describe('EmergencyStockController', () => {
  let controller: EmergencyStockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmergencyStockController],
    }).compile();

    controller = module.get<EmergencyStockController>(EmergencyStockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
