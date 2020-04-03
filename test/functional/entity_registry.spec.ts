import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {Entity, EntityRef, EntityRegistry, Property, REGISTRY_TXS_SCHEMA, XS_ANNOTATION_OPTIONS_CACHE, } from '../../src';
import * as _ from 'lodash';

import {MetaArgs} from '@typexs/base';
import {AnnotationsHelper, ClassRef, XS_DEFAULT_SCHEMA} from 'commons-schema-api';


@suite('functional/entity_registry')
class EntityRegistrySpec {


  @test
  async 'load in correct order'() {

    require('./schemas/default/Author');
    require('./schemas/default/Book');

    const registry = EntityRegistry.$();
    const entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.be.include.members([
      'default--author',
      'default--book'
    ]);

    const propNames = registry.listProperties().map(p => p.id());
    expect(propNames).to.include.members([
      'default--author--id',
      'default--author--firstname',
      'default--author--lastname',
      'default--book--id',
      'default--book--label',
      'default--book--content',
      'default--book--author'
    ]);

    let entity = EntityRegistry.getEntityRefFor('Author');
    expect(entity).to.not.be.empty;

    let props = entity.getPropertyRefs();
    expect(props).to.have.length(3);

    entity = registry.getEntityRefByName('author');
    expect(entity).to.not.be.empty;

    const eJson = entity.toJson();
    expect(eJson).to.deep.include({
      id: 'default--author',
      name: 'Author',
      type: 'entity',
      machineName: 'author',
      options: {
        storeable: true
      },
      schema: 'default'
    });

    expect(eJson.properties).to.have.length(3);
    expect(_.map(eJson.properties, x => x.machineName)).to.deep.eq(['id', 'first_name', 'last_name']);

    props = entity.getPropertyRefs();
    expect(props).to.have.length(3);

    const pJsons = _.map(props, p => p.toJson());
    expect(pJsons).to.have.length(3);
  }


  @test
  async 'load in incorrect order'() {

    require('./schemas/default/Book');
    require('./schemas/default/Author');


    const registry = EntityRegistry.$();
    const propNames = registry.listProperties().map(p => p.id());
    const entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.include.members(['default--author', 'default--book']);
    expect(propNames).to.include.members([
      'default--author--id',
      'default--author--firstname',
      'default--author--lastname',
      'default--book--id',
      'default--book--label',
      'default--book--content',
      'default--book--author'

    ]); // 5 before and 2 from summary and summary as new prop of book

    const entity = EntityRegistry.getEntityRefFor('Author');
    expect(entity).to.not.be.null;
    const props = entity.getPropertyRefs();
    expect(props).to.have.length(3);

  }


  @test
  async 'extend entity through addon property'() {

    require('./schemas/default/Book'); // Book imports Author
    require('./schemas/default/Summary');

    const registry = EntityRegistry.$();
    const propNames = registry.listProperties().map(p => p.id());
    const entityNames = registry.listEntities().map(p => p.id());

    expect(entityNames).to.include.members(['default--author', 'default--book']);
    expect(propNames).to.include.members([
      'default--book--id',
      'default--book--label',
      'default--book--content',
      'default--book--author',
      'default--summary--size',
      'default--summary--content',
      'default--book--summary',

    ]); // 5 before and 2 from summary and summary as new prop of book

    const entity = EntityRegistry.getEntityRefFor('Book');
    expect(entity).to.not.be.null;

    const props = entity.getPropertyRefs().map(p => p.id());


    expect(props).to.include.members([
      'default--book--id',
      'default--book--label',
      'default--book--content',
      'default--book--author',
      'default--book--summary'
    ]); // 5 before and 2 from summary and summary as new prop of book

  }

  @test
  async 'create simple instance with only primative properties'() {

    require('./schemas/default/Author'); // Book imports Author
    // require('./schemas/default/Summary');
    const entity = EntityRegistry.getEntityRefFor('Author');
    const instance = entity.new<any>();
    const def = EntityRef.resolve(instance);
    expect(def).to.eq(entity);

    const registry = EntityRegistry.$();

    // check if exists in schema
    const defaultSchema = EntityRegistry.getSchema(XS_DEFAULT_SCHEMA);
    const entities = defaultSchema.getEntities();
    expect(entities).to.have.length.greaterThan(0);

  }


  @test
  async 'EntityRegistry get properties for class ref'() {
    const classRef = ClassRef.get(require('./schemas/direct_property/Driver').Driver, REGISTRY_TXS_SCHEMA); // Book imports Author
    // require('./schemas/default/Summary');
    const registry = EntityRegistry.$();
    const props = registry.getPropertyRefsFor(classRef);
    expect(props.length).to.be.eq(3);
  }


  @test
  async 'extend property options by other annotation before and after the concrete declaration'() {

    function PropAddOn(opts: any = {}) {
      return function (object: any, property: string, _options: any = {}) {
        AnnotationsHelper.forPropertyOn(object, property, opts);
      };
    }


    @Entity({storeable: false})
    class TestAnno {

      @PropAddOn({hallo: 'welt'})
      @Property({type: 'string'})
      test1: string;


      @Property({type: 'string'})
      @PropAddOn({hallo: 'welt2'})
      test2: string;
    }

    const registry = EntityRegistry.$();
    const entityDef = registry.getEntityRefByName('TestAnno');
    const props = entityDef.getPropertyRefs();
    expect(props).to.have.length(2);
    const test1 = props.find(p => p.name === 'test1');
    expect(test1.getOptions()).to.deep.include({hallo: 'welt'});
    const test2 = props.find(p => p.name === 'test2');
    expect(test2.getOptions()).to.deep.include({hallo: 'welt2'});

    expect(MetaArgs.key(XS_ANNOTATION_OPTIONS_CACHE)).to.have.length(0);
  }

  @test
  async 'extend entity options by other annotation before and after the concrete declaration'() {

    function EntityPropAddOn(opts: any = {}) {
      return function (object: any) {
        AnnotationsHelper.forEntityOn(object, opts);
      };
    }


    @EntityPropAddOn({hallo: 'welt'})
    @Entity({storeable: false})
    class TestAnno2 {

    }

    @Entity({storeable: false})
    @EntityPropAddOn({hallo: 'welt2'})
    class TestAnno3 {

    }

    const registry = EntityRegistry.$();
    const entityDef1 = registry.getEntityRefByName('TestAnno2');
    expect(entityDef1.getOptions()).to.deep.include({hallo: 'welt'});
    const entityDef2 = registry.getEntityRefByName('TestAnno3');
    expect(entityDef2.getOptions()).to.deep.include({hallo: 'welt2'});

    expect(MetaArgs.key(XS_ANNOTATION_OPTIONS_CACHE)).to.have.length(0);

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

