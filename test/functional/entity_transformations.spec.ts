import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityRegistry} from "../../src";


@suite('functional/entity_transformations')
class Entity_transformationsSpec {


  @test
  async 'simple transformations' () {
    require('./schemas/default/Author');
    let registry = EntityRegistry.$();
    let data = {id: 1, lastName: 'Engels', firstName: 'Friedrich'};
    let entityDef = registry.getEntityDefByName('author');
    let author = entityDef.build(data);
    expect(author).to.deep.eq(data);
  }


}

