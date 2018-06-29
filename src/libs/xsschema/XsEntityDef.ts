import * as _ from 'lodash';
import {XsPropertyDef} from './XsPropertyDef';
import {XsLookupRegistry} from './XsLookupRegistry';
import {XsDef} from './XsDef';
import {XS_TYPE_BINDING_SCHEMA_ENTITY, XS_TYPE_ENTITY, XS_TYPE_PROPERTY} from './Constants';
import {IXsEntity} from './IXsEntity';
import {XsSchemaDef} from './XsSchemaDef';

export class XsEntityDef extends XsDef {


  schemaName: string = 'default';


  constructor(fn: Function, options: IXsEntity = {}) {
    super('entity', fn.name, fn);
    this.setOptions(options);
    let schema = <XsSchemaDef>XsLookupRegistry.$().find(XS_TYPE_BINDING_SCHEMA_ENTITY,{targetName:fn.name});
    if(schema){
      this.schemaName = schema.name;
    }
  }


  // not implemented yet
  areRevisionsEnabled() {
    return false;
  }


  getPropertyDefs(): XsPropertyDef[] {
    return XsLookupRegistry.$().filter(XS_TYPE_PROPERTY, {entityName: this.name});
  }

  getPropertyDefWithTarget(): XsPropertyDef[] {
    return XsLookupRegistry.$().filter(XS_TYPE_PROPERTY, (e: XsPropertyDef) => e.entityName == this.name && e.isReference());
  }

  getPropertyDefNotInternal(): XsPropertyDef[] {
    return XsLookupRegistry.$().filter(XS_TYPE_PROPERTY, (e: XsPropertyDef) => e.entityName == this.name && !e.isInternal());
  }

  /**
   * get properties which contain identifier
   *
   * @returns {any[]}
   */
  getPropertyDefIdentifier(): XsPropertyDef[] {
    return XsLookupRegistry.$().filter(XS_TYPE_PROPERTY, (e: XsPropertyDef) => e.entityName == this.name && e.identifier);
  }

  resolveId(instance: any) {
    let id: any;
    let propIds = this.getPropertyDefIdentifier();
    if (propIds.length == 1) {
      id = propIds.shift().get(instance);
    } else {
      id = {};
      for (let prop of propIds) {
        id[prop.name] = prop.get(instance);
      }
    }
    return id;
  }

  new<T>(): T {
    let klass = this.object.getClass();
    let instance = Reflect.construct(klass, []);
    let id = this.id();
    // TODO make constant of xs:entity_id
    Reflect.defineProperty(instance, 'xs:entity_name', {value: this.name});
    Reflect.defineProperty(instance, 'xs:entity_id', {value: id, writable: false, enumerable: false, configurable: false});
    return instance;
  }


  static resolveId(instance: any) {
    if (_.has(instance, 'xs:entity_id')) {
      return _.get(instance, 'xs:entity_id');
    }
    return null;
  }

  static resolveName(instance: any): string {
    if (_.has(instance, 'xs:entity_name')) {
      return _.get(instance, 'xs:entity_name');
    } else {

      let xsdef: XsEntityDef = XsLookupRegistry.$().find(XS_TYPE_ENTITY, (x: XsEntityDef) => {
        //console.log(x.name,instance.__proto__.constructor.name,x.name == instance.__proto__.constructor.name)
        return x.name == instance.__proto__.constructor.name;
      });
      return xsdef ? xsdef.name : null;
    }
  }

  static resolve(instance: any) {
    let id = this.resolveId(instance);
    if (id) {
      return XsLookupRegistry.$().find(XS_TYPE_ENTITY, (e: XsEntityDef) => e.id() === id);
    }
    return null;
  }

}
