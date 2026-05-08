import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@/modules/auth/interfaces/jwt-payload.interface';

export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
