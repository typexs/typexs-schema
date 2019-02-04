import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityRegistry} from "../../src";
import * as _ from 'lodash';


@suite('functional/entity_transformations')
class Entity_transformationsSpec {


  @test
  async 'simple transformations'() {
    require('./schemas/default/Author');
    let registry = EntityRegistry.$();
    let data = {id: 1, lastName: 'Engels', firstName: 'Friedrich'};
    let entityDef = registry.getEntityRefByName('author');
    let author = entityDef.build(data);
    expect(author).to.deep.eq(data);
  }


  @test
  async 'array transformations'() {
    let Permission = require('./schemas/role_permissions/Permission').Permission;
    let Role = require('./schemas/role_permissions/Role').Role;
    let p = new Permission();
    p.id = 1;
    p.permission = 'permission;)';
    p.roles = [{id: 1, rolename: 'role1'}, {id: 2, rolename: 'role2'}];
    let registry = EntityRegistry.$();
    let entityDef = registry.getEntityRefByName('Permission');
    let permission: any = entityDef.build(p);
    expect(_.isArray(permission.roles)).to.be.true;
    expect(permission.roles).to.have.length(2);
  }

  @test
  async 'boolean transformations'() {
    let Permission = require('./schemas/role_permissions/Permission').Permission;
    let Role = require('./schemas/role_permissions/Role').Role;
    let p = new Permission();
    p.id = 1;
    p.disabled = false;
    p.permission = 'permission;)';
    p.roles = [{id: 1, rolename: 'role1'}, {id: 2, rolename: 'role2'}];
    let registry = EntityRegistry.$();
    let entityDef = registry.getEntityRefByName('Permission');
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
    let EntityWithEmbedded = require('./schemas/embedded/EntityWithEmbedded').EntityWithEmbedded;
    let EmbeddedSubObject = require('./schemas/embedded/EmbeddedSubObject').EmbeddedSubObject;
    let EmbeddedObject = require('./schemas/embedded/EmbeddedObject').EmbeddedObject;

    let p = new EntityWithEmbedded();
    p.id = 2;
    p.obj = new EmbeddedObject();
    p.obj.inner = new EmbeddedSubObject();
    p.obj.innerName = 'test';
    p.obj.inner.subName = 'test2';
    p.obj.inner.SubOtherVar = 1;


    let registry = EntityRegistry.$();
    let entityDef = registry.getEntityRefByName('EntityWithEmbedded');
    let entityWithEmbedded: any = entityDef.build(JSON.parse(JSON.stringify(p)));
    expect(entityWithEmbedded).to.deep.eq(p);

  }

  @test
  async 'entity with multiple object integration'() {
    let Car = require('./schemas/direct_property/Car').Car;
    let Driver = require('./schemas/direct_property/Driver').Driver;
    let Skil = require('./schemas/direct_property/Skil').Skil;

    let p = new Car();
    p.id = 1;
    p.producer = 'Volvo';
    p.drivers = [new Driver(),new Driver()];
    p.drivers[0].age = 18;
    p.drivers[0].nickName = 'Bert';
    p.drivers[0].skill = new Skil();
    p.drivers[1].age = 21;
    p.drivers[1].nickName = 'Runny';
    p.drivers[1].skill = new Skil();



    let registry = EntityRegistry.$();
    let entityDef = registry.getEntityRefByName('Car');
    let entityWithEmbedded: any = entityDef.build(JSON.parse(JSON.stringify(p)));
    expect(entityWithEmbedded).to.deep.eq(p);
    console.log(entityWithEmbedded)

  }

}

