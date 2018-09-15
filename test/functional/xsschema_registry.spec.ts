import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityDef, EntityRegistry} from "../../src";
import _ = require("lodash");


@suite('functional/xsschema/xsschema_registry')
class Xsschema_registrySpec {


  @test
  async 'load in correct order'() {

    require('./schemas/default/Author');
    require('./schemas/default/Book');

    let registry = EntityRegistry.$();
    let entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.be.include.members([
      'default--author',
      'default--book'
    ]);
    let propNames = registry.listProperties().map(p => p.id());
    expect(propNames).to.include.members([
      "default--author--id",
      "default--author--firstname",
      "default--author--lastname",
      "default--book--id",
      "default--book--label",
      "default--book--content",
      "default--book--author"
    ]);

    let entity = EntityRegistry.getEntityDefFor('Author');
    expect(entity).to.not.be.empty;

    let props = entity.getPropertyDefs();
    expect(props).to.have.length(3);

    entity = registry.getEntityDefByName('author');
    expect(entity).to.not.be.empty;

    let eJson = entity.toJson();
    expect(eJson).to.deep.include({
      id: 'default--author',
      name: 'Author',
      type: 'entity',
      machineName: 'author',
      options: {
        storeable: true
      },
      schemaName: 'default'
    });

    expect(eJson.properties).to.have.length(3);
    expect(_.map(eJson.properties, x => x.machineName)).to.deep.eq(['id', 'first_name', 'last_name']);

    props = entity.getPropertyDefs();
    expect(props).to.have.length(3);

    let pJsons = _.map(props, p => p.toJson());
    expect(pJsons).to.have.length(3);
  }

  @test
  async 'load in incorrect order'() {

    require('./schemas/default/Book');
    require('./schemas/default/Author');


    let registry = EntityRegistry.$();
    let propNames = registry.listProperties().map(p => p.id());
    let entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.include.members(['default--author', 'default--book']);
    expect(propNames).to.include.members([
      "default--author--id",
      "default--author--firstname",
      "default--author--lastname",
      "default--book--id",
      "default--book--label",
      "default--book--content",
      "default--book--author"

    ]); // 5 before and 2 from summary and summary as new prop of book

    let entity = EntityRegistry.getEntityDefFor('Author');
    expect(entity).to.not.be.null;
    let props = entity.getPropertyDefs();
    expect(props).to.have.length(3);

  }

  @test
  async 'extend entity through addon property'() {

    require('./schemas/default/Book'); // Book imports Author
    require('./schemas/default/Summary');

    let registry = EntityRegistry.$();
    let propNames = registry.listProperties().map(p => p.id());
    let entityNames = registry.listEntities().map(p => p.id());

    expect(entityNames).to.include.members(['default--author', 'default--book']);
    expect(propNames).to.include.members([
      "default--book--id",
      "default--book--label",
      "default--book--content",
      "default--book--author",
      "default--summary--size",
      "default--summary--content",
      "default--book--summary",

    ]); // 5 before and 2 from summary and summary as new prop of book

    let entity = EntityRegistry.getEntityDefFor('Book');
    expect(entity).to.not.be.null;

    let props = entity.getPropertyDefs().map(p => p.id());


    expect(props).to.include.members([
      "default--book--id",
      "default--book--label",
      "default--book--content",
      "default--book--author",
      "default--book--summary"
    ]); // 5 before and 2 from summary and summary as new prop of book

  }

  @test
  async 'create simple instance with only primative properties'() {

    require('./schemas/default/Author'); // Book imports Author
    // require('./schemas/default/Summary');
    let entity = EntityRegistry.getEntityDefFor('Author');
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

