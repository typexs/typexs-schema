import {Inject, Injector, Log, Storage} from '@typexs/base';

import {EntityController} from './EntityController';
import {IFramework} from './framework/IFramework';
import {FrameworkFactory} from './framework/FrameworkFactory';
import {RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from './Constants';
import {EntityRegistry} from './EntityRegistry';

export class EntityControllerFactory {

  static NAME = 'EntityControllerFactory';

  @Inject(Storage.NAME)
  storage: Storage;

  controller: EntityController[] = [];

  getRegistry() {
    return RegistryFactory.get(NAMESPACE_BUILT_ENTITY) as EntityRegistry;
  }

  async initialize() {
    const storages = this.storage.getNames();
    for (const storageName of storages) {
      const schemaDef = this.getRegistry().getSchemaRefByName(storageName);
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
