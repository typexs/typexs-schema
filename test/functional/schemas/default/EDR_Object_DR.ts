import {CObject, Property} from "../../../../src";
import {EDR_Object} from "./EDR_Object";

@CObject({name: 'object_level_two'})
export class EDR_Object_DR {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: EDR_Object, embed: true})
  object: EDR_Object;

}
