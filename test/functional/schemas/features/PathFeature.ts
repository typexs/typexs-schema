import {Speed} from './Speed';
import {PointFeature} from './PointFeature';
import {Property} from '../../../../src/libs/decorators/Property';


export class PathFeature {

  @Property({type: 'number'})
  id: number;

  @Property({type: 'number', nullable: true})
  unixtime: number;

  @Property({type: 'string', nullable: true})
  datetime: string;

  @Property({type: 'number'})
  offset: number;

  @Property({type: Speed, nullable: true})
  speed: Speed;

  @Property({type: 'number', nullable: true})
  altitude: number;

  @Property({type: 'string', nullable: true})
  track: string;

  @Property({type: PointFeature})
  geometry: PointFeature;


}
