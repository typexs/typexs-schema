import {PropertyRef} from './PropertyRef';
import {IEntity} from './IEntity';
import * as _ from 'lodash';
import {XS_P_$LABEL} from '@typexs/server/libs/Constants';

import {
  AbstractRef,
  ClassRef,
  IBuildOptions,
  IEntityRef,
  IValidationMetadataArgs,
  SchemaUtils,
  XS_TYPE_ENTITY,
  XS_TYPE_PROPERTY
} from 'commons-schema-api/browser';
import {ClassUtils} from '@allgemein/base';
import {REGISTRY_TXS_SCHEMA} from '../Constants';
import {Expressions} from 'commons-expressions/browser';
import {lookupRegistry} from '../Helper';
import {getMetadataStorage} from 'class-validator';
import {__CLASS__} from '@typexs/base';

const DEFAULT_OPTIONS: IEntity = {
  storeable: true
};

const REGEX_ID = /(([\w_]+)=((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\'),?)/;
const REGEX_ID_G = /(([\w_]+)=((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\'),?)/g;

const REGEX_ID_K = /((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\',?)/;
const REGEX_ID_KG = /((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\',?)/g;

export class EntityRef extends AbstractRef implements IEntityRef {


  constructor(fn: ClassRef | Function, options: IEntity = {}) {
    super('entity', fn instanceof ClassRef ? fn.className : fn.name, fn, REGISTRY_TXS_SCHEMA);
    // OptionsHelper.merge(this.object, options);
    this.object.isEntity = true;
    options = _.defaults(options, DEFAULT_OPTIONS);
    this.setOptions(options);
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

      const className = ClassUtils.getClassName(instance);
      const xsdef: EntityRef = lookupRegistry().find(XS_TYPE_ENTITY, (x: EntityRef) => {
        return x.name === className;
      });

      if (xsdef) {
        return xsdef.name;
      } else {
        throw new Error('resolveName not found for instance: ' + JSON.stringify(instance));
      }
    }
  }

  static resolve(instance: any) {
    const id = this.resolveId(instance);
    if (id) {
      return lookupRegistry().find(XS_TYPE_ENTITY, (e: EntityRef) => e.id() === id);
    }
    return null;
  }


  // not implemented yet
  areRevisionsEnabled() {
    return false;
  }

  isStoreable() {
    return this.getOptions('storeable');
  }


  getPropertyRefs(): PropertyRef[] {
    return this.getLookupRegistry().filter(XS_TYPE_PROPERTY, (e: PropertyRef) => e.getSourceRef().getClass() === this.getClass());
  }

  getPropertyRef(name: string): PropertyRef {
    return this.getPropertyRefs().find(p => p.name === name);
  }

  /**
   * get properties which contain identifier
   *
   * @returns {any[]}
   */
  getPropertyRefIdentifier(): PropertyRef[] {
    return this.getLookupRegistry().filter(XS_TYPE_PROPERTY, (e: PropertyRef) =>
      e.getSourceRef().getClass() === this.getClass() && e.isIdentifier());
    // return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (e: PropertyDef) => e.entityName === this.name && e.identifier);
  }

  id() {
    return this.getSourceRef().id().toLowerCase();
  }

  isOf(instance: any): boolean {
    const name = ClassUtils.getClassName(instance);
    if (name && name === this.name) {
      return true;
    } else if (instance[__CLASS__] && instance[__CLASS__] === this.name) {
      return true;
    }
    return false;
  }

  resolveId(instance: any) {
    const id: any = {};
    const propIds = this.getPropertyRefIdentifier();
    for (const prop of propIds) {
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

  create<T>(): T {
    return this.new();
  }

  new<T>(): T {
    const instance = <T>this.object.new();
    const id = this.id();
    // TODO make constant of xs:entity_id
    Reflect.defineProperty(<any>instance, 'xs:entity_id', {
      value: id,
      writable: false,
      enumerable: false,
      configurable: false
    });
    return instance;

  }

  buildLookupConditions(data: any | any[]) {
    return Expressions.buildLookupConditions(this, data);
  }


  createLookupConditions(id: string): any | any[] {
    return Expressions.parseLookupConditions(this, id);
  }

  getClass() {
    return this.getClassRef().getClass();
  }

  getClassRef() {
    return this.object;
  }

  build<T>(data: any, options: IBuildOptions = {}): T {
    return <T>SchemaUtils.transform(this, data, options);
  }


  label(entity: any, sep: string = ' ', max: number = 1024): string {
    if (Reflect.has(entity, 'label')) {
      if (_.isFunction(entity['label'])) {
        return entity.label();
      } else {
        return entity.label;
      }
    } else if (Reflect.has(entity, XS_P_$LABEL)) {
      return entity[XS_P_$LABEL];
    } else {
      // create label from data
      const label: string[] = [];
      this.getPropertyRefs().forEach(p => {
        if (!p.isReference()) {
          label.push(p.get(entity));
        }
      });

      const str = label.join(sep);
      if (str.length > max) {
        return str.substring(0, max);
      }
      return str;
    }
  }


  getKeyMap() {
    const map = {};
    this.getPropertyRefs().map(p => {
      !p.isReference() ? map[p.name] = p.storingName : null;
    });
    return map;
  }


  toJson(withProperties: boolean = true) {
    const o = super.toJson();
    o.schema = this.object.getSchema();
    if (withProperties) {
      o.properties = this.getPropertyRefs().map(p => p.toJson());
    }

    const storage = getMetadataStorage();
    const metadata = storage.getTargetValidationMetadatas(this.object.getClass(), null, true, false);

    metadata.forEach(m => {
      const prop = _.find(o.properties, p => p.name === m.propertyName);
      if (prop) {
        if (!prop.validator) {
          prop.validator = [];
        }

        const args: IValidationMetadataArgs = {
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
