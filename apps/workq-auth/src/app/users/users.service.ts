import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma-clients/workq-auth';
import { PrismaService } from '../prisma/prisma.service';
import { hash } from 'bcryptjs';
@Injectable()
export class UsersService {
  constructor(private readonly prismaSerivce: PrismaService) {}
  async createUser(data: Prisma.UserCreateInput) {
    return this.prismaSerivce.user.create({
      data: {
        ...data,
        password: await hash(data.password, 10),
      },
    });
  }

  async getUsers() {
    return this.prismaSerivce.user.findMany();
  }
}
