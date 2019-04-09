import {IProperty} from './IProperty';
import * as _ from 'lodash';
import {EntityRef} from "./EntityRef";
import * as moment from "moment";

import {
  AbstractRef,
  ClassRef,
  IPropertyRef,
  JS_DATA_TYPES,
  LookupRegistry,
  XS_TYPE_PROPERTY
} from "commons-schema-api/browser";
import {NotSupportedError, NotYetImplementedError} from "@typexs/base/browser";
import {ExprDesc} from "commons-expressions/browser";
import {OrderDesc} from "../../libs/descriptors/OrderDesc";
import {ClassUtils} from 'commons-base/browser';

export const KNOW_PRIMATIVE_TYPES: JS_DATA_TYPES[] = [
  'string', 'text', 'number', 'boolean', 'double',
  'json', 'date', 'time', 'datetime', 'timestamp', 'byte'
];

export class PropertyRef extends AbstractRef implements IPropertyRef {

  readonly cardinality: number = 1;

  readonly entityName: string;

  readonly dataType: string;

  readonly targetRef: ClassRef = null;

  readonly propertyRef: ClassRef = null;

  joinRef: ClassRef = null;

  readonly identifier: boolean;

  readonly generated: boolean;

  readonly embed: boolean;


  constructor(options: IProperty) {
    super('property', options.propertyName, options.sourceClass);
    this.setOptions(options);
    this.entityName = this.object.className;

    if (!options.type) {
      // TODO find a better way to detect the type
      if (_.isFunction(options.sourceClass)) {
        let reflectMetadataType = Reflect && Reflect.getMetadata ? Reflect.getMetadata('design:dataType', options.sourceClass, this.name) : undefined;
        if (reflectMetadataType) {
          this.dataType = reflectMetadataType;
        } else {
          // default
          this.dataType = 'string';
        }
      }
    } else if (_.isString(options.type)) {
      let found_primative = _.find(KNOW_PRIMATIVE_TYPES, t => (new RegExp("^" + t + ":?")).test((<string>options.type).toLowerCase()));
      if (found_primative) {
        this.dataType = options.type;
      } else {
        this.targetRef = ClassRef.get(options.type);
      }

    }

    if (_.isNumber(options.cardinality)) {
      this.cardinality = options.cardinality;
    }

    if (_.isFunction(options.type) || _.isFunction(options.targetClass)) {
      const targetClass = options.type || options.targetClass;
      this.targetRef = ClassRef.get(targetClass);
    }

    if (!this.targetRef && !this.dataType) {
      throw new NotSupportedError('No primative or complex data type given: ' + JSON.stringify(options))
    }

    if (_.isFunction(options.propertyClass)) {
      this.propertyRef = ClassRef.get(options.propertyClass);
    }

    if ((_.isBoolean(options.embed) && options.embed) || this.getOptions('idKey')) {
      this.embed = true;
      if (this.isCollection()) {
        throw new NotSupportedError('embedded property can not be a selection')
      }
    } else {
      this.embed = false;
    }

    if ((_.isBoolean(options.id) && options.id) || (_.isBoolean(options.pk) && options.pk) || (_.isBoolean(options.auto) && options.auto)) {
      this.identifier = true;
      if ((_.isBoolean(options.auto))) {
        this.generated = options.auto;
      } else {
        this.generated = false;
      }
    } else {
      this.identifier = false;
      this.generated = false;
    }
  }

  id() {
    return [this.getSourceRef().id(), this.name].join('--').toLowerCase();
  }

  /*
    get schemaName() {
      return this.object.schema;
    }
  */
  isReference(): boolean {
    return this.targetRef != null;
  }

  isSequence(): boolean {
    return this.getOptions('sequence', false);
  }

  isInternal(): boolean {
    return this.propertyRef == null;
  }

  isEntityReference(): boolean {
    if (this.isReference()) {
      let entityDef = this.targetRef.getEntityRef();
      return !(_.isNull(entityDef) || _.isUndefined(entityDef));
    }
    return false;
  }

  isEmbedded() {
    return this.embed;
  }

  hasIdKeys() {
    return this.embed && this.getOptions('idKey', false) !== false
  }

  hasConditions() {
    return this.getOptions('cond', false) !== false;
  }

  getCondition(): ExprDesc {
    return this.getOptions('cond', null);
  }

  hasJoin() {
    return this.getOptions('join', false) !== false;
  }

  getJoin() {
    return this.getOptions('join', null);
  }

  hasOrder() {
    return this.getOptions('order', false) !== false;
  }

  getOrder(): OrderDesc[] {
    let arr = this.getOptions('order', null);
    if (!_.isArray(arr)) {
      arr = [arr]
    }
    return arr;
  }

  hasJoinRef() {
    return this.joinRef != null;
  }

  getIdKeys(): string[] {
    let keys = this.getOptions('idKey');
    if (!_.isArray(keys)) {
      return [keys.key];
    } else {
      return keys.map(k => k.key);
    }
  }

  getEntity(): EntityRef {
    if (this.isEntityReference()) {
      return this.getEntityRef();
    }
    throw new NotSupportedError('no entity')
  }

  getTargetClass() {

    if (this.isReference()) {
      return this.targetRef.getClass();
    }
    throw new NotSupportedError('no  target class')
  }

  getSubPropertyRef(): PropertyRef[] {
    if (!this.propertyRef) {
      return [];
    }
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, {entityName: this.propertyRef.className});
  }


  isOutOfSize(x: number): boolean {
    if (this.cardinality == 0) return false;
    if (this.cardinality < x) {
      return true;
    }
    return false;
  }


  isCollection(): boolean {
    return this.cardinality == 0 || this.cardinality > 1;
  }


  convert(data: any): any {
    let [baseType, variant] = this.dataType.split(':');

    switch (baseType) {
      case 'text':
      case 'time':
      case 'string':
        if (_.isString(data)) {
          return data;
        } else if (data) {
          throw new NotYetImplementedError('value ' + data);
        } else {
          return null;
        }
        break;
      case 'boolean':
        if (_.isBoolean(data)) {
          return data;
        } else if (_.isNumber(data)) {
          return data > 0;
        } else if (_.isString(data)) {
          if (data.toLowerCase() === "true" || data.toLowerCase() === "1") {
            return true;
          }
          return false;
        }
        break;
      case 'number':
      case 'double':
        if (_.isString(data)) {
          if (/^\d+\.|\,\d+$/.test(data)) {
            return parseFloat(data.replace(',', '.'))
          } else if (/^\d+$/.test(data)) {
            return parseInt(data);
          } else {
            throw new NotYetImplementedError('value ' + data);
          }
        } else if (_.isNumber(data)) {
          return data;
        } else if (data) {
          throw new NotYetImplementedError('value ' + data);
        } else {
          return null;
        }
        break;
      case 'date':
      case 'datetime':
      case 'timestamp':
        if (data instanceof Date) {
          return data;
        } else {
          return moment(data).toDate();
        }
        break;
      default:
        throw new NotYetImplementedError('value ' + data);
    }
  }


  get storingName() {
    let name = this.getOptions('name', null);
    if (!name) {
      const prefix = this.object.isEntity ? 'p' : 'i';// + _.snakeCase(this.object.className);

      if (this.isReference() && !this.isEmbedded()) {
        name = [prefix, this.getSourceRef().machineName, this.machineName].join('_');
        /*
        if (this.isEntityReference()) {
          if (this.object.isEntity) {
            name = [prefix, this.object.machineName(), this.machineName].join('_');
          } else {
            name = [prefix, this.object.machineName(), this.targetRef.machineName()].join('_');
          }
        } else {
          if (this.object.isEntity) {
            name = [prefix, this.object.machineName(), _.snakeCase(this.name), this.targetRef.machineName()].join('_');
          } else {
            name = [prefix, this.object.machineName(), this.targetRef.machineName()].join('_');
          }
        }*/
      } else if (this.propertyRef) {
        name = [prefix, _.snakeCase(this.name)].join('_');
      } else {
        name = _.snakeCase(this.name);
      }
    }
    return name;
  }


  isNullable() {
    return this.getOptions('nullable', false);
  }

  isStoreable() {
    return this.getOptions('storeable', true);
  }


  /**
   * retrieve propetry from an instance
   * @param instance
   */
  get(instance: any) {
    if (instance) {
      return _.get(instance, this.name, null);
    } else {
      return null;
    }
  }


  label() {
    let label = null;
    let options = this.getOptions();
    if (options.label) {
      label = options.label;
    }
    if (!label) {
      label = _.capitalize(this.name);
    } else {
      label = 'None';
    }
    return label;
  }

  getType(){
    if(this.dataType){
      return this.dataType;
    }else if(this.targetRef){
      return ClassUtils.getClassName(this.targetRef.getClass());
    }
    return null;

  }

  toJson(withSubProperties: boolean = true) {
    let o = super.toJson();
    o.schema = this.object.getSchema();
    o.entityName = this.entityName;
    o.label = this.label();
    o.dataType = this.dataType;
    o.generated = this.generated;
    o.identifier = this.identifier;
    o.cardinality = this.cardinality;
    delete o.options['sourceClass'];

    if (this.targetRef) {
      o.targetRef = this.targetRef.toJson(!this.isEntityReference());
    }

    if (this.propertyRef) {
      o.propertyRef = this.propertyRef.toJson();
    }

    if (withSubProperties && this.isReference()) {
      o.embedded = this.getSubPropertyRef().map(x => x.toJson());
    }

    return o;
  }

  getEntityRef(): EntityRef {
    return this.isEntityReference() ? <EntityRef><any>this.getTargetRef().getEntityRef() : null;
  }

  getTargetRef(): ClassRef {
    return this.targetRef;
  }

  isIdentifier(): boolean {
    return this.identifier;
  }

}