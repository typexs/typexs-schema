import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';


import * as _ from 'lodash';
import {ValidPerson} from './schemas/validation/ValidPerson';
import {EntityRegistry} from '../../src';
import {DataContainer} from '@typexs/base';
import {TreeUtils, WalkValues} from 'commons-base';

const registry = EntityRegistry.$();

@suite('functional/data_container')
class DataContainerSpec {


  @test
  async 'check empty'() {
    const p = new ValidPerson();
    const c = new DataContainer(p, registry);
    const retCode = await c.validate();
    expect(retCode).to.be.false;
    expect(c.hasErrors()).to.be.true;
    expect(c.errors).to.have.length(3);
    expect(c.isSuccessValidated).to.be.false;
    expect(c.isValidated).to.be.true;
  }


  @test
  async 'half filled'() {
    const p = new ValidPerson();
    p.lastName = 'Blacky';
    const c = new DataContainer(p, registry);
    const retCode = await c.validate();
    expect(retCode).to.be.false;
    expect(c.hasErrors()).to.be.true;
    expect(c.errors).to.have.length(2);
    expect(c.isSuccessValidated).to.be.false;
    expect(c.isValidated).to.be.true;
  }


  @test
  async 'full filled'() {
    const p = new ValidPerson();
    p.firstName = 'Funny';
    p.lastName = 'Blacky';
    p.eMail = 'world@warcraft.tv';
    const c = new DataContainer(p, registry);
    const retCode = await c.validate();
    expect(retCode).to.be.true;
    expect(c.hasErrors()).to.be.false;
    expect(c.errors).to.have.length(0);
    expect(c.isSuccessValidated).to.be.true;
    expect(c.isValidated).to.be.true;
  }


  @test
  async 'dummy full filled'() {
    const regEntityDef = registry.getEntityRefFor('ValidPerson');
    const data = regEntityDef.toJson();
    const data_x = JSON.parse(JSON.stringify(data));

    TreeUtils.walk(data_x, (v: WalkValues) => {
      if (v.value === 'ValidPerson') {
        v.parent[v.key] = 'ValidPerson2';
      } else if (_.isString(v.value) && /valid_person/.test(v.value)) {
        v.parent[v.key] = v.value.replace('valid_person', 'valid_person_2');
      } else if (_.isFunction(v.value)) {
      }
    });
    data_x.machineName = 'valid_person_2';

    const entityDef2 = registry.fromJson(data_x);

    const p: any = entityDef2.create();
    p.firstName = 'Funny';
    p.lastName = 'Blacky';
    p.eMail = 'world@warcraft.tv';

    const c = new DataContainer(p, registry);
    const retCode = await c.validate();
    expect(retCode).to.be.true;
    expect(c.hasErrors()).to.be.false;
    expect(c.errors).to.have.length(0);
    expect(c.isSuccessValidated).to.be.true;
    expect(c.isValidated).to.be.true;
  }

}

