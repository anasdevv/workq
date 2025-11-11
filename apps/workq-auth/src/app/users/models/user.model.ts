import { Field, ObjectType } from '@nestjs/graphql';
import { AbstractModel } from '@workq/nestjs';

@ObjectType()
export class User extends AbstractModel {
  @Field()
  email!: string;
}
