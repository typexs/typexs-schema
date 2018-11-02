import {Entity, Property, Schema} from "../../../../src";
import {Content} from "./Content";
import {From, Join, To} from "../../../../src/libs/descriptors/Join";
import {ContentRef} from "./ContentRef";
import {Eq, Key, Value} from "../../../../src/libs/descriptors/Conditions";

@Schema({name: 'join'})
@Entity()
export class ContentHolder {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({
    type: Content, cardinality: 0,
    join: Join(ContentRef,
      [From(Eq('tableId', Key('id'))), To(Eq('blobid', Key('blobid')))],
      Eq('tableName', Value('content_holder')))
  })
  contents: Content[];

}