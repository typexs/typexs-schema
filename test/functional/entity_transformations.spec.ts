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
    let entityDef = registry.getEntityDefByName('author');
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
    let entityDef = registry.getEntityDefByName('Permission');
    let permission: any = entityDef.build(p);
    expect(_.isArray(permission.roles)).to.be.true;
    expect(permission.roles).to.have.length(2);
  }


}

