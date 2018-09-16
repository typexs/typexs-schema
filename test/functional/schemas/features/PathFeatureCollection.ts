import {PathFeature} from "./PathFeature";
import {Entity, Property} from "../../../../src";
import {Driver} from "../direct_property/Driver";


@Entity()
export class PathFeatureCollection {

  @Property({type: 'number', auto: true})
  id: number;

  //@Property()
  //user:

  @Property({targetClass: PathFeature, nullable: true, cardinality: 0})
  features: PathFeature[];
}
