
import {Driver} from './Driver';
import {Entity, Property,Schema} from "../../../../src";

@Schema({name:'direct_property'})
@Entity()
export class Car {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  producer: string;

  @Property({type: Driver, nullable: true})
  driver: Driver;

  @Property({type: Driver, nullable: true, cardinality: 0})
  drivers: Driver[];

}

