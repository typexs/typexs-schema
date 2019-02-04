import {Entity,  Property} from "../../../../src";
import {Periode} from "./Periode";
import {Key} from "commons-expressions";


@Entity()
export class Course {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: Periode, embed: true})
  periode: Periode;


  /**
   * When idKey is set the embed is set automatically to true
   */
  @Property({type: Periode, idKey: Key('periode_otherid')})
  periode_alt: Periode;


}
