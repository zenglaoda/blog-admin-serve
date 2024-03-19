import { NestApplicationContext } from '@nestjs/core';

let context: NestApplicationContext;
export function getContext() {
  return context;
}
export function setContext(app: NestApplicationContext) {
  context = app;
}
