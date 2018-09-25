import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {IStorageOptions, StorageRef} from 'typexs-base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {EntityRegistry} from "../../src";
import {EntityController} from "../../src/libs/EntityController";
import {inspect} from "util";
import * as _ from "lodash";
import {TestHelper} from "./TestHelper";
import {PlatformTools} from 'typeorm/platform/PlatformTools';


export const TEST_STORAGE_OPTIONS: IStorageOptions = <SqliteConnectionOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logger: 'simple-console',
  logging: 'all'
  // tablesPrefix: ""

};


@suite('functional/scenario_05_predefined_join')
class Scenario_04_complex_entitySpec {


  before() {
    PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;
  }


}

