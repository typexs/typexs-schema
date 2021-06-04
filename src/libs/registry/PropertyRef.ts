import {IProperty} from './IProperty';
import * as _ from 'lodash';
import {assign} from 'lodash';
import {EntityRef} from './EntityRef';

import {DefaultPropertyRef, IBuildOptions, IClassRef, JS_PRIMATIVE_TYPES, METATYPE_PROPERTY} from '@allgemein/schema-api';
import {NotSupportedError, NotYetImplementedError} from '@typexs/base';
import {ExprDesc} from '@allgemein/expressions';
import {OrderDesc} from '../../libs/descriptors/OrderDesc';
import {K_NULLABLE, K_STORABLE} from '../Constants';
import {DateUtils} from '@typexs/base/libs/utils/DateUtils';
import {isEntityRef} from '@allgemein/schema-api/api/IEntityRef';
import {isClassRef} from '@allgemein/schema-api/api/IClassRef';


export class PropertyRef extends DefaultPropertyRef/*AbstractRef implements IPropertyRef*/ {

  // readonly cardinality: number = 1;

  // readonly dataType: string;

  // readonly targetRef: IClassRef = null;

  // readonly propertyRef: IClassRef = null;

  joinRef: IClassRef = null;

  // readonly identifier: boolean;

  // readonly generated: boolean;

  // readonly embed: boolean;


  get entityName() {
    return this.getClassRef().name;
  }

  constructor(options: IProperty) {
    super(assign(options, {metaType: METATYPE_PROPERTY}));
    let targetRef = null;
    if (!options.type && !options.propertyClass) {
      throw new NotSupportedError(`property ${this.name} has no defined type nor property class`);
    } else if (_.isString(options.type)) {
      const found_primative = _.find(JS_PRIMATIVE_TYPES, t => (new RegExp('^' + t + ':?')).test((<string>options.type).toLowerCase()));
      if (found_primative || options.type.toLowerCase() === options.type) {
        // this.dataType = options.type;
      } else {
        targetRef = this.getTargetRef();
        // this.targetRef = this.getClassRefFor(options.type);
      }
    }

    if (_.isNumber(options.cardinality)) {
      this.cardinality = options.cardinality;
    }

    if (_.isFunction(options.type) || isEntityRef(options.type) || isClassRef(options.type)) {
      // const targetClass = options.type || options.targetClass;
      // this.targetRef = this.getClassRefFor(targetClass);
      targetRef = this.getTargetRef();
      // } else if (_.isFunction(options.propertyClass)) {
      //   this.propertyRef = this.getClassRefFor(options.propertyClass, METATYPE_CLASS_REF);
    }

    if (!targetRef && !this.dataType /*&& !this.propertyRef*/) {
      throw new NotSupportedError('No primative or complex data type given: ' + JSON.stringify(options));
    }

    if ((_.isBoolean(options.embed) && options.embed) || this.getOptions('idKey')) {
      this.setOption('embed', true);
      if (this.isCollection()) {
        throw new NotSupportedError('embedded property can not be a selection');
      }
    }

    if ((_.isBoolean(options.id) && options.id) ||
      (_.isBoolean(options.pk) && options.pk) ||
      (_.isBoolean(options.auto) && options.auto)) {
      this.setOption('identifier', true);
      if ((_.isBoolean(options.auto))) {
        this.setOption('generated', true);
      }
    }
  }

  id() {
    return [this.getClassRef().id(), this.name].join('--').toLowerCase();
  }

  isSequence(): boolean {
    return this.getOptions('sequence', false);
  }

  // isInternal(): boolean {
  //   return this.propertyRef === null;
  // }

  isEntityReference(): boolean {
    if (this.isReference()) {
      const entityDef = this.targetRef.getEntityRef();
      return !(_.isNull(entityDef) || _.isUndefined(entityDef));
    }
    return false;
  }

  isEmbedded() {
    return this.getOptions('embed', false);
  }

  hasIdKeys() {
    return this.isEmbedded() && this.getOptions('idKey', false) !== false;
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
      arr = [arr];
    }
    return arr;
  }

  hasJoinRef() {
    return this.joinRef != null;
  }

  getIdKeys(): string[] {
    const keys = this.getOptions('idKey');
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
    throw new NotSupportedError('no entity');
  }

  getTargetClass() {
    if (this.isReference()) {
      return this.targetRef.getClass();
    }
    throw new NotSupportedError('no  target class');
  }

  //
  // getSubPropertyRef(): PropertyRef[] {
  //   if (!this.propertyRef) {
  //     return [];
  //   }
  //   return this.getRegistry().filter(METATYPE_PROPERTY, {entityName: this.propertyRef.name});
  // }


  isOutOfSize(x: number): boolean {
    if (this.cardinality === 0) {
      return false;
    }
    if (this.cardinality < x) {
      return true;
    }
    return false;
  }


  isCollection(): boolean {
    return this.cardinality === 0 || this.cardinality > 1;
  }

  get dataType() {
    if (!this.isReference()) {
      return this.getType();
    }
    return undefined;
  }

  convert(data: any, options?: IBuildOptions): any {
    const [baseType, variant] = this.dataType.split(':');

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
          if (data.toLowerCase() === 'true' || data.toLowerCase() === '1') {
            return true;
          }
          return false;
        }
        break;
      case 'number':
      case 'double':
        if (_.isString(data)) {
          if (/^\d+\.|\,\d+$/.test(data)) {
            return parseFloat(data.replace(',', '.'));
          } else if (/^\d+$/.test(data)) {
            return parseInt(data, 0);
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
          return DateUtils.fromISO(data);
        }
        break;
      default:
        throw new NotYetImplementedError('value ' + data);
    }
  }

  // @ts-ignore
  get storingName() {
    let name = this.getOptions('name', null);
    if (!name) {
      const prefix = this.getClassRef().hasEntityRef() ? 'p' : 'i'; // + _.snakeCase(this.object.className);

      if (this.isReference() && this.isAppended()) {
        name = [prefix, _.snakeCase(this.name)].join('_');
      } else if (this.isReference() && !this.isEmbedded()) {
        name = [prefix, this.getClassRef().machineName, this.machineName].join('_');
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
        // } else if (this.propertyRef) {
        //   name = [prefix, _.snakeCase(this.name)].join('_');
      } else {
        name = _.snakeCase(this.name);
      }
    }
    return name;
  }


  isNullable() {
    return this.getOptions(K_NULLABLE, false);
  }

  isStorable() {
    return this.getOptions(K_STORABLE, true);
  }


  label() {
    let label = null;
    const options = this.getOptions();
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

  getEntityRef(): EntityRef {
    return this.isEntityReference() ? this.getTargetRef().getEntityRef() as EntityRef : null;
  }

  isIdentifier(): boolean {
    return this.getOptions('identifier', false);
  }

  isGenerated(): boolean {
    return this.getOptions('generated', false);
  }

  /*
    get schemaName() {
      return this.object.schema;
    }
  */
  // isReference(): boolean {
  //   return this.targetRef != null;
  // }

  // getType(): any {
  //   if (this.dataType) {
  //     return super.getType();
  //   } else if (this.targetRef) {
  //     return this.targetRef.getClass().name;
  //   }
  //   return null;
  // }

  // toJson(withSubProperties: boolean = true) {
  //   const o = super.toJson();
  //   o.schema = this.object.getSchema();
  //   o.entityName = this.entityName;
  //   o.label = this.label();
  //   o.dataType = this.dataType;
  //   o.generated = this.generated;
  //   o.identifier = this.identifier;
  //   o.cardinality = this.cardinality;
  //   delete o.options['sourceClass'];
  //
  //   if (this.targetRef) {
  //     o.targetRef = this.targetRef.toJson(!this.isEntityReference());
  //   }
  //
  //   if (this.propertyRef) {
  //     o.propertyRef = this.propertyRef.toJson();
  //   }
  //
  //   if (withSubProperties && this.isReference()) {
  //     o.embedded = this.getSubPropertyRef().map(x => x.toJson());
  //   }
  //
  //   return o;
  // }


  // getTargetRef(): ClassRef {
  //   return this.targetRef;
  // }


  //
  // getRegistry(): ILookupRegistry {
  //   return RegistryFactory.get(this.namespace);
  // }
  //
  // getClassRefFor(object: string | Function | IClassRef): IClassRef {
  //   return this.getRegistry().getClassRefFor(object, METATYPE_PROPERTY);
  // }

}
