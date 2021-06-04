import {JoinDesc} from '../descriptors/JoinDesc';
import {OrderDesc} from '../descriptors/OrderDesc';
import {IPropertyOptions, JS_DATA_TYPES} from '@allgemein/schema-api';
import {ExprDesc, KeyDesc} from '@allgemein/expressions';
import {K_NULLABLE, K_STORABLE} from '../Constants';

export interface IProperty extends IPropertyOptions {

  /**
   * Is the property storable
   */
  [K_STORABLE]?: boolean;

  /**
   * rename the property for storing name
   */
  name?: string;


  sourceClass?: string | Function;

  /**
   * data type
   */
  type?: string | JS_DATA_TYPES | 'date:created' | 'date:updated' | Function;


  // // @deprected
  // targetClass?: string | Function;

  /**
   * size of data type
   */
  length?: number;


  propertyClass?: string | Function;

  [K_NULLABLE]?: boolean;

  /**
   * Marks if property is an identifier for the entity.
   */
  // use identifier
  id?: boolean;
  pk?: boolean;

  /**
   * If a property is embed then the reference to the extern object/entity is kept locally, default is false.
   */
  embed?: boolean;

  /**
   * On this property no save or delete operation is generated
   */
  readonly?: boolean;

  /**
   * if the reference holding key differs the standard generated {property.name}_{pk1} ...
   */
  idKey?: KeyDesc | KeyDesc[];

  /**
   * Only if id or pk is set then the type determine the id should be automatic (autoinc or uuid generation)
   * else an id must be providen, default will be true
   */
  auto?: boolean;

  /**
   * Join table definition
   */
  join?: JoinDesc;

  /**
   * Condition definition
   */
  cond?: ExprDesc;


  /**
   * Order  definition
   */
  order?: OrderDesc | OrderDesc[];


  /**
   * Extra keys
   */
  typeorm?: any;

  /**
   * Extra keys
   */
  sequence?: boolean;

  /**
   * Enum for retrieving values for form selection
   */
  enum?: any;


  /**
   * Version property
   */
  version?: boolean;
}
