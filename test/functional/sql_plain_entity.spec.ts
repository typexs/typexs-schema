import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import * as _ from 'lodash';
import {StorageRef} from '@typexs/base';
import {EntityController} from '../../src/libs/EntityController';
import {TestHelper} from './TestHelper';
import {TEST_STORAGE_OPTIONS} from './config';
import {NAMESPACE_BUILT_ENTITY, XS_P_PREV_ID} from '../../src/libs/Constants';
import {ILookupRegistry, RegistryFactory} from '@allgemein/schema-api';


let registry: ILookupRegistry;

@suite('functional/sql_plain_entity')
class SqlPlainEntitySpec {


  static before() {
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  }

  static after() {
    RegistryFactory.reset();
  }

  before() {
    TestHelper.resetTypeorm();
  }

  async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    return TestHelper.connect(options);
  }

  @test
  async 'lifecycle for plain entity'() {
    const options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;
    const authorRef = registry.getEntityRefFor(Author);


    const connect = await this.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    let a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';
    a = await xsem.save(a, {validate: false});

    const ids = {id: a.id};

    let author_found = await xsem.find(Author, {id: a.id});
    expect(author_found).to.have.length(1);

    const deleted_entities = await xsem.remove(author_found);
    // console.log('delete', deleted_entities);

    const author_delete_01: any = deleted_entities.shift();
    expect(author_delete_01.id).to.be.undefined;
    expect(author_delete_01[XS_P_PREV_ID]).to.be.deep.eq(ids);

    author_found = await xsem.find(Author, author_delete_01[XS_P_PREV_ID]);
    expect(author_found).to.have.length(0);

  }

}
