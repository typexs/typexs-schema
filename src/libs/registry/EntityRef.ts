import {PropertyRef} from './PropertyRef';
import {IEntity} from './IEntity';
import * as _ from 'lodash';
import {assign, defaults} from 'lodash';
import {XS_P_$LABEL} from '@typexs/server/libs/Constants';

import {
  DefaultEntityRef,
  IClassRef, IEntityRef,
  IJsonSchemaSerializeOptions,
  ILookupRegistry,
  JsonSchema,
  METADATA_TYPE,
  METATYPE_ENTITY,
  METATYPE_PROPERTY,
  RegistryFactory
} from '@allgemein/schema-api';
import {ClassUtils} from '@allgemein/base';
import {K_STORABLE, NAMESPACE_BUILT_ENTITY} from '../Constants';
import {Expressions} from '@allgemein/expressions';
import {__CLASS__} from '@typexs/base';

const DEFAULT_OPTIONS: IEntity = {
  storable: true
};

const REGEX_ID = /(([\w_]+)=((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\'),?)/;
const REGEX_ID_G = /(([\w_]+)=((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\'),?)/g;

const REGEX_ID_K = /((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\',?)/;
const REGEX_ID_KG = /((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\',?)/g;

export class EntityRef extends DefaultEntityRef/*AbstractRef implements IEntityRef*/ {


  constructor(/*fn: ClassRef | Function,*/ options: IEntity = {}) {
    super(defaults(assign(options, {metaType: METATYPE_ENTITY}), DEFAULT_OPTIONS));
    // super(METATYPE_ENTITY, fn instanceof ClassRef ? fn.className : fn.name, fn, NAMESPACE_BUILT_ENTITY);
    // OptionsHelper.merge(this.object, options);

    // options = _.defaults(options, DEFAULT_OPTIONS);
    // this.setOptions(options);
  }


  static resolve(instance: any, namespace: string = NAMESPACE_BUILT_ENTITY) {
    return RegistryFactory.get(namespace).getEntityRefFor(instance);
  }


  // not implemented yet
  areRevisionsEnabled() {
    return false;
  }

  isStorable() {
    return this.getOptions(K_STORABLE, true);
  }


  getPropertyRefs(): PropertyRef[] {
    return this.getRegistry().getPropertyRefs(this as IEntityRef) as PropertyRef[];
  }

  getPropertyRef(name: string): PropertyRef {
    return this.getPropertyRefs().find(p => p.name === name) as PropertyRef;
  }

  /**
   * get properties which contain identifier
   *
   * @returns {any[]}
   */
  getPropertyRefIdentifier(): PropertyRef[] {
    return this.getRegistry().filter(METATYPE_PROPERTY, (e: PropertyRef) =>
      e.getSourceRef().getClass() === this.getClass() && e.isIdentifier());
    // return LookupRegistry.$().filter(METATYPE_PROPERTY, (e: PropertyDef) => e.entityName === this.name && e.identifier);
  }

  id() {
    return this.getClassRef().id();
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

  // create<T>(): T {
  //   return this.new();
  // }
  //
  // new<T>(addinfo: boolean = true): T {
  //   const instance = <T>this.object.create(addinfo);
  //   // const id = this.id();
  //   // // TODO make constant of xs:entity_id
  //   // if (addinfo) {
  //   //   Reflect.defineProperty(<any>instance, __ID__, {
  //   //     value: id,
  //   //     writable: false,
  //   //     enumerable: true,
  //   //     configurable: false
  //   //   });
  //   // }
  //   return instance;
  //
  // }

  buildLookupConditions(data: any | any[]) {
    return Expressions.buildLookupConditions(this, data);
  }


  createLookupConditions(id: string): any | any[] {
    return Expressions.parseLookupConditions(this, id);
  }

  // getClass() {
  //   return this.getClassRef().getClass();
  // }
  //
  // getClassRef() {
  //   return this.object;
  // }

  // build<T>(data: any, options: IBuildOptions = {}): T {
  //   return <T>SchemaUtils.transform(this, data, options);
  // }


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


  // toJson(withProperties: boolean = true) {
  //   const o = super.toJson();
  //   o.schema = this.object.getSchema();
  //   if (withProperties) {
  //     o.properties = this.getPropertyRefs().map(p => p.toJson());
  //   }
  //
  //   const storage = getMetadataStorage();
  //   const metadata = storage.getTargetValidationMetadatas(this.object.getClass(), null, true, false);
  //
  //   metadata.forEach(m => {
  //     const prop = _.find(o.properties, p => p.name === m.propertyName);
  //     if (prop) {
  //       if (!prop.validator) {
  //         prop.validator = [];
  //       }
  //
  //       const args: IValidationMetadataArgs = {
  //         type: m.type,
  //         target: this.object.className,
  //         propertyName: m.propertyName,
  //         constraints: m.constraints,
  //         constraintCls: m.constraintCls,
  //         validationTypeOptions: m.validationTypeOptions,
  //         validationOptions: {
  //           // TODO since 0.9.1 context: m.context,
  //           message: m.message,
  //           groups: m.groups,
  //           always: m.always,
  //           each: m.each,
  //         }
  //       };
  //
  //
  //       prop.validator.push(args);
  //     }
  //   });
  //
  //   return o;
  // }
  toJsonSchema(options: IJsonSchemaSerializeOptions = {}) {
    options = options || {};
    return JsonSchema.serialize(this, {...options, namespace: this.namespace, allowKeyOverride: true});
  }


  getRegistry(): ILookupRegistry {
    return RegistryFactory.get(this.namespace);
  }

  getClassRefFor(object: string | Function | IClassRef, type: METADATA_TYPE): IClassRef {
    return this.getRegistry().getClassRefFor(object, type);
  }
}
