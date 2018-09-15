import {XS_ID_SEPARATOR, XS_TYPE} from './Constants';

import {ClassRef} from './ClassRef';
import * as _ from './LoDash';


export abstract class AbstractDef {

  private readonly _baseType: XS_TYPE;

  readonly name: string;

  private _options: any = {};

  readonly object: ClassRef;

  constructor(type: XS_TYPE, name: string, object: Function | string = null) {
    this._baseType = type;
    this.name = name;
    this.object = object ? ClassRef.get(object) : null;
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

  getOptions(key: string = null, defaultValue: any = null) {
    if (key) {
      return _.get(this._options, key, defaultValue);
    }
    return this._options;
  }

  id(): string {
    let idKeys: string[] = [];
    if (_.has(this, 'schemaName')) {
      if (_.has(this, 'entityName')) {
        idKeys = ['schemaName', 'entityName', 'name'];
      } else {
        idKeys = ['schemaName', 'name'];
      }

    } else {
      idKeys = ['name'];
    }
    return _.map(idKeys, (k): string => this[k]).join(XS_ID_SEPARATOR).toLocaleLowerCase();
  }


  toJson() {
    let o: any = {
      id:this.id(),
      name: this.name,
      type: this.baseType,
      machineName: this.machineName,
      options: this.getOptions()
    }
    return o;
  }

}



