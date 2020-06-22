import {Property} from '../../../../src/libs/decorators/Property';

export class PointFeature {

  @Property({type: 'number'})
  longitude: number;

  @Property({type: 'number'})
  latitude: number;

}
