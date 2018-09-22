import {SqliteSchemaHandler, StorageRef} from "typexs-base";
import {EntityController} from "../../src/libs/EntityController";
import {EntityRegistry, FrameworkFactory} from "../../src";

export class TestHelper {

  static async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    let ref = new StorageRef(options);
    ref.setSchemaHandler(new SqliteSchemaHandler(ref));
    await ref.prepare();
    let schemaDef = EntityRegistry.getSchema(options.name);

    const framework = FrameworkFactory.$().get(ref);
    let xsem = new EntityController(options.name, schemaDef, ref, framework);
    await xsem.initialize();

    return {ref:ref, controller:xsem}
  }

}
