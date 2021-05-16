import {PathFeature} from './PathFeature';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';


@Entity()
export class PathFeatureCollection {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: PathFeature, nullable: true, cardinality: 0})
  features: PathFeature[];
}
