import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityDef, EntityRegistry} from "../../src";
import _ = require("lodash");


@suite('functional/entity_transformations')
class Entity_transformationsSpec {


  @test
  async 'simple transformations' () {
    require('./schemas/default/Author');
    let registry = EntityRegistry.$();
    let data = {id: 1, lastName: 'Engels', firstName: 'Friedrich'};
    let entityDef = registry.getEntityDefByName('author');
    let author = entityDef.build(data);
    expect(JSON.stringify(author)).to.eq(JSON.stringify(data));
  }


}

