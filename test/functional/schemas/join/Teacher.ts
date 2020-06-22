import {Schema} from '../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'join'})
@Entity({name: 'personal'})
export class Teacher {

  @Property({type: 'number', auto: true})
  pid: number;

  @Property()
  name: string;

}
