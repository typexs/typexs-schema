import {Property} from '../../../../src/libs/decorators/Property';

export class Literatur {

  @Property({type: 'string', id: true})
  titelid: string;


  @Property({type: 'string'})
  titel: string;

}
