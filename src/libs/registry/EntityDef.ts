import {PropertyDef} from './PropertyDef';
import {LookupRegistry} from './../LookupRegistry';
import {AbstractDef} from './AbstractDef';
import {XS_P_LABEL, XS_TYPE_ENTITY, XS_TYPE_PROPERTY} from './../Constants';
import {IEntity} from './IEntity';
import * as _ from './../LoDash'
import {NotYetImplementedError} from "@typexs/base/libs/exceptions/NotYetImplementedError";
import {IBuildOptions, TransformExecutor} from "./../TransformExecutor";
import {ClassRef} from "./ClassRef";
import {getFromContainer} from "class-validator/container";
import {MetadataStorage} from "class-validator/metadata/MetadataStorage";
import {ValidationMetadataArgs} from "class-validator/metadata/ValidationMetadataArgs";
import {OptionsHelper} from "./OptionsHelper";

const DEFAULT_OPTIONS: IEntity = {
  storeable: true
}

const REGEX_ID = /(([\w_]+)=((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\'),?)/;
const REGEX_ID_G = /(([\w_]+)=((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\'),?)/g;

const REGEX_ID_K = /((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\',?)/;
const REGEX_ID_KG = /((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\',?)/g;

export class EntityDef extends AbstractDef {


  constructor(fn: ClassRef | Function, options: IEntity = {}) {
    super('entity', fn instanceof ClassRef ? fn.className : fn.name, fn);
    OptionsHelper.merge(this.object, options);
    this.object.isEntity = true;
    options = _.defaults(options, DEFAULT_OPTIONS);
    this.setOptions(options);
  }


  // not implemented yet
  areRevisionsEnabled() {
    return false;
  }

  isStoreable() {
    return this.getOptions('storeable');
  }

  getPropertyDefs(): PropertyDef[] {
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (e: PropertyDef) => e.object.getClass() === this.getClass());
  }

  /**
   * get properties which contain identifier
   *
   * @returns {any[]}
   */
  getPropertyDefIdentifier(): PropertyDef[] {
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (e: PropertyDef) => e.object.getClass() === this.getClass() && e.identifier);
    //return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (e: PropertyDef) => e.entityName == this.name && e.identifier);
  }

  id() {
    let ids = this.object.schemas.map(s => [s, this.object.className].join('--').toLowerCase());
    if (ids.length === 1) {
      return ids.shift();
    }
    return ids;
  }

  resolveId(instance: any) {
    let id: any = {};
    let propIds = this.getPropertyDefIdentifier();
    for (let prop of propIds) {
      id[prop.name] = prop.get(instance);
    }
    return id;
  }

  resolveIds(instance: any | any[]) {
    if (_.isArray(instance)) {
      return instance.map(i => this.resolveId(i));
    }
    return this.resolveId(instance);
  }

  new<T>(): T {
    let instance = <T>this.object.new();
    let id = this.id();
    // TODO make constant of xs:entity_id
    Reflect.defineProperty(<any>instance, 'xs:entity_id', {
      value: id,
      writable: false,
      enumerable: false,
      configurable: false
    });
    return instance;
    /*
    let klass = this.object.getClass();
    let instance = Reflect.construct(klass, []);
    let id = this.id();
    // TODO make constant of xs:entity_id
    Reflect.defineProperty(instance, 'xs:schema', {value: this.object.getSchema()});
    Reflect.defineProperty(instance, 'xs:name', {value: this.name});
    Reflect.defineProperty(instance, 'xs:id', {
      value: id,
      writable: false,
      enumerable: false,
      configurable: false
    });
    return instance;
    */
  }

  buildLookupConditions(data: any | any[]) {
    let idProps = this.getPropertyDefIdentifier();
    if (_.isArray(data)) {
      let collect: string[] = [];
      data.forEach(d => {
        collect.push(this._buildLookupconditions(idProps, d));
      })
      if (idProps.length > 1) {
        return `(${collect.join('),(')})`;
      } else {
        return `${collect.join(',')}`;
      }

    } else {
      return this._buildLookupconditions(idProps, data);
    }
  }

  private _buildLookupconditions(idProps: PropertyDef[], data: any) {
    let idPk: string[] = [];
    idProps.forEach(id => {
      let v = id.get(data);
      if (_.isString(v)) {
        idPk.push("'" + v + "'");
      } else {
        idPk.push(v);
      }
    })
    return idPk.join(',')

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

  getClass() {
    return this.getClassRef().getClass();
  }

  getClassRef() {
    return this.object;
  }

  build(data: any, options: IBuildOptions = {}) {
    let t = new TransformExecutor();
    return t.transform(this, data, options);
  }


  label(entity: any, sep: string = ' ', max: number = 1024): string {
    if (Reflect.has(entity, 'label')) {
      if (_.isFunction(entity['label'])) {
        return entity.label();
      } else {
        return entity.label;
      }
    } else if (Reflect.has(entity, XS_P_LABEL)) {
      return entity.$label;
    } else {
      // create label from data
      let label: string[] = [];
      this.getPropertyDefs().forEach(p => {
        if (!p.isReference()) {
          label.push(p.get(entity));
        }
      });

      let str = label.join(sep);
      if (str.length > max) {
        return str.substring(0, max);
      }
      return str;
    }
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

      let className = ClassRef.getClassName(instance);
      let xsdef: EntityDef = LookupRegistry.$().find(XS_TYPE_ENTITY, (x: EntityDef) => {
        return x.name == className;
      });

      if (xsdef) {
        return xsdef.name;
      } else {
        throw new Error('resolveName not found for instance: ' + JSON.stringify(instance));
      }
    }
  }

  static resolve(instance: any) {
    let id = this.resolveId(instance);
    if (id) {
      return LookupRegistry.$().find(XS_TYPE_ENTITY, (e: EntityDef) => e.id() === id);
    }
    return null;
  }


  getKeyMap() {
    let map = {};
    this.getPropertyDefs().map(p => {
      !p.isReference() ? map[p.name] = p.storingName : null;
    });
    return map;
  }


  toJson(withProperties: boolean = true) {
    let o = super.toJson();
    o.schema = this.object.getSchema();
    if (withProperties) {
      o.properties = this.getPropertyDefs().map(p => p.toJson());
    }

    let storage = getFromContainer(MetadataStorage);
    let metadata = storage.getTargetValidationMetadatas(this.object.getClass(), null);

    metadata.forEach(m => {
      let prop = _.find(o.properties, p => p.name === m.propertyName);
      if (prop) {
        if (!prop.validator) {
          prop.validator = [];
        }

        let args: ValidationMetadataArgs = {
          type: m.type,
          target: this.object.className,
          propertyName: m.propertyName,
          constraints: m.constraints,
          constraintCls: m.constraintCls,
          validationTypeOptions: m.validationTypeOptions,
          validationOptions: {
            // TODO since 0.9.1 context: m.context,
            message: m.message,
            groups: m.groups,
            always: m.always,
            each: m.each,
          }
        };


        prop.validator.push(args);
      }
    });

    return o;
  }

}
