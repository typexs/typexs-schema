import {Container, Inject, Log, Storage} from '@typexs/base';

import {EntityController} from "./EntityController";
import {EntityRegistry} from "./EntityRegistry";
import {IFramework} from "./framework/IFramework";
import {FrameworkFactory} from "./framework/FrameworkFactory";

export class EntityControllerFactory {

  static NAME: string = 'EntityControllerFactory';

  @Inject(Storage.NAME)
  storage: Storage;

  @Inject(EntityRegistry.NAME)
  registry: EntityRegistry;

  controller: EntityController[] = [];

  async initialize() {

    const storages = this.storage.getNames();
    for (let storageName of storages) {
      let schemaDef = this.registry.getSchemaDefByName(storageName);
      if (schemaDef) {
        let storageRef = this.storage.get(storageName);
        let framework: IFramework = null;
        try {
          framework = FrameworkFactory.$().get(storageRef);
        } catch (e) {
          Log.debug('ignore schema generation for ' + storageName + '. ' + e.toString());
          continue;
        }

        Log.debug('generating schema for ' + storageName);
        let xsem = new EntityController(storageName, schemaDef, storageRef, framework);
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
