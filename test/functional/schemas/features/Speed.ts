import {Property} from "../../../../src";


export class Speed {

  @Property({type: 'number'})
  value: number;

  @Property({type: 'speed'})
  unit: string;

}
