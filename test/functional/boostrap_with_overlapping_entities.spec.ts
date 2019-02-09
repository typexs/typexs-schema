import {suite,test} from 'mocha-typescript';
import {Bootstrap, IStorageOptions} from '@typexs/base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {TestHelper} from "./TestHelper";
import * as _ from "lodash";
import {expect} from 'chai';
import {inspect} from "util";
import {TEST_STORAGE_OPTIONS} from "./config";



@suite('functional/bootstrap_with_overlapping_entities')
class Boostrap_with_overlapping_entitiesSpec {


  before() {
    TestHelper.resetTypeorm();
  }

  @test
  async 'bootstrap'() {

  }


}

