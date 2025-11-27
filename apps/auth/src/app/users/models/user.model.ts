import { Field, ObjectType } from '@nestjs/graphql';
import { AbstractModel } from 'libs/graphql/src';

@ObjectType()
export class User extends AbstractModel {
  @Field()
  email!: string;
}
