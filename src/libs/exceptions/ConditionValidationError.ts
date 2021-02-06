import {NestedException} from "@allgemein/base/libs/exceptions/NestedException";

export class ConditionValidationError extends NestedException {

  constructor(msg: string) {
    super(new Error('validation error: ' + msg), "CONDITION_VALIDATION_ERROR");
  }
}

