import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityDef, EntityRegistry} from "../../src";
import _ = require("lodash");


@suite('functional/entity_handling')
class Entity_handlingSpec {


  @test
  async 'entity lookup simple id'() {
    require('./schemas/default/Author');
    require('./schemas/default/ComplexIdsKeys');

    let registry = EntityRegistry.$();
    let entityDef = registry.getEntityDefByName('author');
    let entityDefPKs = registry.getEntityDefByName('ComplexIdsKeys');

    let conditions = entityDef.createLookupConditions('1');
    expect(_.has(conditions,'id')).to.be.true;
    expect(conditions['id']).to.be.eq(1);

    conditions = entityDef.createLookupConditions('id=1');
    expect(_.has(conditions,'id')).to.be.true;
    expect(conditions['id']).to.be.eq(1);

    conditions = entityDef.createLookupConditions('(id=1),(id=2)');
    expect(conditions).to.have.length(2);
    expect(conditions).to.be.deep.eq([ { id: 1 }, { id: 2 } ]);

    conditions = entityDef.createLookupConditions('1,2,3');
    expect(conditions).to.have.length(3);
    expect(conditions).to.be.deep.eq([ { id: 1 }, { id: 2 },{ id: 3 } ]);

    conditions = entityDef.createLookupConditions('(1),(2),(3)');
    expect(conditions).to.have.length(3);
    expect(conditions).to.be.deep.eq([ { id: 1 }, { id: 2 },{ id: 3 } ]);

    conditions = entityDefPKs.createLookupConditions("inc=1,code='test'");
    expect(conditions).to.be.deep.eq({ inc: 1, code: 'test' });

    conditions = entityDefPKs.createLookupConditions("(inc=1,code='test'),(inc=2,code='test2')");
    expect(conditions).to.have.length(2);
    expect(conditions).to.be.deep.eq([ { inc: 1, code: 'test' }, { inc: 2, code: 'test2' } ]);

    conditions = entityDefPKs.createLookupConditions("(1,'test'),(2,'test2')");
    expect(conditions).to.have.length(2);
    expect(conditions).to.be.deep.eq([ { inc: 1, code: 'test' }, { inc: 2, code: 'test2' } ]);
  }


}

