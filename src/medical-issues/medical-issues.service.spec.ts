import { Test, TestingModule } from '@nestjs/testing';
import { MedicalIssuesService } from './medical-issues.service';

describe('MedicalIssuesService', () => {
  let service: MedicalIssuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicalIssuesService],
    }).compile();

    service = module.get<MedicalIssuesService>(MedicalIssuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
