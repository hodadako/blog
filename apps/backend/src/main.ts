import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ServiceExceptionFilter } from '@backend/common/exception/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ServiceExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
