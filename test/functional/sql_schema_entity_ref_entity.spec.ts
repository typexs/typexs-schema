import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import * as _ from 'lodash';
import {TestHelper} from './TestHelper';
import {TEST_STORAGE_OPTIONS} from './config';
import {XS_P_ABORTED} from '../../src/libs/Constants';


const FINDOPT = {
  hooks: {
    abortCondition: (entityRef: any, propertyDef: any, results: any, op: any) => {
      return op.entityDepth > 1;
    }
  }
};


@suite('functional/sql_schema_entity_ref_entity')
class SqlSchemaEntityRefEntitySpec {


  before() {

    TestHelper.resetTypeorm();
  }


  @test
  async 'entity referencing single entity E-P-E'() {


    const PersonData = require('./schemas/default/PersonData').PersonData;
    const Training = require('./schemas/default/Training').Training;
    const Address = require('./schemas/default/Address').Address;

    // let classRefs = EntityRegistry.$().listClassRefs();

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();


    const addr_save_01 = new Address();
    addr_save_01.postalcode = '10777';
    addr_save_01.street = 'Fuggergasse 8';

    const pers_save_01 = new PersonData();
    pers_save_01.lastName = 'Bert';
    pers_save_01.address = addr_save_01;

    let trai_save_01 = new Training();
    trai_save_01.trainer = pers_save_01;
    trai_save_01.type = 'Running';

    trai_save_01 = await xsem.save(trai_save_01, {validate: false});
    const saved_str_01 = JSON.parse(JSON.stringify(trai_save_01));

    // Update the existing entity
    let trai_save_02 = new Training();
    trai_save_02.id = trai_save_01.id;
    trai_save_02.trainer = pers_save_01;
    trai_save_02.type = 'Running';

    trai_save_02 = await xsem.save(trai_save_02, {validate: false});
    const saved_str_02 = JSON.parse(JSON.stringify(trai_save_02));
    expect(saved_str_02).to.deep.eq(saved_str_01);


    const pers_save_02 = new PersonData();
    pers_save_02.id = pers_save_01.id;
    pers_save_02.lastName = 'Bert';
    // pers_save_01.address = addr_save_01;

    let trai_save_03 = new Training();
    trai_save_03.id = trai_save_01.id;
    trai_save_03.trainer = pers_save_02;
    trai_save_03.type = 'Running';

    trai_save_03 = await xsem.save(trai_save_03, {validate: false});
    // console.log(inspect(trai_save_03, false, 10));

    const trai_find_01 = await xsem.find(Training, {id: trai_save_03.id}, FINDOPT);
    expect(trai_find_01).to.have.length(1);

    const find_str_01 = JSON.parse(JSON.stringify(trai_find_01.shift()));
    delete find_str_01.trainer.address[XS_P_ABORTED];
    expect(find_str_01).to.deep.eq(saved_str_01);


  }


  @test
  async 'save entity ref with only given id'() {

    const PersonData = require('./schemas/default/PersonData').PersonData;
    const Training = require('./schemas/default/Training').Training;
    const Address = require('./schemas/default/Address').Address;

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const addr_save_01 = new Address();
    addr_save_01.postalcode = '10888';
    addr_save_01.street = 'Franzgasse 8';

    let pers_save_01 = new PersonData();
    pers_save_01.lastName = 'Bertorio';
    pers_save_01.address = addr_save_01;

    pers_save_01 = await xsem.save(pers_save_01, {validate: false});
    // console.log(inspect(pers_save_01, false, 10));

    let trai_save_01 = new Training();
    trai_save_01.trainer = {id: pers_save_01.id};
    trai_save_01.type = 'Running';

    trai_save_01 = await xsem.save(trai_save_01, {validate: false});
    // console.log(inspect(trai_save_01, false, 10));

    const trai_find_01 = await xsem.find(Training, {id: trai_save_01.id});
    expect(trai_find_01).to.have.length(1);
  }


}

