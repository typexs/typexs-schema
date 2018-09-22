import {Entity, Property, Schema} from "../../../../src";
import {Job} from "./Job";

@Schema({name: 'complex_entity'})
@Entity()
export class Person {


  @Property({type: 'number', auto: true})
  ident: number;

  @Property({type: 'string'})
  name: string;

  @Property({targetClass: Job, cardinality: 0})
  jobs: Job[]

}
