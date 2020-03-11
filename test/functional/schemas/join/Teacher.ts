import {Entity, Property, Schema} from '../../../../src';

@Schema({name: 'join'})
@Entity({name: 'personal'})
export class Teacher {

  @Property({type: 'number', auto: true})
  pid: number;

  @Property()
  name: string;

}
