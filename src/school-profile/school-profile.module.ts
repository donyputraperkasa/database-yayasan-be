import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SchoolProfileController } from './school-profile.controller';
import { SchoolProfileService } from './school-profile.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [SchoolProfileController],
  providers: [SchoolProfileService],
  exports: [SchoolProfileService],
})
export class SchoolProfileModule {}
