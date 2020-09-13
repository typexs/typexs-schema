import { Inject, Injector, Log, Storage} from '@typexs/base';

import {EntityController} from './EntityController';
import {EntityRegistry} from './EntityRegistry';
import {IFramework} from './framework/IFramework';
import {FrameworkFactory} from './framework/FrameworkFactory';

export class EntityControllerFactory {

  static NAME = 'EntityControllerFactory';

  @Inject(Storage.NAME)
  storage: Storage;

  @Inject(EntityRegistry.NAME)
  registry: EntityRegistry;

  controller: EntityController[] = [];

  async initialize() {

    const storages = this.storage.getNames();
    for (const storageName of storages) {
      const schemaDef = this.registry.getSchemaRefByName(storageName);
      if (schemaDef) {
        const storageRef = this.storage.get(storageName);
        let framework: IFramework = null;
        try {
          framework = FrameworkFactory.$().get(storageRef);
        } catch (e) {
          Log.debug('ignore schema generation for ' + storageName + '. ' + e.toString());
          continue;
        }

        Log.debug('generating schema for ' + storageName);
        const entityController = new EntityController(storageName, schemaDef, storageRef, framework);
        await entityController.initialize();
        Injector.set('EntityController.' + storageName, entityController);
        this.controller.push(entityController);
      }
    }
  }

  get(name: string) {
    return this.controller.find(x => x.name().toLowerCase() === name.toLowerCase());
  }


}
