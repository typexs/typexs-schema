import {CObject, Property} from "../../../../src";


@CObject({name: 'object_level_three'})
export class EDR_Object {

  @Property({type: 'number', auto: true})
  id: number;


}
