import {Container, IActivator} from "@typexs/base";
import {EntityRegistry} from "./libs/EntityRegistry";
import {EntityControllerFactory} from "./libs/EntityControllerFactory";


export class Activator implements IActivator {

  startup(): void{
    const registry = EntityRegistry.$();
    Container.set(EntityRegistry, registry);
    Container.set('EntityRegistry', registry);

    let factory = Container.get(EntityControllerFactory);
    Container.set('EntityControllerFactory', factory);
  }
}
