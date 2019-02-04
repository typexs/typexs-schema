import {SqliteSchemaHandler, StorageRef, Storage, Container, Invoker} from "@typexs/base";
import {EntityController} from "../../src/libs/EntityController";
import {EntityRegistry, FrameworkFactory} from "../../src";
import {PlatformTools} from 'typeorm/platform/PlatformTools';
import {In} from "commons-expressions";

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
    PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;
  }

  static wait(ms: number) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
    })
  }

}
