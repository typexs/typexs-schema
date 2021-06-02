import {NestedException} from '@allgemein/base';

export class ConditionValidationError extends NestedException {

  constructor(msg: string) {
    super(new Error('validation error: ' + msg), 'CONDITION_VALIDATION_ERROR');
  }
}

