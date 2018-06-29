import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {XsRegistry} from '../../../src/libs/xsschema/XsRegistry';
import {XsEntityDef} from '../../../src/libs/xsschema/XsEntityDef';


@suite('functional/xsschema/xsschema_registry')
class Form_parseSpec {

  @test
  async 'load in correct order'() {
    XsRegistry.reset();
    require('./schemas/default/Author');
    require('./schemas/default/Book');

    let registry = XsRegistry.$();
    let propNames = registry.listProperties().map(p => p.id());
    let entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.have.length(2);
    expect(propNames).to.have.length(5);

    let entity = XsRegistry.getEntityDefFor('Author');
    expect(entity).to.not.be.null;
    let props = entity.getPropertyDefs();
    expect(props).to.have.length(2);
    XsRegistry.reset();
  }

  @test
  async 'load in incorrect order'() {
    XsRegistry.reset();
    require('./schemas/default/Book');
    require('./schemas/default/Author');


    let registry = XsRegistry.$();
    let propNames = registry.listProperties().map(p => p.id());
    let entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.have.length(2);
    expect(propNames).to.have.length(5);

    let entity = XsRegistry.getEntityDefFor('Author');
    expect(entity).to.not.be.null;
    let props = entity.getPropertyDefs();
    expect(props).to.have.length(2);
    XsRegistry.reset();
  }

  @test
  async 'extend entity through addon property'() {
    XsRegistry.reset();
    require('./schemas/default/Book'); // Book imports Author
    require('./schemas/default/Summary');

    let registry = XsRegistry.$();
    let propNames = registry.listProperties().map(p => p.id());
    let entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.have.length(2);
    expect(propNames).to.have.length(5 + 3); // 5 before and 2 from summary and summary as new prop of book

    let entity = XsRegistry.getEntityDefFor('Book');
    expect(entity).to.not.be.null;
    let props = entity.getPropertyDefs().map(p => p.id());
    expect(props).to.have.length(4);
    XsRegistry.reset();
  }

  @test
  async 'create simple instance with only primative properties'() {
    XsRegistry.reset();
    require('./schemas/default/Author'); // Book imports Author
    // require('./schemas/default/Summary');
    let entity = XsRegistry.getEntityDefFor('Author');
    let instance = entity.new<any>();
    let def = XsEntityDef.resolve(instance);
    expect(def).to.eq(entity);
    XsRegistry.reset();
  }

  @test.skip
  async 'create instance with a referencing property'() {
    XsRegistry.reset();
    require('./schemas/default/Author'); // Book imports Author
    // require('./schemas/default/Summary');

    XsRegistry.reset();
  }

  @test.skip
  async 'create instance with addon property'() {
    XsRegistry.reset();
    require('./schemas/default/Author'); // Book imports Author
    // require('./schemas/default/Summary');

    XsRegistry.reset();
  }

}

