import {IExpr} from "./IExpr";
import * as _ from "lodash";
import {KeyDesc} from "./KeyDesc";
import {NotYetImplementedError} from "@typexs/base/libs/exceptions/NotYetImplementedError";
import {NotSupportedError} from "@typexs/base/libs/exceptions/NotSupportedError";
import {ValueDesc} from "./ValueDesc";

import {ClassRef} from "../../libs/registry/ClassRef";
import {EntityRegistry} from "../../libs/EntityRegistry";
import {ConditionValidationError} from '../../libs/exceptions/ConditionValidationError'

export class ExprDesc implements IExpr {

  readonly type:string = 'cond';

  key?: any;

  value?:any;

  values?:any;

  isOp(){
    return false;
  }

  isGroup(){
    return false;
  }

  getSourceKeys(): string[] {
    let keys: string[] = [];
    if (this.isOp()) {
      keys.push(this.key);
      /*
      let childKeys = this.value.getSourceKeys();
      if(!_.isEmpty(childKeys)){
        keys = _.concat(keys, childKeys);
      }*/
    } else if (this.isGroup()) {
      keys = _.concat(keys, ..._.map(this.values, v => v.getSourceKeys()));
    }
    return keys;
  }


  getTargetKeys() {
    let keys: string[] = [];
    if (this.isOp()) {
      if (this.value instanceof KeyDesc) {
        keys.push(this.value.key);
      }
    } else if (this.isGroup()) {
      keys = _.concat(keys, ..._.map(this.values, v => v.getTargetKeys()));
    }
    return keys;
  }

  /**
   * Test if conditions matching class properties and references
   */
  test(sourceRef: ClassRef, errors:string[] = []){
    let sourceKeys = this.getSourceKeys();
    for(let sourceKey of sourceKeys){
      let keyChain = sourceKey.split('.');
      let root = sourceRef;
      while(keyChain.length > 0){
        let _k = keyChain.shift();
        let p = root.getPropertyDef(_k);
        if(p){
          if(p.isReference()){
            root = p.targetRef;
          }
        }else{
          errors.push('key '+_k + ' is no property of '+root.className);
        }
      }
    }
    return errors.length == 0;
  }

  /**
   * Validate if defined keys match source and target element
   * - target = referred
   * - source = referrer
   */
  validate(targetRef: ClassRef, sourceRef?: ClassRef, throwing: boolean = true) {
    let sourceKeys = this.getSourceKeys();
    let targetKeys = this.getTargetKeys();

    let targetProps = EntityRegistry.getPropertyDefsFor(targetRef).map(p => p.name).filter(pn => sourceKeys.indexOf(pn) !== -1);
    let sourceProps = sourceRef ? EntityRegistry.getPropertyDefsFor(sourceRef).map(p => p.name).filter(pn => targetKeys.indexOf(pn) !== -1) : [];
    if (sourceKeys.length != targetProps.length) {
      if (throwing) {
        throw new ConditionValidationError('referred key(s) ' + sourceKeys.filter(k => targetProps.indexOf(k) === -1).join(',') + ' not in sourceRef')
      }
      return false;
    }
    if (targetKeys.length != sourceProps.length) {
      if (throwing) {
        throw new ConditionValidationError('referrer key(s) ' + targetKeys.filter(k => sourceProps.indexOf(k) === -1).join(',') + ' not in targetRef')
      }
      return false;
    }
    return true;
  }


  applyOn(target: any, source: any, force: boolean = false) {
    if (this.type == 'eq') {
      if (!_.has(target, this.key) || false) {
        if (this.value instanceof ValueDesc) {
          target[this.key] = this.value.value;
        } else if (this.value instanceof KeyDesc) {
          target[this.key] = source[this.value.key];
        } else {
          throw new NotYetImplementedError()
        }
      }
    } else if (this.type == 'and') {
      _.map(this.values, v => v.applyOn(target, source, force))
    } else if (this.type == 'or') {
      _.map(this.values, v => v.applyOn(target, source, force))
    } else {
      throw new NotYetImplementedError();
    }
  }


  applyReverseOn(target: any, source: any, force: boolean = false) {
    if (this.type == 'eq') {
      if (!_.has(target, this.key) || false) {
        if (this.value instanceof KeyDesc) {
          target[this.value.key] = source[this.key];
        } else {
          throw new NotYetImplementedError()
        }
      }
    } else if (this.type == 'and') {
      _.map(this.values, v => v.applyReverseOn(target, source, force))
    } else if (this.type == 'or') {
      _.map(this.values, v => v.applyReverseOn(target, source, force))
    } else {
      throw new NotYetImplementedError();
    }
  }


  /**
   * Returns key-value map of all key and referenced key or values
   * (sometimes needed for join definitions).
   */
  getMap() {
    let map: any = {}
    if (this.type == 'eq') {
      if (this.value instanceof KeyDesc) {
        map[this.key] = this.value.key;
      } else if (this.value instanceof ValueDesc) {
        map[this.key] = "'" + this.value.value + "'";
      } else {
        throw new NotYetImplementedError()
      }
    } else if (this.type == 'and') {
      _.merge(map, ..._.map(this.values, v => v.getMap()));
    } else if (this.type == 'or') {
      _.merge(map, ..._.map(this.values, v => v.getMap()));
    } else {
      throw new NotYetImplementedError();
    }
    return map;
  }


  lookup(source: any): (target: any) => boolean {
    throw new NotYetImplementedError()
  }

  for(target: any, keyMap: any = {}): any {
    throw new NotYetImplementedError()
  }

  toJson(){
    if(this.isGroup()){
      let res:any= {};
      res['$'+this.type] = _.map(this.values, x => x.toJson());
      return res;
    }else if(this.isOp()){
      let res:any= {};
      res[this.key] = {}
      res[this.key]['$'+this.type] = this.value.toJson ? this.value.toJson() : this.value;
      return res;
    }else{
      throw new NotSupportedError('toJson to this condition not supported');
    }

  }

}
