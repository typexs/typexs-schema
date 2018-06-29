import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityDef, Registry} from "../../src";



@suite('functional/xsschema/xsschema_registry')
class Form_parseSpec {


  @test
  async 'load in correct order'() {

    require('./schemas/default/Author');
    require('./schemas/default/Book');

    let registry = Registry.$();
    let propNames = registry.listProperties().map(p => p.id());
    let entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.have.length(2);
    expect(propNames).to.have.length(7);

    let entity = Registry.getEntityDefFor('Author');
    expect(entity).to.not.be.null;
    let props = entity.getPropertyDefs();
    expect(props).to.have.length(3);

  }

  @test
  async 'load in incorrect order'() {

    require('./schemas/default/Book');
    require('./schemas/default/Author');


    let registry = Registry.$();
    let propNames = registry.listProperties().map(p => p.id());
    let entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.have.length(2);
    expect(propNames).to.have.length(7);

    let entity = Registry.getEntityDefFor('Author');
    expect(entity).to.not.be.null;
    let props = entity.getPropertyDefs();
    expect(props).to.have.length(3);

  }

  @test
  async 'extend entity through addon property'() {

    require('./schemas/default/Book'); // Book imports Author
    require('./schemas/default/Summary');

    let registry = Registry.$();
    let propNames = registry.listProperties().map(p => p.id());
    let entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.have.length(2);
    expect(propNames).to.have.length(10); // 5 before and 2 from summary and summary as new prop of book

    let entity = Registry.getEntityDefFor('Book');
    expect(entity).to.not.be.null;
    let props = entity.getPropertyDefs().map(p => p.id());
    expect(props).to.have.length(5);

  }

  @test
  async 'create simple instance with only primative properties'() {

    require('./schemas/default/Author'); // Book imports Author
    // require('./schemas/default/Summary');
    let entity = Registry.getEntityDefFor('Author');
    let instance = entity.new<any>();
    let def = EntityDef.resolve(instance);
    expect(def).to.eq(entity);

  }

  @test.skip
  async 'create instance with a referencing property'() {

    require('./schemas/default/Author'); // Book imports Author
    // require('./schemas/default/Summary');


  }

  @test.skip
  async 'create instance with addon property'() {

    require('./schemas/default/Author'); // Book imports Author
    // require('./schemas/default/Summary');


  }

}

