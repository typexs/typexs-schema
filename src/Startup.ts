import {IBootstrap, Inject, Log} from '@typexs/base';
import {EntityControllerFactory} from './libs/EntityControllerFactory';


export class Startup implements IBootstrap {

  @Inject(EntityControllerFactory.NAME)
  factory: EntityControllerFactory;

  async bootstrap(): Promise<void> {
    Log.info('booting schema ...');
    await this.factory.initialize();
  }

}
