import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}
  signup() {
    return { msg: 'This is singup!' };
  }

  signin() {
    return { msg: 'This is singin!' };
  }
}
