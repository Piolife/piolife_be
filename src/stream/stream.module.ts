import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';

@Module({
  providers: [StreamService],
  exports: [StreamService], // so other modules can use it
})
export class StreamModule {}
