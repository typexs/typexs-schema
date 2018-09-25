import {Property} from "../../../../src";


export class Literatur {

  @Property({type: 'string', id: true})
  titelid: string;


  @Property({type: 'string'})
  titel: string;

}
