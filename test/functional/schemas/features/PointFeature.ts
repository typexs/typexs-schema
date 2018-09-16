import {Property} from "../../../../src";

export class PointFeature {

  @Property({type: 'number'})
  longitude: number;

  @Property({type: 'number'})
  latitude: number;

}
