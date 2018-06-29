import {Entity} from '../../../../../src/libs/xsschema/decorators/Entity';
import {Property} from '../../../../../src/libs/xsschema/decorators/Property';

import {Schema} from '../../../../../src/libs/xsschema/decorators/Schema';
import {Driver} from './Driver';


@Schema({name: 'direct_property'})
@Entity()
export class Car {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  producer: string;

  @Property({targetClass: Driver, nullable: true})
  driver: Driver;

  @Property({targetClass: Driver, nullable: true, cardinality: 0})
  drivers: Driver[];

}

