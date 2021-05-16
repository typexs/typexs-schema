import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import * as _ from 'lodash';
import {EntityRegistry} from '../../src/libs/EntityRegistry';
import {RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';

let registry: EntityRegistry;

@suite('functional/entity_transformations')
class EntityTransformationsSpec {

  static before() {
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY) as EntityRegistry;
  }

  static after() {
    RegistryFactory.reset();
  }

  @test
  async 'simple transformations'() {
    const Author = require('./schemas/default/Author').Author;
    const ref1 = registry.getEntityRefFor(Author);

    const data = {id: 1, lastName: 'Engels', firstName: 'Friedrich'};
    const entityDef = registry.getEntityRefByName('author');
    const author = entityDef.build(data, {skipClassNamespaceInfo: true});
    expect(author).to.deep.eq(data);
  }


  @test
  async 'array transformations'() {
    const Permission = require('./schemas/role_permissions/Permission').Permission;
    const Role = require('./schemas/role_permissions/Role').Role;
    const ref1 = registry.getEntityRefFor(Permission);
    const ref2 = registry.getEntityRefFor(Role);

    const p = new Permission();
    p.id = 1;
    p.permission = 'permission;)';
    p.roles = [{id: 1, rolename: 'role1'}, {id: 2, rolename: 'role2'}];
    const entityDef = registry.getEntityRefByName('Permission');
    const permission: any = entityDef.build(p);
    expect(_.isArray(permission.roles)).to.be.true;
    expect(permission.roles).to.have.length(2);
  }

  @test
  async 'boolean transformations'() {
    const Permission = require('./schemas/role_permissions/Permission').Permission;
    const Role = require('./schemas/role_permissions/Role').Role;
    const ref1 = registry.getEntityRefFor(Permission);
    const ref2 = registry.getEntityRefFor(Role);

    let p = new Permission();
    p.id = 1;
    p.disabled = false;
    p.permission = 'permission;)';
    p.roles = [{id: 1, rolename: 'role1'}, {id: 2, rolename: 'role2'}];
    const entityDef = registry.getEntityRefByName('Permission');
    let permission: any = entityDef.build(p);
    expect(_.isBoolean(permission.disabled)).to.be.true;
    expect(permission.disabled).to.be.false;

    p = new Permission();
    p.id = 1;
    p.disabled = true;
    p.permission = 'permission;)';
    p.roles = [{id: 1, rolename: 'role1'}, {id: 2, rolename: 'role2'}];

    permission = entityDef.build(p);
    expect(_.isBoolean(permission.disabled)).to.be.true;
    expect(permission.disabled).to.be.true;

  }


  @test
  async 'entity with object integration'() {
    const EntityWithEmbedded = require('./schemas/embedded/EntityWithEmbedded').EntityWithEmbedded;
    const EmbeddedSubObject = require('./schemas/embedded/EmbeddedSubObject').EmbeddedSubObject;
    const EmbeddedObject = require('./schemas/embedded/EmbeddedObject').EmbeddedObject;

    const p = new EntityWithEmbedded();
    p.id = 2;
    p.obj = new EmbeddedObject();
    p.obj.inner = new EmbeddedSubObject();
    p.obj.innerName = 'test';
    p.obj.inner.subName = 'test2';
    p.obj.inner.SubOtherVar = 1;


    const entityDef = registry.getEntityRefByName('EntityWithEmbedded');
    const entityWithEmbedded: any = entityDef.build(JSON.parse(JSON.stringify(p)), {skipClassNamespaceInfo: true});
    expect(entityWithEmbedded).to.deep.eq(p);

  }

  @test
  async 'entity with multiple object integration'() {
    const Car = require('./schemas/direct_property/Car').Car;
    const Driver = require('./schemas/direct_property/Driver').Driver;
    const Skil = require('./schemas/direct_property/Skil').Skil;

    const p = new Car();
    p.id = 1;
    p.producer = 'Volvo';
    p.drivers = [new Driver(), new Driver()];
    p.drivers[0].age = 18;
    p.drivers[0].nickName = 'Bert';
    p.drivers[0].skill = new Skil();
    p.drivers[1].age = 21;
    p.drivers[1].nickName = 'Runny';
    p.drivers[1].skill = new Skil();


    const entityDef = registry.getEntityRefByName('Car');
    const entityWithEmbedded: any = entityDef.build(JSON.parse(JSON.stringify(p)), {skipClassNamespaceInfo: true});
    expect(entityWithEmbedded).to.deep.eq(p);

  }

}

