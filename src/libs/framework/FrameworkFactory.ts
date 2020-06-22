import {IStorageRef, NotSupportedError} from '@typexs/base';
import {IFramework} from './IFramework';
import {SqlFramework} from './typeorm/SqlFramework';


export class FrameworkFactory {

  private static $self: FrameworkFactory;

  frameworks: IFramework[] = [new SqlFramework()];

  private constructor() {
    this.frameworks.push(new SqlFramework());
  }

  static $(): FrameworkFactory {
    if (!this.$self) {
      this.$self = new FrameworkFactory();
    }
    return this.$self;
  }

  get(storageRef: IStorageRef) {
    for (const fwk of this.frameworks) {
      if (fwk.on(storageRef)) {
        return fwk;
      }
    }

    throw new NotSupportedError('no integration found for storage type ' + storageRef.getType());
  }

}
