import {Entity, Property, Schema} from "../../../../src";
import {MinLength,IsEmail} from 'class-validator';

@Schema({name: 'validation'})
@Entity()
export class ValidPerson {


  @Property({type: 'number', auto: true})
  id: number;

  @MinLength(4)
  @Property({type: 'string'})
  firstName: string;

  @MinLength(4)
  @Property({type: 'string'})
  lastName: string;

  @IsEmail()
  @Property({type: 'string'})
  eMail: string;

}
