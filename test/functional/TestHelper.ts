import * as _ from 'lodash';
import {getMetadataArgsStorage} from 'typeorm';
import {Injector, Invoker, REGISTRY_TYPEORM, SqliteSchemaHandler, TypeOrmEntityRegistry, TypeOrmStorageRef} from '@typexs/base';
import {EntityController} from '../../src/libs/EntityController';
import {EntityRegistry} from '../../src/libs/EntityRegistry';
import {FrameworkFactory} from '../../src/libs/framework/FrameworkFactory';
import {RegistryFactory} from '@allgemein/schema-api';

export class TestHelper {

  static suiteName(filename: string) {
    return filename.split('/test/').pop();
  }

  static async connect(options: any): Promise<{ ref: TypeOrmStorageRef, controller: EntityController }> {

    RegistryFactory.register(REGISTRY_TYPEORM, TypeOrmEntityRegistry);
    RegistryFactory.register(/^typeorm\..*/, TypeOrmEntityRegistry);
    RegistryFactory.get(REGISTRY_TYPEORM);


    const invoker = new Invoker();
    Injector.set(Invoker.NAME, invoker);
    const ref = new TypeOrmStorageRef(options);
    const schemaHandler = Reflect.construct(SqliteSchemaHandler, [ref]) as SqliteSchemaHandler;
    await schemaHandler.initOnceByType();
    ref.setSchemaHandler(schemaHandler);
    await ref.prepare();
    const schemaDef = EntityRegistry.$().getSchemaRefByName(options.name);

    const framework = FrameworkFactory.$().get(ref);
    const xsem = new EntityController(options.name, schemaDef, ref, framework);
    await xsem.initialize();

    return {ref: ref, controller: xsem};
  }


  static resetTypeorm() {
    this.typeOrmReset();
    // PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;
  }

  static wait(ms: number) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
    });
  }


  static logEnable(set?: boolean) {
    return process.env.CI_RUN ? false : _.isBoolean(set) ? set : true;
  }


  static typeOrmReset() {
//    PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;

    const e: string[] = ['SystemNodeInfo', 'TaskLog'];
    _.keys(getMetadataArgsStorage()).forEach(x => {
      _.remove(getMetadataArgsStorage()[x], y => y['target'] && e.indexOf(y['target'].name) === -1);
    });
  }

  static waitFor(fn: Function, ms: number = 50, rep: number = 30) {
    return new Promise((resolve, reject) => {
      const c = 0;
      const i = setInterval(() => {
        if (c >= rep) {
          clearInterval(i);
          reject(new Error('max repeats reached ' + rep));
        }
        try {
          const r = fn();
          if (r) {
            clearInterval(i);
            resolve(null);
          }
        } catch (err) {
          clearInterval(i);
          reject(err);
        }
      }, ms);
    });
  }
}
