import {AbstractDef} from './AbstractDef';
import {IProperty} from './IProperty';
import {ClassRef} from './ClassRef';
import {LookupRegistry} from './LookupRegistry';
import {XS_TYPE_PROPERTY} from './Constants';
import {NotYetImplementedError} from 'typexs-base/libs/exceptions/NotYetImplementedError';
import {NotSupportedError} from "typexs-base/libs/exceptions/NotSupportedError";
import * as _ from './LoDash';
import {EntityDef} from "./EntityDef";


export class PropertyDef extends AbstractDef {

  readonly cardinality: number = 1;

  readonly entityName: string;

  readonly dataType: string;

  readonly targetRef: ClassRef = null;

  readonly propertyRef: ClassRef = null;

  joinRef: ClassRef = null;

  readonly identifier: boolean;

  readonly generated: boolean;

  get schemaName() {
    return this.object.schema;
  }

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
//        reflectMetadataType = Reflect && Reflect.getOwnPropertyDescriptor ? Reflect.getOwnPropertyDescriptor(fn, propertyName) : undefined;
//         let value = fn.constructor[propertyName]
//         if(value != undefined){
//           if(_.isString(value)){
//
//           }
//         }

          //
          // }
        }
      }
    } else {
      this.dataType = options.type;
    }

    if (_.isNumber(options.cardinality)) {
      this.cardinality = options.cardinality;
    }

    if (_.isFunction(options.targetClass)) {
      this.targetRef = ClassRef.get(options.targetClass);
    }

    if (_.isFunction(options.propertyClass)) {
      this.propertyRef = ClassRef.get(options.propertyClass);
    }

    if (_.isBoolean(options.embedded) && options.embedded) {
      throw new NotYetImplementedError();
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


  isReference(): boolean {
    return this.targetRef != null;
  }


  isInternal(): boolean {
    return this.propertyRef == null;
  }


  isEntityReference(): boolean {
    if (this.isReference()) {
      let entityDef = this.targetRef.getEntity();
      return !(_.isNull(entityDef) || _.isUndefined(entityDef));
    }
    return false;
  }


  getEntity(): EntityDef {
    if (this.isEntityReference()) {
      return this.targetRef.getEntity();
    }
    throw new NotSupportedError('no entity')
  }

  getSubPropertyDef(): PropertyDef[] {
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
    if (this.dataType == 'string') {
      if (_.isString(data)) {
        return data;
      } else {
        throw new NotYetImplementedError('value ' + data);
      }
    } else if (this.dataType == 'number') {
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
      } else {
        throw new NotYetImplementedError('value ' + data);
      }

    } else {
      throw new NotYetImplementedError('value ' + data);
    }
  }


  get storingName() {
    let name = this.getOptions('name');
    if (!name) {
      if (this.isReference()) {
        if (this.isEntityReference()) {
          name = ['p', _.snakeCase(this.name), this.targetRef.getEntity().storingName].join('_');
        } else {
          name = ['p', _.snakeCase(this.name), this.targetRef.machineName()].join('_');
        }
      } else if (this.propertyRef) {
        name = ['p', _.snakeCase(this.name)].join('_');
      } else {
        name = [_.snakeCase(this.name)].join('_');
      }
    }
    return name;
  }


  isNullable() {
    return this.getOptions('nullable', false);
  }


  /**
   * retrieve propetry from an instance
   * @param instance
   */
  get(instance: any) {
    if (instance) {
      return _.get(instance, this.name);
    } else {
      return null;
    }
  }


  get label() {
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


  toJson(withSubProperties: boolean = true) {
    let o = super.toJson();
    o.schemaName = this.schemaName;
    o.entityName = this.entityName;
    o.label = this.label;
    o.dataType = this.dataType;
    o.generated = this.generated;
    o.identifier = this.identifier;

    if (withSubProperties && this.isReference()) {
      o.embedded = this.getSubPropertyDef().map(x => x.toJson());
    }

    return o;
  }

}
