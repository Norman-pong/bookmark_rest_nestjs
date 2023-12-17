import { Test, TestingModule } from '@nestjs/testing';
import {
  HttpCode,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto } from 'src/bookmark/dto/create-bookmark.dto';
import { EditBookmarkDto } from 'src/bookmark/dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3334);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3334');
  });

  afterAll(async () => {
    app.close();
  });

  describe('auth', () => {
    const dto: AuthDto = {
      email: 'test@gmail.com',
      password: 'test',
    };

    describe('Signup', () => {
      it('Should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('Should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: dto.email })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('Should throw if body empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('Success for signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(HttpStatus.CREATED);
      });

      it('Should throw email is exist', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });

    describe('Signin', () => {
      it('Should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('Should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('Should throw Email is not exist', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: 'NotExist@test.com',
            password: dto.password,
          })
          .expectStatus(HttpStatus.FORBIDDEN);
      });

      it('Should throw credentials incorrect', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
            password: 'error',
          })
          .expectStatus(HttpStatus.FORBIDDEN);
      });

      it('Success for signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .stores('jwt', 'access_token');
      });
    });
  });

  describe('user', () => {
    describe('Get me', () => {
      it('Should throw if jwt empty', () => {
        return pactum
          .spec()
          .get('/users/me')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('Should get current info', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{jwt}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('test@gmail.com');
      });
    });

    describe('Edit User', () => {
      const dto: EditUserDto = {
        firstName: 'pong',
      };
      it('Should edit user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{jwt}' })
          .withBody(dto)
          .expectBodyContains('pong')
          .expectBodyContains('test@gmail.com');
      });
    });
  });

  describe('bookmark', () => {
    describe('Get empty bookmarks', () => {
      it('Should get empty bookmarks', () => {
        return pactum
          .spec()
          .withHeaders({ Authorization: 'Bearer $S{jwt}' })
          .get('/bookmarks')
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });
    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'title',
        link: 'https://zhiming.cool',
      };
      it('Should create bookmarks', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{jwt}' })
          .withBody(dto)
          .stores('bookmarkId', 'id')
          .expectStatus(HttpStatus.CREATED)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.link);
      });
    });
    describe('Get bookmarks by not exist id', () => {
      it('Should thorw not found', () => {
        return pactum
          .spec()
          .get('/bookmarks/022202')
          .withHeaders({ Authorization: 'Bearer $S{jwt}' })
          .expectStatus(HttpStatus.NO_CONTENT);
      });
    });
    describe('Get bookmarks', () => {
      it('Should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{jwt}' })
          .expectStatus(HttpStatus.OK)
          .inspect()
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by Id', () => {
      it('Should get bookmark by Id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{jwt}' })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}');
      });
    });
    describe('Edit bookmark by Id', () => {
      const dto: EditBookmarkDto = {
        title: 'Test title',
      };
      it('Should edit bookmark by Id', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{jwt}' })
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}')
          .expectBodyContains(dto.title);
      });
    });
    describe('Delete bookmark by Id', () => {
      it('Should delete bookmark by not exist Id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/0022')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{jwt}' })
          .expectStatus(HttpStatus.FORBIDDEN);
      });
      it('Should delete bookmark by Id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{jwt}' })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}');
      });
    });
  });
});
