import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {Sql} from "../../src";


@suite('functional/sql_conditions')
class Sql_conditionsSpec {


  @test
  async 'like'() {
    let like = {label:{$like:'Book%'}};
    let str = Sql.conditionsToString(like);
    expect(str).to.be.eq(`label LIKE 'Book%'`);
  }

  @test
  async 'in'() {
    let like = {label:{$in:[1,2,3]}};
    let str = Sql.conditionsToString(like);
    expect(str).to.be.eq(`label IN (1,2,3)`);
  }

}

