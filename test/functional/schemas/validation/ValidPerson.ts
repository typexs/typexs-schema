import {Schema} from '../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';
import {IsEmail, MinLength} from '@allgemein/schema-api';

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
