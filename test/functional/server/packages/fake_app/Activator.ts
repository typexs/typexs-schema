import {IActivator, Log} from '@typexs/base';


export class Activator implements IActivator {
  startup(): void {
    Log.info('activation fake_app');

  }
}
