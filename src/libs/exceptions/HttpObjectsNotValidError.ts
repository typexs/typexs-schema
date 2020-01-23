export class HttpObjectsNotValidError extends Error {

  isArray: boolean = false;

  objects: any[];

  httpCode: number;


  constructor(objects: any[], isArray: boolean = false) {
    super();
    this.httpCode = 400;
    Object.setPrototypeOf(this, HttpObjectsNotValidError.prototype);
    this.objects = objects;
    this.isArray = isArray;
  }

  toJSON() {
    if (this.isArray) {
      return {
        status: this.httpCode,
        objects: this.objects
      };
    } else {
      return {
        status: this.httpCode,
        object: this.objects[0]
      };
    }
  }
}
