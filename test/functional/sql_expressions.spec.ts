import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityController, EntityRegistry} from "../../src";
import {SqlConditionsBuilder} from "../../src/libs/framework/typeorm/SqlConditionsBuilder";


import * as _ from "lodash";
import {TEST_STORAGE_OPTIONS} from "./config";
import {TestHelper} from "./TestHelper";
import {StorageRef} from "@typexs/base";
import {Sql} from "../../src/libs/framework/typeorm/Sql";


@suite('functional/sql_conditions')
class Sql_expressionsSpec {

  before() {
    TestHelper.resetTypeorm();
  }

  async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    return TestHelper.connect(options);
  }

  @test
  async 'like'() {
    let like = {label: {$like: 'Book%'}};
    let str = Sql.conditionsToString(like);
    expect(str).to.be.eq(`label LIKE 'Book%'`);
  }


  @test
  async 'in'() {
    let like = {label: {$in: [1, 2, 3]}};
    let str = Sql.conditionsToString(like);
    expect(str).to.be.eq(`label IN (1,2,3)`);
  }


  @test
  async 'conditions for direct reference'() {

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'direct_property';

    const Car = require('./schemas/direct_property/Car').Car;
    const Skil = require('./schemas/direct_property/Skil').Skil;
    const Driver = require('./schemas/direct_property/Driver').Driver;

    let connect = await this.connect(options);



    let CarDef = EntityRegistry.getEntityDefFor("Car");
    let builder = new SqlConditionsBuilder(CarDef);
    let where = builder.build({
      producer: 'Volvo',
      'driver.age': 10
    });

    expect(builder.getJoins()).to.have.length(1);
    expect(where).to.be.eq("car.producer = 'Volvo' AND car_driver_1.age = '10'");
    expect(builder.getJoins()[0].condition).to.eq('car_driver_1.source_id = car.id');

  }


  @test
  async 'conditions for reference over given condition'() {
    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'direct_property';

    let connect = await this.connect(options);


    const CondEntityHolder = require("./schemas/conditions/CondEntityHolder");
    let CondEntityHolderDef = EntityRegistry.getEntityDefFor("CondEntityHolder");
    let builder = new SqlConditionsBuilder(CondEntityHolderDef);
    let where = builder.build({
      'contents.nickname': 'Bert'
    });

    expect(where).to.be.eq("cond_object_content_1.nickname = 'Bert'");
    expect(builder.getJoins()).to.have.length(1);
    expect(builder.getJoins()[0].condition).to.eq('cond_object_content_1.somenr = cond_entity_holder.mynr');


  }


  @test
  async 'conditions for direct reference over source-target join table'() {
    let options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    let connect = await this.connect(options);


    let CondEntityHolderDef = EntityRegistry.getEntityDefFor("Book");
    let builder = new SqlConditionsBuilder(CondEntityHolderDef);
    let where = builder.build({
      'author.lastName': 'Bert'
    });

    expect(where).to.be.eq("author_2.last_name = 'Bert'");
    let joins = builder.getJoins();
    expect(joins).to.have.length(2);
    expect(joins[0].table).to.eq('p_book_author');
    expect(joins[0].condition).to.eq('p_book_author_1.source_id = book.id');
    expect(joins[1].table).to.eq('author');
    expect(joins[1].condition).to.eq('author_2.id = p_book_author_1.target_id');

  }


}

