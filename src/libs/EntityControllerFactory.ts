import {Container, Inject, Log, Storage} from 'typexs-base';

import {EntityController} from "./EntityController";
import {EntityRegistry} from "./EntityRegistry";

export class EntityControllerFactory {

  @Inject('storage')
  storage: Storage;

  @Inject('EntityRegistry')
  registry: EntityRegistry;

  controller: EntityController[] = [];

  async initialize() {

    const storages = this.storage.getNames();
    for (let storageName of storages) {
      let schemaDef = this.registry.getSchemaDefByName(storageName);
      if(schemaDef){
        let storageRef = this.storage.get(storageName);
        Log.debug('generating schema for ' + storageName);
        let xsem = new EntityController(storageName, schemaDef, storageRef);
        await xsem.initialize();
        Container.set('EntityController.' + storageName, xsem);
        this.controller.push(xsem);
      }
    }
  }

  get(name: string) {
    return this.controller.find(x => x.name.toLowerCase() == name.toLowerCase());
  }


}
