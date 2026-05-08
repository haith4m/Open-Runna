import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiCoachService } from '../services/ai-coach.service';

@ApiTags('coach')
@Controller('coach')
export class CoachController {
  constructor(private coachService: AiCoachService) {}
  // Coach endpoints
}
