import {Driver} from './Driver';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'direct_property'})
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

