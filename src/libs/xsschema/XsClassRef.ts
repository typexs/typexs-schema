import * as _ from 'lodash';
import {XsLookupRegistry} from './XsLookupRegistry';
import {XS_TYPE_CLASS_REF, XS_TYPE_ENTITY} from './Constants';
import {XsEntityDef} from './XsEntityDef';
import {NotYetImplementedError} from './NotYetImplementedError';

export class XsClassRef {

  readonly schema: string = 'default';

  readonly originalValue: string | Function;

  readonly className: string;

  constructor(klass: string | Function) {
    this.className = XsClassRef.getClassName(klass);
    if(_.isString(klass)){
      this.originalValue = klass;
    }else{
      this.originalValue = XsClassRef.getFunction(klass);
    }

  }


  machineName(){
    return _.snakeCase(this.className);
  }
//  get klass():Funct{
  //return XsLookupRegistry.$().find(XS_TYPE_ENTITY)
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

  getClass():Function{
    if(_.isFunction(this.originalValue)){
      return this.originalValue;
    }else{
      // generate function make ctor
      throw new NotYetImplementedError();
    }

  }


  static get(klass: string | Function): XsClassRef {
    let name = XsClassRef.getClassName(klass);
    let classRef = XsLookupRegistry.$().find<XsClassRef>(XS_TYPE_CLASS_REF, {className: name});
    if (classRef) return classRef;
    classRef = new XsClassRef(klass);
    return XsLookupRegistry.$().add(XS_TYPE_CLASS_REF, classRef);
  }


  getEntity(): XsEntityDef {
    return XsLookupRegistry.$().find(XS_TYPE_ENTITY, {name: this.className});
  }
}
