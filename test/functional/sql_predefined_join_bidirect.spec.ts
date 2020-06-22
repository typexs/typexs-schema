import {inspect} from 'util';
process.env['SQL_LOG'] = 'X';
import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';

import {TestHelper} from './TestHelper';

import {TEST_STORAGE_OPTIONS} from './config';
import {TypeOrmConnectionWrapper} from '@typexs/base';
// import {Permission} from "./schemas/role_permissions/Permission";
// import {ContentHolder} from "./schemas/join/ContentHolder";


@suite('functional/sql_predefined_join_bidirect')
class SqlSchemaPredefinedJoinBidirectSpec {


  before() {
    TestHelper.resetTypeorm();
  }


  @test
  async 'E-P-E[] over predefined join tables'() {
    const Role = require('./schemas/role_permissions/Role').Role;
    const Permission = require('./schemas/role_permissions/Permission').Permission;

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'role_permissions';

    // let schema = EntityRegistry.$().getSchemaDefByName(options.name);

    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect() as TypeOrmConnectionWrapper;

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members([
      'role',
      'r_belongsto_2',
      'permission'
    ]);

    const cols = await c.connection.query('PRAGMA table_info(\'r_belongsto_2\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id',
      'ownertab', 'ownerid',
      'reftab',
      'refid',
      'sort',
      'updated_at'
    ]);

    const perm01 = new Permission();
    perm01.type = 'single';
    perm01.module = 'duo';
    perm01.disabled = false;
    perm01.permission = 'allow everything';

    const perm02 = new Permission();
    perm02.type = 'single';
    perm02.module = 'duo';
    perm02.disabled = false;
    perm02.permission = 'allow everything else';

    const role = new Role();
    role.displayName = 'Admin';
    role.permissions = [perm01, perm02];
    role.rolename = 'admin';
    role.disabled = false;

    await xsem.save(role);

    const roles = await xsem.find(Role);
    expect(roles).to.have.length(1);

    const permissions: any[] = await xsem.find<any>(Permission);
    expect(permissions).to.have.length(2);
    expect(permissions[0].roles).to.have.length(1);
    expect(permissions[0].roles[0].rolename).to.be.eq('admin');
    expect(permissions[1].roles).to.have.length(1);
    expect(permissions[1].roles[0].rolename).to.be.eq('admin');
    expect(permissions[0].roles[0].permissions).not.to.exist;
    expect(permissions[1].roles[0].permissions).not.to.exist;


    const results = await c.connection.query('SELECT * FROM r_belongsto_2;');
    expect(results).to.have.length(2);

    await c.close();
  }


  @test
  async 'E-P-E[] over predefined join tables - save empty'() {
    const Role = require('./schemas/role_permissions/Role').Role;
    const Permission = require('./schemas/role_permissions/Permission').Permission;

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'role_permissions';

    // let schema = EntityRegistry.$().getSchemaDefByName(options.name);

    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect() as TypeOrmConnectionWrapper;


    // create empty role
    const emptyRoleBefore = new Role();
    emptyRoleBefore.displayName = 'emptyRoleBefore';
    emptyRoleBefore.permissions = [];
    emptyRoleBefore.rolename = 'emptyRoleBefore';
    emptyRoleBefore.disabled = false;
    await xsem.save(emptyRoleBefore);


    const roles = await xsem.find(Role) as any[];
    expect(roles).to.have.length(1);
    expect(roles[0].permissions).to.be.empty;


    const results = await c.connection.query('SELECT * FROM r_belongsto_2;');
    expect(results).to.have.length(0);

    await c.close();
  }


  @test
  async 'E-P-E[] over predefined join tables - correct ordered'() {
    const Role = require('./schemas/role_permissions/Role').Role;
    const Permission = require('./schemas/role_permissions/Permission').Permission;

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'role_permissions';

    // let schema = EntityRegistry.$().getSchemaDefByName(options.name);

    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect()  as TypeOrmConnectionWrapper;


    // create empty role
    const emptyRoleBefore = new Role();
    emptyRoleBefore.displayName = 'emptyRoleBefore';
    emptyRoleBefore.permissions = [];
    emptyRoleBefore.rolename = 'emptyRoleBefore';
    emptyRoleBefore.disabled = false;
    await xsem.save(emptyRoleBefore);

    const perm01 = new Permission();
    perm01.type = 'single';
    perm01.module = 'duo';
    perm01.disabled = false;
    perm01.permission = 'allow everything';

    const roleWithPerm = new Role();
    roleWithPerm.displayName = 'roleWithPerm';
    roleWithPerm.permissions = [perm01];
    roleWithPerm.rolename = 'roleWithPerm';
    roleWithPerm.disabled = false;
    await xsem.save(roleWithPerm);

    const roles = await xsem.find(Role) as any[];
    expect(roles).to.have.length(2);
    expect(roles[0].permissions).to.be.empty;


    const results = await c.connection.query('SELECT * FROM r_belongsto_2;');
    expect(results).to.have.length(1);

    await c.close();
  }

  @test
  async 'update E-P-E[] over predefined join tables'() {
    const Role = require('./schemas/role_permissions/Role').Role;
    const Permission = require('./schemas/role_permissions/Permission').Permission;

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'role_permissions';


    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const perm01 = new Permission();
    perm01.type = 'single';
    perm01.module = 'duo';
    perm01.disabled = false;
    perm01.permission = 'allow everything';

    const perm02 = new Permission();
    perm02.type = 'single';
    perm02.module = 'duo';
    perm02.disabled = false;
    perm02.permission = 'allow everything else';

    const perm03 = new Permission();
    perm03.type = 'single';
    perm03.module = 'duo';
    perm03.disabled = false;
    perm03.permission = 'allow everything but this';

    let role = new Role();
    role.displayName = 'Admin';
    role.permissions = [perm01, perm02];
    role.rolename = 'admin';
    role.disabled = false;

    await xsem.save(role);
    let roles = await xsem.find(Role);
    expect(roles).to.have.length(1);
    let results = await c.connection.query('SELECT * FROM r_belongsto_2;');
    expect(results).to.have.length(2);


    // save the fetched again
    role = roles.shift();
    await xsem.save(role);
    roles = await xsem.find(Role);
    expect(roles).to.have.length(1);
    results = await c.connection.query('SELECT * FROM r_belongsto_2;');
    expect(results).to.have.length(2);


    // should happen nothing
    role.permissions = null;
    await xsem.save(role);
    roles = await xsem.find(Role);
    expect(roles).to.have.length(1);
    results = await c.connection.query('SELECT * FROM r_belongsto_2;');
    expect(results).to.have.length(2);


    // add new permission
    role = roles.shift();
    role.permissions.push(perm03);
    await xsem.save(role);
    roles = await xsem.find(Role);
    expect(roles).to.have.length(1);
    results = await c.connection.query('SELECT * FROM r_belongsto_2;');
    expect(results).to.have.length(3);


    // remove permission
    role = roles.shift();
    role.permissions.shift();
    await xsem.save(role);
    roles = await xsem.find(Role);
    expect(roles).to.have.length(1);
    results = await c.connection.query('SELECT * FROM r_belongsto_2;');
    expect(results).to.have.length(2);


    // should remove relation
    role.permissions = [];
    await xsem.save(role);
    results = await c.connection.query('SELECT * FROM r_belongsto_2;');
    expect(results).to.have.length(0);


    await c.close();

  }


  @test
  async 'create E-P-O[] over predefined join tables'() {
    const ContentHolder = require('./schemas/join/ContentHolder').ContentHolder;
    const Content = require('./schemas/join/Content').Content;
    const CotnentRef = require('./schemas/join/ContentRef').ContentRef;

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'join';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['r_blobs', 'blobs', 'content_holder']);

    const cols = await c.connection.query('PRAGMA table_info(\'r_blobs\')');
    expect(_.map(cols, t => t.name)).to.have.members(['rblobid', 'table_name', 'table_id', 'blobid']);


    const ch01 = new ContentHolder();
    ch01.value = 'Hallo';

    const c01 = new Content();
    c01.text = 'halo';
    ch01.contents = [c01];

    const s = await xsem.save(ch01);

    expect(s).to.deep.eq({
      value: 'Hallo',
      contents: [{text: 'halo', blobid: 1}],
      '$state': {isValidated: true, isSuccessValidated: true},
      id: 1
    });

    const tContentHolder: any[] = await c.connection.query('SELECT * FROM content_holder;');

    expect(tContentHolder).to.deep.eq([{id: 1, value: 'Hallo'}]);
    const tBlobs: any[] = await c.connection.query('SELECT * FROM blobs;');

    expect(tBlobs).to.deep.eq([{blobid: 1, text: 'halo'}]);
    const tRBlobs: any[] = await c.connection.query('SELECT * FROM r_blobs;');
    expect(tRBlobs).to.deep.eq([{rblobid: 1, table_name: 'content_holder', table_id: 1, blobid: 1}]);


    const f = await xsem.find(ContentHolder, {id: 1});
    const f01 = f[0];
    expect(f01).to.deep.eq({
      value: 'Hallo',
      contents: [{text: 'halo', blobid: 1}],
      id: 1
    });

    await c.close();

  }

}
