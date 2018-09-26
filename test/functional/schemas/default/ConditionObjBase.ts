import {Entity, Property} from "../../../../src";
import {ConditionObjKeeper} from "./ConditionObjKeeper";

@Entity()
export class ConditionObjBase {

  @Property({type: 'number', auto: true})
  id: number;


  @Property({
    type: ConditionObjKeeper,
    cardinality: 0
  })
  objects: ConditionObjKeeper[];



}
