import * as _ from 'lodash';
import {ExprDesc} from "../descriptors/ExprDesc";

import {NotSupportedError} from "@typexs/base/libs/exceptions/NotSupportedError";
import {In} from "../descriptors/InDesc";
import {Neq} from "../descriptors/NeqDesc";
import {Lt} from "../descriptors/LtDesc";
import {Gt} from "../descriptors/GtDesc";
import {And} from "../descriptors/AndDesc";
import {Eq} from "../descriptors/EqDesc";
import {Ge} from "../descriptors/GeDesc";
import {Key} from "../descriptors/KeyDesc";
import {Le} from "../descriptors/LeDesc";
import {Or} from "../descriptors/OrDesc";
import {Value} from "../descriptors/ValueDesc";
import {GroupDesc} from "../descriptors/GroupDesc";
import {ExpressionInterpreter} from "./ExpressionInterpreter";
import {EntityDef} from "../..";


export class Expressions {

  static parse(str: any): ExprDesc {
    if (_.isString(str)) {
      // check if JSON string
      try {
        let obj = JSON.parse(str.trim());
        return this.fromJson(obj);
      } catch (e) {
        try {
          let interpreter = new ExpressionInterpreter();
          return interpreter.interprete(str);
        } catch (e) {
          throw e;
        }
      }
    } else if (_.isPlainObject(str)) {
      return this.fromJson(str);
    } else {
      throw new NotSupportedError('object cant be interpreted to conditions, wrong format')
    }
  }


  //static validate(entityDef:EntityDef, condition:CondDesc)

  /*
    static fromJson(object: any): CondDesc {
      let cond: CondDesc;
      let q: any = [];
      Helper.walk(object, (data: WalkValues) => {
        console.log(data)
        let op: CondDesc = null;
        if (/^(\$and|\$or)$/.test(data.key) && _.isArray(data.value)) {
          console.log(data.key);

          if (data.key == '$and') {
            op = And()
          } else if (data.key == '$or') {
            op = Or()
          }
          (<any>data).cond = op;
        } else if (data.key.startsWith('$') && !_.isPlainObject(data.value)) {
          if (data.key == '$eq') {
            let value = null;
            if (_.isPlainObject(data.value)) {
              if (_.has(data.value, '$key')) {
                value = Key(data.value.key);
              } else {
                // ???
                throw new NotSupportedError('object given but without known operator')
              }
            } else {
              value = data.value;
            }


          }
        } else if (!data.key.startsWith('$')) {
          if (_.isPlainObject(data.value)) {

          } else {
            // eq k = v
            op = Eq(Key(data.key), Value(data.value));

          }
        }


        if (!cond) {
          cond = op;
        }
      });

      return cond;
    }
  */
  static fromJson(object: any, srcKey: string = null, parent: ExprDesc = null): ExprDesc {
    if (_.isArray(object)) {
      if (!parent || !(parent instanceof GroupDesc)) {
        parent = Or()
      }

      for (let obj of object) {
        let sub = this.fromJson(obj, null, parent);
        if (!(sub instanceof GroupDesc)) {
          parent.values.push(sub);
        }

      }

      return parent;
    } else if (_.isPlainObject(object)) {
      let keys = _.keys(object);
      let operator = keys.filter(k => k.startsWith('$'));
      if (keys.length == 1 && operator.length == 1) {
        let op = operator.shift();
        if (op == '$or' || op == '$and') {
          if (_.isArray(object[op])) {
            let desc = op == '$or' ? Or() : And();
            if (parent instanceof GroupDesc) {
              parent.values.push(desc);
            }
            return this.fromJson(object[op], null, desc);
          } else {
            throw new NotSupportedError('or|and must have an array as value ' + JSON.stringify(object, null, 2))
          }
        } else if (['$eq', '$le', '$lt', '$ge', '$gt', '$ne', '$like'].indexOf(op) > -1) {
          let key = Key(srcKey);
          let value: any = null;
          if (_.isPlainObject(object[op])) {
            if (_.has(object[op], '$key')) {
              value = Key(object[op].$key);
            } else {
              // ???
              throw new NotSupportedError('object given but without known operator')
            }
          } else {
            value = Value(object[op]);
          }
          switch (op) {
            case '$eq':
              return Eq(key, value);
            case '$ne':
              return Neq(key, value);
            case '$le':
              return Le(key, value);
            case '$lt':
              return Lt(key, value);
            case '$ge':
              return Ge(key, value);
            case '$gt':
              return Gt(key, value);
          }

          throw new NotSupportedError('in operator found')
        } else if (op == '$in') {
          let key = Key(srcKey);
          let value: any = null;
          if (_.isArray(object[op])) {
            value = Value(object[op]);
          } else {
            throw new NotSupportedError('in operator needs an array as input')
          }
          return In(key, value);

        } else {
          throw new NotSupportedError('operator ' + op + ' not supported')
        }

      } else if (operator.length == 0) {
        let desc: ExprDesc[] = [];

        for (let k of keys) {
          desc.push(this.fromJson(object[k], k, null))
        }

        if (desc.length == 1) {
          return desc.shift();
        } else {
          return And(...desc);
        }
      } else {
        throw new NotSupportedError('object has wrong keys ' + JSON.stringify(object, null, 2))
      }
    } else {
      if (srcKey) {
        return Eq(Key(srcKey), object);
      }
      throw new NotSupportedError('object cant be resolved ' + JSON.stringify(object, null, 2))
    }
  }


}
