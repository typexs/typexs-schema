
import {Content} from './Content';
import {From, Join, To} from '../../../../src/libs/descriptors/JoinDesc';
import {ContentRef} from './ContentRef';
import {Entity, Property, Schema} from '../../../../src';
import {Eq, Key, Value} from 'commons-expressions';


@Schema({name: 'join'})
@Entity()
export class ContentHolder {

  @Property({type: 'number', auto: true})
  id: number;


  @Property({type: 'string'})
  value: number;

  @Property({
    type: Content, cardinality: 0,
    join: Join(ContentRef,
      [From(Eq('tableId', Key('id'))), To(Eq('blobid', Key('blobid')))],
      Eq('tableName', Value('content_holder')))
  })
  contents: Content[];

}
