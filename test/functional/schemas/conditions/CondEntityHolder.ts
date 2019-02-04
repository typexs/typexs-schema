import {Asc, Desc, Entity, Property, Schema} from "../../../../src";
import {CondObjectContent} from "./CondObjectContent";
import {Eq, Key} from "commons-expressions";

@Schema({name: 'conditions'})
@Entity()
export class CondEntityHolder {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'number'})
  mynr:number;

  @Property({
    type: CondObjectContent, nullable: true, cardinality: 0,
    cond: Eq('somenr',Key('mynr')),
    order: Asc(Key('nickname'))
  })
  contents: CondObjectContent[];

}

