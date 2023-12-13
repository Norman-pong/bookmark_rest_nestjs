import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { AuthDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signup(dto: AuthDto) {
    // generate the password hash value
    const hash = await argon.hash(dto.password);

    try {
      // save the new user in the db
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
        // options 1. Select return Object
        // select: {
        //   email:true,
        //   hash: false,
        //   ...
        // },
      });

      // options 2. The hash of user is not returned
      delete user.hash;

      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // prisma error-codes https://www.prisma.io/docs/orm/reference/error-reference#error-codes
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            `Unique consstraint failed on the ${error.meta?.target}`,
          );
        }
      }
      throw error;
    }
  }

  signin() {
    return { msg: 'This is singin!' };
  }
}
