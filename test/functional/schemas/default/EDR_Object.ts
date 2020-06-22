import {Property} from '../../../../src/libs/decorators/Property';
import {CObject} from '../../../../src/libs/decorators/CObject';


@CObject({name: 'object_level_three'})
export class EDR_Object {

  @Property({type: 'number', auto: true})
  id: number;


}
