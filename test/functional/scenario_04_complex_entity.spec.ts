import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {IStorageOptions} from 'typexs-base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {inspect} from "util";
import * as _ from "lodash";
import {TestHelper} from "./TestHelper";


export const TEST_STORAGE_OPTIONS: IStorageOptions = <SqliteConnectionOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logger: 'simple-console',
  logging: 'all'
  // tablesPrefix: ""

};


@suite('functional/scenario_04_complex_entity')
class Scenario_04_complex_entitySpec {


  before() {
    TestHelper.resetTypeorm();
  }


  @test
  async 'entity lifecycle for scenario'() {


    const Person = require('./schemas/complex_entity/Person').Person;
    const Job = require('./schemas/complex_entity/Job').Job;
    const Language = require('./schemas/complex_entity/Language').Language;

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'complex_entity';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let language_1 = new Language();
    language_1.code = 'DE';
    language_1.label = 'deutsch';

    let language_2 = new Language();
    language_2.code = 'EN';
    language_2.label = 'englisch';

    let language_3 = new Language();
    language_3.code = 'FR';
    language_3.label = 'französisch';

    let job_1 = new Job();
    job_1.position = 'Prospect';
    job_1.languages = [language_1, language_2];

    let job_2 = new Job();
    job_2.position = 'President';
    job_2.languages = [language_2, language_3];

    let person_save_1 = new Person();
    person_save_1.name = 'Harald Junke';
    person_save_1.jobs = [job_1, job_2];

    person_save_1 = await xsem.save(person_save_1);
    console.log(inspect(person_save_1, false, 10));

    let person_found = await xsem.find(Person, {ident: 1});
    let person_find_1 = person_found.shift();
    console.log(inspect(person_find_1, false, 10));

    expect(person_save_1).to.deep.eq(person_find_1);
  }

}

