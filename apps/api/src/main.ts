import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 4000);
  // eslint-disable-next-line no-console
  console.log(`API up on ${await app.getUrl()}`);
}
bootstrap();
