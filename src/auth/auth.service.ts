import { Injectable } from '@nestjs/common';

@Injectable({})
export class AuthService {
  signup() {
    return { msg: 'This is singup!' };
  }

  signin() {
    return { msg: 'This is singin!' };
  }
}
