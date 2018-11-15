import {IBootstrap, Inject, Log} from "@typexs/base";
import {EntityControllerFactory} from "./libs/EntityControllerFactory";


export class Bootstrap implements IBootstrap {

  @Inject('EntityControllerFactory')
  factory: EntityControllerFactory;

  async bootstrap(): Promise<void> {
    Log.info('booting schema ...');
    await this.factory.initialize();
  }
}
