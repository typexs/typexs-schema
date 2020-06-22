import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';


@Entity()
export class ComplexIdsKeys {

  @Property({type: 'number', id: true})
  inc: number;

  @Property({type: 'string', id: true})
  code: string;

}
