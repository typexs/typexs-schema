export interface IXsProperty {

  propertyName?: string;


  /**
   * rename the property for storing name
   */
  name?: string


  sourceClass?: string | Function;

  /**
   * data type
   */
  type?: string

  /**
   * size of data type
   */
  length?: number

  form?: string

  cardinality?: number;

  targetClass?: string | Function

  propertyClass?: string | Function;

  nullable?: boolean;

  /**
   * Marks if property is an identifier for the entity.
   */
  id?: boolean;
  pk?: boolean;

  /**
   * If a property is embedded then the subProperties must be integrated in the bound entity, default is false.
   * TODO implement this
   */
  embedded?: boolean;

  /**
   * Only if id or pk is set then the type determine the id should be automatic (autoinc or uuid generation) else an id must be providen, default will be true
   */
  auto?: boolean;

  /**
   * The members to lookup on the referencing entities or entity
   */
  refMembers?: string | string[]

  /**
   * The local members to use for mapping the referencing entity
   */
  localMembers?: string | string[]


}
