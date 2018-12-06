import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {IStorageOptions} from '@typexs/base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {getMetadataArgsStorage} from 'typeorm'
import {TestHelper} from "./TestHelper";
import {TEST_STORAGE_OPTIONS} from "./config";
import {EntityRegistry} from "../../src";
import {inspect} from "util";
import {Permission} from "./schemas/role_permissions/Permission";


@suite('functional/sql_schema_predefined_join_bidirect')
class Sql_schema_predefined_join_bidirectSpec {


  before() {
    TestHelper.resetTypeorm();


  }


  @test
  async 'create E-P-E[] over predefined join tables'() {
    const Role = require('./schemas/role_permissions/Role').Role;
    const Permission = require('./schemas/role_permissions/Permission').Permission;

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'role_permissions';

    //let schema = EntityRegistry.$().getSchemaDefByName(options.name);
    //console.log(inspect(schema.toJson(), false, 10));

    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members([
      "role",
      "r_belongsto_2",
      "permission"
    ]);

    let cols = await c.connection.query('PRAGMA table_info(\'r_belongsto_2\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id',
      'ownertab', 'ownerid',
      "reftab",
      "refid",
      "sort",
      "updated_at"
    ]);

    let perm01 = new Permission();
    perm01.type = 'single';
    perm01.module = 'duo';
    perm01.disabled = false;
    perm01.permission = 'allow everything';

    let perm02 = new Permission();
    perm02.type = 'single';
    perm02.module = 'duo';
    perm02.disabled = false;
    perm02.permission = 'allow everything else';

    let role = new Role();
    role.displayName = 'Admin';
    role.permissions = [perm01, perm02];
    role.rolename = 'admin';
    role.disabled = false;

    await xsem.save(role);

    let roles = await xsem.find(Role);
    expect(roles).to.have.length(1);

    let permissions: Permission[] = await xsem.find<Permission>(Permission);
    expect(permissions).to.have.length(2);
    expect(permissions[0].roles).to.have.length(1);
    expect(permissions[0].roles[0].rolename).to.be.eq('admin');
    expect(permissions[1].roles).to.have.length(1);
    expect(permissions[1].roles[0].rolename).to.be.eq('admin');
    expect(permissions[0].roles[0].permissions).not.to.exist;
    expect(permissions[1].roles[0].permissions).not.to.exist;


    let results = await c.connection.query('SELECT * FROM r_belongsto_2;');
    expect(results).to.have.length(2);

    await c.close();
  }

}

