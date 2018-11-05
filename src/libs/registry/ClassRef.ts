import {LookupRegistry} from './../LookupRegistry';
import {XS_DEFAULT_SCHEMA, XS_TYPE_CLASS_REF, XS_TYPE_ENTITY} from './../Constants';
import {EntityDef} from './EntityDef';
import {NotYetImplementedError} from 'typexs-base/libs/exceptions/NotYetImplementedError';
import * as _ from './../LoDash'
import {IObject} from "./IObject";
import {Binding} from "./Binding";
import {XS_TYPE_SCHEMA} from "../Constants";

export class ClassRef {

  static __inc: number = 0;

  private readonly idx: number;

  schemas: string[] = [XS_DEFAULT_SCHEMA];

  readonly originalValue: string | Function;

  readonly className: string;

  options: any = {};

  isEntity: boolean = false;

  constructor(klass: string | Function) {
    this.className = ClassRef.getClassName(klass);
    if (_.isString(klass)) {
      this.originalValue = klass;
    } else {
      this.originalValue = ClassRef.getFunction(klass);
    }
    this.idx = ClassRef.__inc++;

  }


  setOptions(options: IObject) {
    this.options = options;
  }

  get storingName() {
    let name = _.get(this.options, 'name', this.className);
    return _.snakeCase(name);
  }

  hasName() {
    return _.get(this.options, 'name');
  }

  setSchemas(s: string[]) {
    s.forEach((s: string) => {
      this.setSchema(s);
    })
  }

  setSchema(s: string) {
    if (this.schemas.length == 1 && this.schemas[0] == XS_DEFAULT_SCHEMA) {
      this.schemas = [s];
    } else {
      this.schemas.push(s);
    }

  }

  getSchema(): string | string[] {
    if (this.schemas.length == 1) {
      return this.schemas[0];
    } else {
      return this.schemas;
    }
  }

  /*
  schemaName(){
    return this.schemas.join('')
  }*/

  inMultipleSchemas() {
    return this.schemas.length > 1;
  }

  machineName() {
    return _.snakeCase(this.className);
  }

//  get klass():Funct{
  //return LookupRegistry.$().find(XS_TYPE_ENTITY)
  //}

  static getClassName(klass: string | Function) {
    if (_.isString(klass)) {
      return klass;
    } else if (_.isFunction(klass)) {
      return klass.name;
    } else if (_.isObject(klass)) {
      return klass.constructor.name;
    } else {
      throw new Error('class not found!');
    }
  }


  static getFunction(klass: string | Function) {
    if (_.isString(klass)) {
      // TODO create error class

      throw new Error('class not found! 02');
    } else if (_.isFunction(klass)) {
      return klass;
    } else if (_.isObject(klass)) {
      return klass.constructor;
    } else {
      // TODO create error class
      throw new Error('class not found! 01');
    }
  }


  getClass(): Function {
    if (_.isFunction(this.originalValue)) {
      return this.originalValue;
    } else {
      // generate function make ctor
      throw new NotYetImplementedError();
    }

  }


  static find(klass: string | Function): ClassRef {
    let classRef = null;
    if (_.isString(klass)) {
      let name = ClassRef.getClassName(klass);
      classRef = LookupRegistry.$().find<ClassRef>(XS_TYPE_CLASS_REF, {className: name});
    } else {
      klass = ClassRef.getFunction(klass);
      classRef = LookupRegistry.$().find<ClassRef>(XS_TYPE_CLASS_REF, (c: ClassRef) => c.getClass() == klass);
    }
    return classRef;

  }


  static get(klass: string | Function): ClassRef {
    let classRef = this.find(klass);
    if (classRef) return classRef;
    classRef = new ClassRef(klass);
    let binding = Binding.create(XS_TYPE_SCHEMA, XS_DEFAULT_SCHEMA, XS_TYPE_CLASS_REF, classRef);
    LookupRegistry.$().add(binding.bindingType, binding);
    return LookupRegistry.$().add(XS_TYPE_CLASS_REF, classRef);
  }

  private _cacheEntity: EntityDef;

  getEntity(): EntityDef {
    if (!this._cacheEntity) {
      this._cacheEntity = LookupRegistry.$().find(XS_TYPE_ENTITY, (x: EntityDef) => x.object.id() === this.id());
    }
    return this._cacheEntity;
  }

  new() {
    let klass = this.getClass();
    let instance = Reflect.construct(klass, []);
    return instance;

  }


  id() {
    return this.schemas.join() + this.className;
  }


  toJson() {
    return {
      schema: this.getSchema(),
      className: this.className,
      isEntity: this.isEntity,
      options: this.options
    }
  }
}
