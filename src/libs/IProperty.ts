import {JoinDesc} from "./descriptors/Join";
import {CondDesc, Key, KeyDesc, OrderDesc} from "./descriptors/Conditions";

export interface IProperty {

  propertyName?: string;


  /**
   * rename the property for storing name
   */
  name?: string


  sourceClass?: string | Function;

  /**
   * data type
   */
  type?: string | Function;
  // @deprected
  targetClass?: string | Function

  /**
   * size of data type
   */
  length?: number

  form?: string

  cardinality?: number;


  propertyClass?: string | Function;

  nullable?: boolean;

  /**
   * Marks if property is an identifier for the entity.
   */
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
   * Only if id or pk is set then the type determine the id should be automatic (autoinc or uuid generation) else an id must be providen, default will be true
   */
  auto?: boolean;

  /**
   * Join table definition
   */
  join?: JoinDesc;

  /**
   * Condition definition
   */
  cond?: CondDesc;


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

}
