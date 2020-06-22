import {Property} from '../../../../src/libs/decorators/Property';


export class Speed {

  @Property({type: 'number'})
  value: number;

  @Property({type: 'string'})
  unit: string;

}
