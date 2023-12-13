import { Body, Controller, ParseIntPipe, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Req() req: Request) {
    console.log(req.body);
    return this.authService.signup();
  }

  @Post('signin')
  signin(@Body() dto: AuthDto) {
    console.log({ dto });
    return this.authService.signin();
  }
}
