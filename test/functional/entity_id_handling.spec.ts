import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityRegistry} from "../../src";
import * as _ from "lodash";


@suite('functional/entity_handling')
class Entity_id_handlingSpec {


  @test
  async 'resolve entity ids from string'() {
    require('./schemas/default/Author');
    require('./schemas/default/ComplexIdsKeys');

    let registry = EntityRegistry.$();
    let entityDef = registry.getEntityRefByName('author');

    let conditions = entityDef.createLookupConditions('1');
    expect(_.has(conditions, 'id')).to.be.true;
    expect(conditions['id']).to.be.eq(1);


    conditions = entityDef.createLookupConditions('id=1');
    expect(_.has(conditions, 'id')).to.be.true;
    expect(conditions['id']).to.be.eq(1);

    conditions = entityDef.createLookupConditions('(id=1),(id=2)');
    expect(conditions).to.have.length(2);
    expect(conditions).to.be.deep.eq([{id: 1}, {id: 2}]);

    conditions = entityDef.createLookupConditions('1,2,3');
    expect(conditions).to.have.length(3);
    expect(conditions).to.be.deep.eq([{id: 1}, {id: 2}, {id: 3}]);

    conditions = entityDef.createLookupConditions('(1),(2),(3)');
    expect(conditions).to.have.length(3);
    expect(conditions).to.be.deep.eq([{id: 1}, {id: 2}, {id: 3}]);

    let entityDefPKs = registry.getEntityRefByName('ComplexIdsKeys');

    conditions = entityDefPKs.createLookupConditions("inc=1,code='test'");
    expect(conditions).to.be.deep.eq({inc: 1, code: 'test'});

    conditions = entityDefPKs.createLookupConditions("(inc=1,code='test'),(inc=2,code='test2')");
    expect(conditions).to.have.length(2);
    expect(conditions).to.be.deep.eq([{inc: 1, code: 'test'}, {inc: 2, code: 'test2'}]);

    conditions = entityDefPKs.createLookupConditions("(1,'test'),(2,'test2')");
    expect(conditions).to.have.length(2);
    expect(conditions).to.be.deep.eq([{inc: 1, code: 'test'}, {inc: 2, code: 'test2'}]);

    conditions = entityDefPKs.createLookupConditions("1,'test'");
    expect(conditions).to.be.deep.eq({inc: 1, code: 'test'});
  }

  @test
  async 'build entity ids to string'() {
    require('./schemas/default/Author');
    require('./schemas/default/ComplexIdsKeys');

    let registry = EntityRegistry.$();
    let entityDef = registry.getEntityRefByName('author');

    let str = entityDef.buildLookupConditions({id:1});
    expect(str).to.be.eq("1");

    str = entityDef.buildLookupConditions([{id:1},{id:2}]);
    expect(str).to.be.eq("1,2");

    let entityDefPKs = registry.getEntityRefByName('ComplexIdsKeys');
    str = entityDefPKs.buildLookupConditions({inc: 1, code: 'test'});
    expect(str).to.be.eq("1,'test'");

    str = entityDefPKs.buildLookupConditions([{inc: 1, code: 'test'},{inc: 2, code: 'test2'}]);
    expect(str).to.be.eq("(1,'test'),(2,'test2')");
  }

}

