import {LookupRegistry} from './LookupRegistry';
import {XS_TYPE_CLASS_REF, XS_TYPE_ENTITY} from './Constants';
import {EntityDef} from './EntityDef';
import {NotYetImplementedError} from 'typexs-base/libs/exceptions/NotYetImplementedError';
import * as _ from './LoDash'
import {IObject} from "./IObject";

export class ClassRef {

  schema: string = 'default';

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

  }


  setOptions(options: IObject) {
    this.options = options;
  }

  get storingName() {
    let name = _.get(this.options, 'name', this.className);
    return _.snakeCase(name);
  }


  setSchema(s: string) {
    this.schema = s;
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


  static get(klass: string | Function): ClassRef {
    let name = ClassRef.getClassName(klass);
    let classRef = LookupRegistry.$().find<ClassRef>(XS_TYPE_CLASS_REF, {className: name});
    if (classRef) return classRef;
    classRef = new ClassRef(klass);
    return LookupRegistry.$().add(XS_TYPE_CLASS_REF, classRef);
  }


  getEntity(): EntityDef {
    return LookupRegistry.$().find(XS_TYPE_ENTITY, {name: this.className});
  }

  new() {
    let klass = this.getClass();
    let instance = Reflect.construct(klass, []);
    return instance;

  }
}
