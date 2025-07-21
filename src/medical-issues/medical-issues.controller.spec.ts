import { Test, TestingModule } from '@nestjs/testing';
import { MedicalIssuesController } from './medical-issues.controller';

describe('MedicalIssuesController', () => {
  let controller: MedicalIssuesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalIssuesController],
    }).compile();

    controller = module.get<MedicalIssuesController>(MedicalIssuesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
