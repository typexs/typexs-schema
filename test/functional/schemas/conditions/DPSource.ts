import {Entity, Property, Schema} from "../../../../src";
import {DPContent01} from "./DPContent01";

@Schema({name: 'conditions'})
@Entity()
export class DPSource {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: DPContent01, nullable: true, cardinality: 0})
  content01: DPContent01[];

}

