import {Container, IActivator, Log} from "typexs-base";
import {EntityRegistry} from "./libs/EntityRegistry";


export class Activator implements IActivator {
  startup(): void{
    const registry = EntityRegistry.$();
    Container.set(EntityRegistry, registry);
    Container.set('EntityRegistry', registry);
  }
}
