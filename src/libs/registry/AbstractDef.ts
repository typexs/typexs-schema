import {XS_TYPE} from './../Constants';

import {ClassRef} from './ClassRef';
import * as _ from './../LoDash';
import {IProperty} from "./IProperty";
import {IEntity} from "./IEntity";


export abstract class AbstractDef {

  private readonly _baseType: XS_TYPE;

  readonly name: string;

  private _options: any = {};

  readonly object: ClassRef;

  constructor(type: XS_TYPE, name: string, object: ClassRef | Function | string = null) {
    this._baseType = type;
    this.name = name;
    if(object instanceof ClassRef){
      this.object = object;
    }else{
      this.object = object ? ClassRef.get(object) : null;
    }
  }

  setOptions(opts: any) {
    if (opts && !_.isEmpty(Object.keys(opts))) {
      this._options = opts;
    } else {

    }
  }

  setOption(key: string, value: any) {
    if (!this._options) {
      this._options = {};
    }
    _.set(this._options, key, value);
  }


  get machineName() {
    return _.snakeCase(this.name);
  }


  get storingName() {
    let name = this.getOptions('name');
    if (!name) {
      name = _.snakeCase(this.name);
    }
    return name;
  }


  get baseType() {
    return this._baseType;
  }

  getOptions(key: keyof IProperty | keyof IEntity = null, defaultValue: any = null) {
    if (key) {
      return _.get(this._options, key, defaultValue);
    }
    return this._options;
  }

  abstract id(): string | string[];

  toJson() {
    let o: any = {
      id:this.id(),
      name: this.name,
      type: this.baseType,
      machineName: this.machineName,
      options: _.cloneDeep(this.getOptions())
    }
    return o;
  }

}



