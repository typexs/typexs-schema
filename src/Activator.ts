import {Container, IActivator, IPermissions, Log} from '@typexs/base';
import {EntityRegistry} from './libs/EntityRegistry';
import {EntityControllerFactory} from './libs/EntityControllerFactory';
import {
  PERMISSION_ALLOW_ACCESS_ENTITY,
  PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN,
  PERMISSION_ALLOW_ACCESS_METADATA,
  PERMISSION_ALLOW_CREATE_ENTITY,
  PERMISSION_ALLOW_CREATE_ENTITY_PATTERN,
  PERMISSION_ALLOW_DELETE_ENTITY,
  PERMISSION_ALLOW_DELETE_ENTITY_PATTERN,
  PERMISSION_ALLOW_UPDATE_ENTITY,
  PERMISSION_ALLOW_UPDATE_ENTITY_PATTERN
} from './libs/Constants';
import {EntityRef} from './libs/registry/EntityRef';


export class Activator implements IActivator, IPermissions {


  async startup(): Promise<void> {
    const registry = EntityRegistry.$();
    Container.set(EntityRegistry, registry);
    Container.set(EntityRegistry.NAME, registry);

    const factory = Container.get(EntityControllerFactory);
    Container.set(EntityControllerFactory.NAME, factory);

    Log.info('booting schema ...');
    await factory.initialize();
  }


  permissions(): Promise<string[]> | string[] {
    const permissions = [
      PERMISSION_ALLOW_ACCESS_METADATA,
      PERMISSION_ALLOW_ACCESS_ENTITY,
      PERMISSION_ALLOW_CREATE_ENTITY,
      PERMISSION_ALLOW_UPDATE_ENTITY,
      PERMISSION_ALLOW_DELETE_ENTITY
    ];

    const registry = EntityRegistry.$();
    registry.listEntities().map((e: EntityRef) => {
      if (e.isStoreable()) {
        permissions.push(PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN.replace(':name', e.machineName));
        permissions.push(PERMISSION_ALLOW_CREATE_ENTITY_PATTERN.replace(':name', e.machineName));
        permissions.push(PERMISSION_ALLOW_UPDATE_ENTITY_PATTERN.replace(':name', e.machineName));
        permissions.push(PERMISSION_ALLOW_DELETE_ENTITY_PATTERN.replace(':name', e.machineName));
      }
    });
    return permissions;
  }

}
