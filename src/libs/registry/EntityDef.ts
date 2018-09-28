import {PropertyDef} from './PropertyDef';
import {LookupRegistry} from './../LookupRegistry';
import {AbstractDef} from './AbstractDef';
import {XS_TYPE_ENTITY, XS_TYPE_PROPERTY} from './../Constants';
import {IEntity} from './IEntity';
import * as _ from './../LoDash'
import {NotYetImplementedError} from "typexs-base/libs/exceptions/NotYetImplementedError";
import {TransformExecutor} from "./../TransformExecutor";

const DEFAULT_OPTIONS: IEntity = {
  storeable: true
}

const REGEX_ID = /(([\w_]+)=((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\'),?)/;
const REGEX_ID_G = /(([\w_]+)=((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\'),?)/g;

const REGEX_ID_K = /((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\',?)/;
const REGEX_ID_KG = /((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\',?)/g;

export class EntityDef extends AbstractDef {


  constructor(fn: Function, options: IEntity = {}) {
    super('entity', fn.name, fn);
    this.object.isEntity = true;
    options = _.defaults(options, DEFAULT_OPTIONS);
    this.setOptions(options);
  }

/*
  get schemaName(){
    return this.object.schema;
  }
*/

  // not implemented yet
  areRevisionsEnabled() {
    return false;
  }

  isStoreable() {
    return this.getOptions('storeable');
  }

  getPropertyDefs(): PropertyDef[] {
    // return LookupRegistry.$().filter(XS_TYPE_PROPERTY, {entityName: this.name, schemaName: this.schemaName});
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (e:PropertyDef) => e.object.getClass() === this.getClass());
  }
/*
  getPropertyDefWithTarget(): PropertyDef[] {
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (e: PropertyDef) => e.entityName == this.name && e.isReference());
  }

  getPropertyDefNotInternal(): PropertyDef[] {
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (e: PropertyDef) => e.entityName == this.name && !e.isInternal());
  }
*/
  /**
   * get properties which contain identifier
   *
   * @returns {any[]}
   */
  getPropertyDefIdentifier(): PropertyDef[] {
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (e:PropertyDef) => e.object.getClass() === this.getClass() && e.identifier);
    //return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (e: PropertyDef) => e.entityName == this.name && e.identifier);
  }

  id(){
    let ids = this.object.schemas.map(s => [s,this.object.className].join('--').toLowerCase());
    if(ids.length === 1){
      return ids.shift();
    }
    return ids;
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
    Reflect.defineProperty(instance, 'xs:entity_id', {
      value: id,
      writable: false,
      enumerable: false,
      configurable: false
    });
    return instance;
  }

  createLookupConditions(id: string): any | any[] {
    let idProps = this.getPropertyDefIdentifier();
    if (/^\(.*(\)\s*,\s*\()?.*\)$/.test(id)) {
      let ids = id.replace(/^\(|\)$/g, '').split(/\)\s*,\s*\(/);
      return _.map(ids, _id => this.createLookupConditions(_id));
    } else if (REGEX_ID.test(id)) {
      let cond = {};
      let e;
      let keys = {};
      while ((e = REGEX_ID_G.exec(id)) !== null) {
        keys[e[2]] = e[4] || e[5] || e[7];
      }

      for (let idp of idProps) {
        if (keys[idp.name]) {
          cond[idp.machineName] = idp.convert(keys[idp.name]);
        }
      }
      return cond;
    } else if (/^\d+(,\d+)+$/.test(id)) {
      let ids = id.split(",");
      return _.map(ids, _id => this.createLookupConditions(_id));
    } else if (REGEX_ID_K.test(id)) {
      if (/^\'.*\'$/.test(id)) {
        id = id.replace(/^\'|\'$/g, '');
      }
      let cond = {}
      let e;
      let c = 0;
      while ((e = REGEX_ID_KG.exec(id)) !== null) {
        let p = idProps[c];
        let v = e[2] || e[3] || e[5];
        c += 1;
        cond[p.machineName] = p.convert(v);
      }
      return cond;

    } else {
      let cond = {};
      if (idProps.length == 1) {
        const prop = _.first(idProps);
        cond[prop.machineName] = prop.convert(id);
        return cond;
      } else {

      }
    }
    throw new NotYetImplementedError('for ' + id)

  }

  getClass(){
    return this.getClassRef().getClass();
  }

  getClassRef(){
    return this.object;
  }

  build(data: any) {
    let t = new TransformExecutor();
    return t.transform(this, data);
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
      let xsdef: EntityDef = LookupRegistry.$().find(XS_TYPE_ENTITY, (x: EntityDef) => {
        //console.log(x.name,instance.__proto__.constructor.name,x.name == instance.__proto__.constructor.name)
        return x.name == instance.__proto__.constructor.name;
      });
      return xsdef ? xsdef.name : null;
    }
  }

  static resolve(instance: any) {
    let id = this.resolveId(instance);
    if (id) {
      return LookupRegistry.$().find(XS_TYPE_ENTITY, (e: EntityDef) => e.id() === id);
    }
    return null;
  }


  toJson(withProperties: boolean = true) {
    let o = super.toJson();
    o.schema = this.object.getSchema();
    if (withProperties) {
      o.properties = this.getPropertyDefs().map(p => p.toJson());
    }
    return o;
  }

}
