import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from './../prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  getBookmarks(userId: number) {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
      },
    });
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: {
        userId,
        id: bookmarkId,
      },
    });
    if (!bookmark) {
      throw new HttpException(
        {
          status: HttpStatus.NO_CONTENT,
          error: 'Source is not exist',
        },
        HttpStatus.NO_CONTENT,
      );
    }
    return bookmark;
  }

  createBookmark(userId: number, dto: CreateBookmarkDto) {
    return this.prisma.bookmark.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  updateBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
    return this.prisma.bookmark.update({
      where: {
        userId,
        id: bookmarkId,
      },
      data: dto,
    });
  }

  async deleteBookmarkById(bookmarkId: number) {
    try {
      const bookmark = await this.prisma.bookmark.delete({
        where: {
          id: bookmarkId,
        },
      });
      return bookmark;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ForbiddenException('This bookmarkId is not exist');
        }
      }
      return error;
    }
  }
}
