import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {IStorageOptions, StorageRef} from "typexs-base";
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {inspect} from 'util';
import {EntityController} from "../../src/libs/EntityController";
import {TestHelper} from "./TestHelper";
import {TEST_STORAGE_OPTIONS} from "./config";
import {XS_P_PREV_ID} from "../../src";


@suite('functional/sql_plain_entity')
class Sql_plain_entitySpec {

  before() {
    TestHelper.resetTypeorm();
  }

  async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    return TestHelper.connect(options);
  }

  @test
  async 'lifecycle for plain entity'() {
    let options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;

    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';
    a = await xsem.save(a);

    let ids = {id: a.id};

    let author_found = await xsem.find(Author, {id: a.id});
    expect(author_found).to.have.length(1);

    let deleted_entities = await xsem.remove(author_found);
    console.log('delete', deleted_entities);

    let author_delete_01: any = deleted_entities.shift();
    expect(author_delete_01.id).to.be.undefined;
    expect(author_delete_01[XS_P_PREV_ID]).to.be.deep.eq(ids)

    author_found = await xsem.find(Author, author_delete_01[XS_P_PREV_ID]);
    expect(author_found).to.have.length(0);

  }

}
