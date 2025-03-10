import { AppModule } from './app.module';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.use(helmet());
  app.enableCors();

  app.setGlobalPrefix('api/v12');
  app.setViewEngine('hbs');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const documentationOptions = new DocumentBuilder()
    .setTitle('PIOLIFE API DOCS')
    .setDescription('The PIOLIFE App API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'Authorization',
    )
    .build();
  const document = SwaggerModule.createDocument(app, documentationOptions);
  SwaggerModule.setup('api/docs', app, document);
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, () => {
    console.log(
      `Server is running on port ${PORT}\nDatabase connected successfully`,
    );
  });
}


bootstrap();