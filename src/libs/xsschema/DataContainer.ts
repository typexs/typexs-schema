import {validate} from 'class-validator';
import * as _ from 'lodash';
import {XsRegistry} from './XsRegistry';




export interface ValidationMessage {
  type: string,
  content: string

}

export interface ValidationResult {
  key: string;
  valid: boolean,
  checked: boolean,
  messages: ValidationMessage[]
}

export class DataContainer<T> {

  isValidated: boolean;

  isSuccess: boolean;

  isSuccessValidated: boolean;

  errors: any[];

  validation: { [k: string]: ValidationResult } = {};

  instance: T;


  constructor(instance: T) {
    this.instance = instance;
    let entityDef = XsRegistry.getEntityDefFor(this.instance);
    entityDef.getPropertyDefs().forEach(propDef => {
      this.validation[propDef.name] = {
        key: propDef.name,
        valid: false,
        checked: false,
        messages: []
      };
    });
  }


  checked(str: string) {
    if(this.validation[str]) {
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
    if(this.validation[str]) {
      return this.validation[str].valid;
    }
    return false;
  }


  messages(str: string) {
    if(this.validation[str] && this.validation[str].messages){
      return this.validation[str].messages;
    }
    return [];

  }

  async validate() {
    this.isValidated = true;
    let results = await validate(this.instance, {validationError: {target: false}});
    this.isSuccessValidated = true;
    Object.keys(this.validation).forEach(key => {
      if (this.validation[key]) {
        let valid = this.validation[key];
        let found = _.find(results, {property: key});
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

  }
}
