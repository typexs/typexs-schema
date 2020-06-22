import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';


@Entity()
export class Periode {

  @Property({type: 'number', auto: true})
  perid: number;

  @Property({type: 'number'})
  year: number;

}
