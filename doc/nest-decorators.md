# nest-decorators

```typescript
@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})

```
- imports: 在模块中导入其他模块，导入的模块可以在本模块共享

- providers: 指定当前模块提供的服务或者提供者。当前模块提供的服务可以在当前模块中共享

- controllers: 声明当前模块所使用的控制器类，这里使用了 AuthController。控制器负责处理传入的请求，并返回响应。

- exports: 指定当前模块中哪些提供者可以被其他模块使用。在这里，AuthService 被导出，这意味着其他模块可以使用 AuthService 提供的功能。
