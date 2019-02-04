import {validate} from 'class-validator';
import * as _ from './LoDash'
import {EntityRegistry} from './EntityRegistry';
import {IValidationResult} from "./IValidationResult";
import {IValidationError} from "./IValidationError";
import {IValidationMessage} from "./IValidationMessage";
import {DataContainer as _DataContainer} from "@typexs/base/browser";


export const STATE_KEY = '$state';

export class DataContainer<T> extends _DataContainer<T>{

  static keys:string[] = ['isValidated','isSuccess','isSuccessValidated', 'errors'];

  isValidated: boolean;

  isSuccess: boolean;

  isSuccessValidated: boolean;

  errors: IValidationError[] = [];

  validation: { [k: string]: IValidationResult } = {};

  instance: T;


  constructor(instance: T) {
    super(instance,EntityRegistry.$());
  }


  addError(e: IValidationError) {
    if(!_.has(e,'type')){
      e.type = 'error';
    }
    this.errors.push(e);
  }


  hasErrors() {
    return this.errors.length > 0;
  }


  checked(str: string) {
    if (this.validation[str]) {
      return this.validation[str].checked;
    }
    return false;
  }


  value(str: string) {
    let wrap = {};
    Object.defineProperty(wrap, str, {
      get: () => {
        return this.instance[str];
      },
      set: (y: any) => {
        this.instance[str] = y;
      }
    });
    return wrap[str];
  }


  valid(str: string) {
    if (this.validation[str]) {
      return this.validation[str].valid;
    }
    return false;
  }


  messages(str: string): IValidationMessage[] {
    if (this.validation[str] && this.validation[str].messages) {
      return this.validation[str].messages;
    }
    return [];

  }


  async validate():Promise<boolean> {
    this.isValidated = true;
    _.remove(this.errors, error => error.type == 'validate');
    let results = await validate(this.instance, {validationError: {target: false}});
    results.map(r => this.errors.push({property: r.property, value: r.value, constraints: r.constraints, type:'validate'}));
    this.isSuccessValidated = true;
    Object.keys(this.validation).forEach(key => {
      if (this.validation[key]) {
        let valid = this.validation[key];
        let found = _.find(this.errors, {property: key});
        valid.messages = [];
        if (found) {
          valid.valid = false;
          Object.keys(found.constraints).forEach(c => {
            valid.messages.push({type: c, content: found.constraints[c]});
          });

        } else {
          valid.valid = true;
        }
        this.isSuccessValidated = this.isSuccessValidated && valid.valid;
        valid.checked = true;
      }
    });

    return this.isSuccessValidated;
  }



  applyState(){
    let $state:any = {};
    DataContainer.keys.forEach(k => {
      const value = _.get(this,k,null);

      if(_.isBoolean(value) || !_.isEmpty(value)){
        _.set($state,k,value);
      }
    });

    _.set(<any>this.instance,STATE_KEY,$state);
  }


  resetErrors(){
    this.errors = [];
  }
}
