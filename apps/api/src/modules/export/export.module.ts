import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module.js';
import { ExportController } from './export.controller.js';
import { ExportService } from './export.service.js';
import { ChromiumPdfRenderer, PdfRenderer } from './pdf-renderer.service.js';
import { PrintTokenService } from './print-token.service.js';

@Module({
  imports: [DashboardModule],
  controllers: [ExportController],
  providers: [ExportService, PrintTokenService, { provide: PdfRenderer, useClass: ChromiumPdfRenderer }],
})
export class ExportModule {}
