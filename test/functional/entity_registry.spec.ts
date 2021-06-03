import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {kebabCase} from 'lodash';
import {AnnotationsHelper, ClassRef, RegistryFactory, XS_DEFAULT_SCHEMA} from '@allgemein/schema-api';
import {EntityRegistry} from '../../src/libs/EntityRegistry';
import {EntityRef} from '../../src/libs/registry/EntityRef';
import {K_STORABLE, NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';
import {Property} from '../../src/libs/decorators/Property';
import {Entity} from '../../src/libs/decorators/Entity';

let registry: EntityRegistry;

@suite('functional/entity_registry')
class EntityRegistrySpec {

  static before() {
    RegistryFactory.remove(NAMESPACE_BUILT_ENTITY);
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY) as EntityRegistry;
  }

  static after() {
    RegistryFactory.reset();
  }


  @test
  async 'load in correct order'() {
    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    const ref1 = registry.getEntityRefFor(Author);
    const ref2 = registry.getEntityRefFor(Book);

    const entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.be.include.members([
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--author',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book'
    ]);

    const propNames = registry.listProperties().map(p => p.id());
    expect(propNames).to.include.members([
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--author--id',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--author--firstname',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--author--lastname',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--id',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--label',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--content',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--author'
    ]);

    let entity = registry.getEntityRefFor('Author');
    expect(entity).to.not.be.empty;

    const props = entity.getPropertyRefs();
    expect(props).to.have.length(3);

    entity = registry.getEntityRefByName('author');
    expect(entity).to.not.be.empty;

    // const eJson = entity.toJson();
    // expect(eJson).to.deep.include({
    //   id: kebabCase(NAMESPACE_BUILT_ENTITY) + '--author',
    //   name: 'Author',
    //   type: 'entity',
    //   machineName: 'author',
    //   options: {
    //     [K_STORABLE]: true
    //   },
    //   schema: 'default'
    // });
    //
    // expect(eJson.properties).to.have.length(3);
    // expect(_.map(eJson.properties, x => x.machineName)).to.deep.eq(['id', 'first_name', 'last_name']);
    //
    // props = entity.getPropertyRefs();
    // expect(props).to.have.length(3);
    //
    // // TODO const pJsons = _.map(props, p => p.toJson());
    // const pJsons = [];
    // expect(pJsons).to.have.length(3);
  }


  @test
  async 'load in incorrect order'() {
    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    const ref1 = registry.getEntityRefFor(Author);
    const ref2 = registry.getEntityRefFor(Book);

    const entityNames = registry.listEntities().map(p => p.id());
    expect(entityNames).to.include.members([
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--author',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book'
    ]);
    const propNames = registry.listProperties().map(p => p.id());
    expect(propNames).to.include.members([
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--author--id',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--author--firstname',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--author--lastname',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--id',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--label',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--content',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--author'

    ]); // 5 before and 2 from summary and summary as new prop of book

    const entity = registry.getEntityRefFor('Author');
    expect(entity).to.not.be.null;
    const props = entity.getPropertyRefs();
    expect(props).to.have.length(3);

  }


  @test.skip
  async 'extend entity through addon property'() {

    require('./schemas/default/Book'); // Book imports Author
    require('./schemas/default/Summary');

    const propNames = registry.listProperties().map(p => p.id());
    const entityNames = registry.listEntities().map(p => p.id());

    expect(entityNames).to.include.members([
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--author',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book'
    ]);
    expect(propNames).to.include.members([
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--id',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--label',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--content',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--author',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--summary--size',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--summary--content',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--summary',

    ]); // 5 before and 2 from summary and summary as new prop of book

    const entity = registry.getEntityRefFor('Book');
    expect(entity).to.not.be.null;

    const props = entity.getPropertyRefs().map(p => p.id());


    expect(props).to.include.members([
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--id',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--label',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--content',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--author',
      kebabCase(NAMESPACE_BUILT_ENTITY) + '--book--summary'
    ]); // 5 before and 2 from summary and summary as new prop of book

  }

  @test
  async 'create simple instance with only primative properties'() {

    require('./schemas/default/Author'); // Book imports Author
    // require('./schemas/default/Summary');
    const entity = registry.getEntityRefFor('Author');
    const instance = entity.create<any>();
    const def = EntityRef.resolve(instance);
    expect(def).to.eq(entity);


    // check if exists in schema
    const defaultSchema = registry.getSchemaRefByName(XS_DEFAULT_SCHEMA);
    const entities = defaultSchema.getEntityRefs();
    expect(entities).to.have.length.greaterThan(0);

  }


  @test
  async 'EntityRegistry get properties for class ref'() {
    const classRef = ClassRef.get(require('./schemas/direct_property/Driver').Driver, NAMESPACE_BUILT_ENTITY); // Book imports Author
    // require('./schemas/default/Summary');
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


    @Entity({[K_STORABLE]: false})
    class TestAnno {

      @PropAddOn({hallo: 'welt'})
      @Property({type: 'string'})
      test1: string;


      @Property({type: 'string'})
      @PropAddOn({hallo: 'welt2'})
      test2: string;
    }

    const entityDef = registry.getEntityRefByName('TestAnno');
    const props = entityDef.getPropertyRefs();
    expect(props).to.have.length(2);
    const test1 = props.find(p => p.name === 'test1');
    expect(test1.getOptions()).to.deep.include({hallo: 'welt'});
    const test2 = props.find(p => p.name === 'test2');
    expect(test2.getOptions()).to.deep.include({hallo: 'welt2'});

    // expect(MetaArgs.key(XS_ANNOTATION_OPTIONS_CACHE)).to.have.length(0);
  }

  @test
  async 'extend entity options by other annotation before and after the concrete declaration'() {

    function EntityPropAddOn(opts: any = {}) {
      return function (object: any) {
        AnnotationsHelper.forEntityOn(object, opts);
      };
    }


    @EntityPropAddOn({hallo: 'welt'})
    @Entity({[K_STORABLE]: false})
    class TestAnno2 {

    }

    @Entity({[K_STORABLE]: false})
    @EntityPropAddOn({hallo: 'welt2'})
    class TestAnno3 {

    }

    const entityDef1 = registry.getEntityRefByName('TestAnno2');
    expect(entityDef1.getOptions()).to.deep.include({hallo: 'welt'});
    const entityDef2 = registry.getEntityRefByName('TestAnno3');
    expect(entityDef2.getOptions()).to.deep.include({hallo: 'welt2'});

    // expect(MetaArgs.key(XS_ANNOTATION_OPTIONS_CACHE)).to.have.length(0);

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

