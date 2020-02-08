import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {NoEntity} from './NoEntity';
import {SomeEntity} from './SomeEntity';

@Schema({name: 'reflection'})
@Entity()
export class MultipleTypes {

  @Property()
  number: number;

  @Property()
  string: string;

  @Property()
  date: Date;

  @Property()
  boolean: boolean;

  @Property()
  noEntity: NoEntity;

  @Property(NoEntity)
  noEntitySe: NoEntity;

  @Property(() => NoEntity)
  noEntityTh: NoEntity;

  @Property()
  someEntity: SomeEntity;

  @Property(NoEntity)
  noEntities: NoEntity[];

  @Property(() => SomeEntity)
  someEntities: SomeEntity[];

}
