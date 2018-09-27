import {Property} from "../../../../src";


export class Speed {

  @Property({type: 'number'})
  value: number;

  @Property({type: 'string'})
  unit: string;

}
