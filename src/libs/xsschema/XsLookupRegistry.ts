import * as _ from 'lodash';
import {XS_TYPE} from './Constants';


export class XsLookupRegistry {

  private static $self = new XsLookupRegistry();

  private _entries: { [context: string]: any[] } = {};


  private constructor() {

  }


  static $() {
    return this.$self;
  }

  list(context: XS_TYPE){
    if (!_.has(this._entries, context)) {
      this._entries[context] = [];
    }
    return this._entries[context];
  }

  add<T>(context: XS_TYPE, entry: T):T {
    if (!_.has(this._entries, context)) {
      this._entries[context] = [];
    }
    this._entries[context].push(entry);
    return entry;
  }

  filter<T>(context: XS_TYPE, search: any):T[] {
    if (!_.has(this._entries, context)) {
      this._entries[context] = [];
    }
    return _.filter(this._entries[context], search);
  }

  find<T>(context: XS_TYPE, search: any):T {
    if (!_.has(this._entries, context)) {
      this._entries[context] = [];
    }
    return _.find(this._entries[context], search);
  }


}
