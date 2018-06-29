import * as _ from 'lodash';
import {XsDef} from './XsDef';
import {IXsProperty} from './IXsProperty';
import {XsClassRef} from './XsClassRef';
import {XsLookupRegistry} from './XsLookupRegistry';
import {XS_ID_SEPARATOR, XS_TYPE_PROPERTY} from './Constants';
import {NotYetImplementedError} from './NotYetImplementedError';

export class XsPropertyDef extends XsDef {


  schemaName: string = 'default';

  readonly cardinality: number = 1;

  readonly entityName: string;

  readonly dataType: string;

  readonly targetRef: XsClassRef = null;

  readonly propertyRef: XsClassRef = null;

  joinRef: XsClassRef = null;


  readonly identifier: boolean;

  readonly generated: boolean;

  constructor(options: IXsProperty) {
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
      this.targetRef = XsClassRef.get(options.targetClass);
    }

    if (_.isFunction(options.propertyClass)) {
      this.propertyRef = XsClassRef.get(options.propertyClass);
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

    //console.log(this.name, this.dataType);
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


  getSubPropertyDef(): XsPropertyDef[] {
    return XsLookupRegistry.$().filter(XS_TYPE_PROPERTY, {entityName: this.propertyRef.className});
  }


  isOutOfSize(x: number) {
    if (this.cardinality == 0) return false;
    if (this.cardinality < x) {
      return true;
    }
    return false;
  }

  isCollection() {
    return this.cardinality == 0 || this.cardinality > 1;
  }

  storingName() {
    let name = this.getOptions('name');
    if (!name) {
      if (this.isReference()) {
        if (this.isEntityReference()) {
          name = ['p', _.snakeCase(this.name), this.targetRef.getEntity().storingName()].join('_');
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


}
