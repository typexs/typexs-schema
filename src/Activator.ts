import {BasicPermission, IPermissionDef, IPermissions} from '@typexs/roles-api';
import {IActivator, Injector} from '@typexs/base';
import {EntityRegistry} from './libs/EntityRegistry';
import {EntityControllerFactory} from './libs/EntityControllerFactory';
import {
  PERMISSION_ALLOW_ACCESS_ENTITY,
  PERMISSION_ALLOW_ACCESS_ENTITY_METADATA,
  PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN,
  PERMISSION_ALLOW_CREATE_ENTITY,
  PERMISSION_ALLOW_CREATE_ENTITY_PATTERN,
  PERMISSION_ALLOW_DELETE_ENTITY,
  PERMISSION_ALLOW_DELETE_ENTITY_PATTERN,
  PERMISSION_ALLOW_UPDATE_ENTITY,
  PERMISSION_ALLOW_UPDATE_ENTITY_PATTERN
} from './libs/Constants';
import {EntityRef} from './libs/registry/EntityRef';
import './libs/decorators/register';


export class Activator implements IActivator, IPermissions {


  async startup(): Promise<void> {

    const factory = Injector.get(EntityControllerFactory);
    Injector.set(EntityControllerFactory.NAME, factory);
    //
    // Log.info('booting schema ...');
    // await factory.initialize();
  }


  permissions(): IPermissionDef[] {
    const permissions: IPermissionDef[] = [
      new BasicPermission(PERMISSION_ALLOW_ACCESS_ENTITY_METADATA),
      new BasicPermission(PERMISSION_ALLOW_ACCESS_ENTITY),
      new BasicPermission(PERMISSION_ALLOW_CREATE_ENTITY),
      new BasicPermission(PERMISSION_ALLOW_UPDATE_ENTITY),
      new BasicPermission(PERMISSION_ALLOW_DELETE_ENTITY)
    ];

    const registry = EntityRegistry.$();
    registry.listEntities().map((e: EntityRef) => {
      if (e.isStorable()) {
        permissions.push(new BasicPermission(PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN.replace(':name', e.machineName)));
        permissions.push(new BasicPermission(PERMISSION_ALLOW_CREATE_ENTITY_PATTERN.replace(':name', e.machineName)));
        permissions.push(new BasicPermission(PERMISSION_ALLOW_UPDATE_ENTITY_PATTERN.replace(':name', e.machineName)));
        permissions.push(new BasicPermission(PERMISSION_ALLOW_DELETE_ENTITY_PATTERN.replace(':name', e.machineName)));
      }
    });
    return permissions;
  }

}
