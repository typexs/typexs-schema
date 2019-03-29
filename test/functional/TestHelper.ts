import * as _ from "lodash";
import {getMetadataArgsStorage} from "typeorm";
import {Container, Invoker, SqliteSchemaHandler, StorageRef} from "@typexs/base";
import {EntityController} from "../../src/libs/EntityController";
import {EntityRegistry, FrameworkFactory} from "../../src";
import {PlatformTools} from 'typeorm/platform/PlatformTools';

export class TestHelper {

  static async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    let invoker = new Invoker();
    Container.set(Invoker.NAME, invoker);
    let ref = new StorageRef(options);
    ref.setSchemaHandler(Reflect.construct(SqliteSchemaHandler, [ref]));
    await ref.prepare();
    let schemaDef = EntityRegistry.getSchema(options.name);

    const framework = FrameworkFactory.$().get(ref);
    let xsem = new EntityController(options.name, schemaDef, ref, framework);
    await xsem.initialize();

    return {ref: ref, controller: xsem}
  }


  static resetTypeorm() {
    this.typeOrmReset()
    //PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;
  }

  static wait(ms: number) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
    })
  }


  static logEnable(set?: boolean) {
    return process.env.CI_RUN ? false : _.isBoolean(set) ? set : true;
  }


  static typeOrmReset() {
//    PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;

    const e: string[] = ['SystemNodeInfo', 'TaskLog'];
    _.keys(getMetadataArgsStorage()).forEach(x => {
      _.remove(getMetadataArgsStorage()[x], y => y['target'] && e.indexOf(y['target'].name) == -1)
    })
  }

  static waitFor(fn: Function, ms: number = 50, rep: number = 30) {
    return new Promise((resolve, reject) => {
      let c = 0;
      let i = setInterval(() => {
        if (c >= rep) {
          clearInterval(i);
          reject(new Error('max repeats reached ' + rep))
        }
        try {
          let r = fn();
          if (r) {
            clearInterval(i);
            resolve()
          }
        } catch (err) {
          clearInterval(i);
          reject(err)
        }
      }, ms)
    })
  }
}
