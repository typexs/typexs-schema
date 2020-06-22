import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {MultipleTypes} from './schemas/reflection/MultipleTypes';
import 'reflect-metadata';
import {NoEntity} from './schemas/reflection/NoEntity';
import {SomeEntity} from './schemas/reflection/SomeEntity';
import {EntityRegistry} from '../../src/libs/EntityRegistry';

@suite('functional/property_reflection')
class PropertyReflectionSpec {


  @test
  'detect property types by reflection'() {
    const registry = EntityRegistry.$();
    const regEntityDef = registry.getEntityRefFor(MultipleTypes);
    expect(regEntityDef.getPropertyRefs()).to.have.length(10);

    const pNumber = regEntityDef.getPropertyRef('number');
    expect(pNumber.dataType).to.be.eq('number');

    const pString = regEntityDef.getPropertyRef('string');
    expect(pString.dataType).to.be.eq('string');

    const pDate = regEntityDef.getPropertyRef('date');
    expect(pDate.dataType).to.be.eq('date');

    const pBoolean = regEntityDef.getPropertyRef('boolean');
    expect(pBoolean.dataType).to.be.eq('boolean');

    const pNoEntity = regEntityDef.getPropertyRef('noEntity');
    expect(pNoEntity.dataType).to.be.undefined;
    expect(pNoEntity.getType()).to.be.eq('NoEntity');
    expect(pNoEntity.cardinality).to.be.eq(1);
    expect(pNoEntity.getTargetClass()).to.be.eq(NoEntity);

    const pNoEntitySe = regEntityDef.getPropertyRef('noEntitySe');
    expect(pNoEntitySe.dataType).to.be.undefined;
    expect(pNoEntitySe.getType()).to.be.eq('NoEntity');
    expect(pNoEntitySe.cardinality).to.be.eq(1);
    expect(pNoEntitySe.getTargetClass()).to.be.eq(NoEntity);

    const pNoEntityTh = regEntityDef.getPropertyRef('noEntityTh');
    expect(pNoEntityTh.dataType).to.be.undefined;
    expect(pNoEntityTh.getType()).to.be.eq('NoEntity');
    expect(pNoEntityTh.cardinality).to.be.eq(1);
    expect(pNoEntityTh.getTargetClass()).to.be.eq(NoEntity);

    const pSomeEntity = regEntityDef.getPropertyRef('someEntity');
    expect(pSomeEntity.dataType).to.be.undefined;
    expect(pSomeEntity.getType()).to.be.eq('SomeEntity');
    expect(pSomeEntity.cardinality).to.be.eq(1);
    expect(pSomeEntity.getTargetClass()).to.be.eq(SomeEntity);

    const pNoEntities = regEntityDef.getPropertyRef('noEntities');
    expect(pNoEntities.dataType).to.be.undefined;
    expect(pNoEntities.getType()).to.be.eq('NoEntity');
    expect(pNoEntities.cardinality).to.be.eq(0);
    expect(pNoEntities.getTargetClass()).to.be.eq(NoEntity);

    const pSomeEntities = regEntityDef.getPropertyRef('someEntities');
    expect(pSomeEntities.dataType).to.be.undefined;
    expect(pSomeEntities.getType()).to.be.eq('SomeEntity');
    expect(pSomeEntities.cardinality).to.be.eq(0);
    expect(pSomeEntities.getTargetClass()).to.be.eq(SomeEntity);
  }


}

