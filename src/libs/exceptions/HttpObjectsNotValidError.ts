import {HttpError} from "routing-controllers/http-error/HttpError";

export class HttpObjectsNotValidError extends HttpError {

  isArray: boolean = false;

  objects: any[];

  constructor(objects: any[], isArray: boolean = false) {
    super(400);
    Object.setPrototypeOf(this, HttpObjectsNotValidError.prototype);
    this.objects = objects;
    this.isArray = isArray;
  }

  toJSON(){
    if(this.isArray){
      return {
        status: this.httpCode,
        objects: this.objects
      }
    }else{
      return {
        status: this.httpCode,
        object: this.objects[0]
      }
    }
  }
}
