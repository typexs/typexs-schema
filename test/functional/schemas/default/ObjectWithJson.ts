import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';


@Entity()
export class ObjectWithJson {

  @Property({type: 'number', auto: true})
  id: number;


  @Property()
  json: any;

}
