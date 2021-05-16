import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {MultipleTypesDeclared} from './schemas/conversion/MultipleTypesDeclared';
import {EmbeddedMultipleTypesDeclared} from './schemas/conversion/EmbeddedMultipleTypesDeclared';
import {ILookupRegistry, RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';

let registry: ILookupRegistry;

@suite('functional/conversion')
class ConversionSpec {


  static before() {
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  }

  // before() {
  //   registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  // }

  static after() {
    RegistryFactory.reset();
  }

  @test
  'check types json to object'() {
    const regEntityDef = registry.getEntityRefFor(MultipleTypesDeclared);

    const mt = new MultipleTypesDeclared();
    // empty
    const emptyObject = JSON.stringify(mt);
    const recreatedEmpty = regEntityDef.build(JSON.parse(emptyObject), {skipClassNamespaceInfo: true});

    // console.log(emptyObject, recreatedEmpty);
    expect(mt).to.deep.eq(recreatedEmpty);
    expect(recreatedEmpty).to.be.instanceOf(MultipleTypesDeclared);

    // number
    mt.number = 12345;
    const numberObject = JSON.stringify(mt);
    const recreatedNumber = regEntityDef.build(JSON.parse(numberObject), {skipClassNamespaceInfo: true}) as MultipleTypesDeclared;

    // console.log(numberObject, recreatedNumber);
    expect(mt).to.deep.eq(recreatedNumber);
    expect(recreatedNumber).to.be.instanceOf(MultipleTypesDeclared);
    expect(recreatedNumber.number).to.be.eq(mt.number);

    // boolean
    mt.boolean = true;
    const booleanObject = JSON.stringify(mt);
    const recreatedBoolean = regEntityDef.build(JSON.parse(booleanObject), {skipClassNamespaceInfo: true}) as MultipleTypesDeclared;

    // console.log(booleanObject, recreatedBoolean);
    expect(mt).to.deep.eq(recreatedBoolean);
    expect(recreatedBoolean).to.be.instanceOf(MultipleTypesDeclared);
    expect(recreatedBoolean.boolean).to.be.eq(mt.boolean);

    mt.boolean = false;
    const booleanObject2 = JSON.stringify(mt);
    const recreatedBoolean2 = regEntityDef.build(JSON.parse(booleanObject2), {skipClassNamespaceInfo: true}) as MultipleTypesDeclared;

    // console.log(booleanObject2, recreatedBoolean2);
    expect(mt).to.deep.eq(recreatedBoolean2);
    expect(recreatedBoolean2).to.be.instanceOf(MultipleTypesDeclared);
    expect(recreatedBoolean2.boolean).to.be.eq(mt.boolean);

    // string
    mt.string = 'this is a string';
    const strObject = JSON.stringify(mt);
    const recreatedString = regEntityDef.build(JSON.parse(strObject), {skipClassNamespaceInfo: true}) as MultipleTypesDeclared;

    // console.log(strObject, recreatedString);
    expect(mt).to.deep.eq(recreatedString);
    expect(recreatedString).to.be.instanceOf(MultipleTypesDeclared);
    expect(recreatedString.string).to.be.eq(mt.string);

    // date
    mt.date = new Date();
    const dateObject = JSON.stringify(mt);
    const recreatedDate = regEntityDef.build(JSON.parse(dateObject), {skipClassNamespaceInfo: true}) as MultipleTypesDeclared;

    // console.log(dateObject, recreatedDate);
    expect(mt).to.deep.eq(recreatedDate);
    expect(recreatedDate).to.be.instanceOf(MultipleTypesDeclared);
    expect(recreatedDate.date).to.be.instanceOf(Date);
    expect(recreatedDate.date.toISOString()).to.be.eq(mt.date.toISOString());

    // // date
    // mt.buffer = new Date();
    // const dateObject = JSON.stringify(mt);
    // const recreatedDate = regEntityDef.build(JSON.parse(dateObject)) as MultipleTypes;
    //
    // console.log(dateObject, recreatedDate);
    // expect(mt).to.deep.eq(recreatedDate);
    // expect(recreatedDate).to.be.instanceOf(MultipleTypes);
    // expect(recreatedDate.date).to.be.instanceOf(Date);
    // expect(recreatedDate.date.toISOString()).to.be.eq(mt.date.toISOString());

  }


  @test
  'check js types on embedded objects during json to object conversion'() {
    // const registry = EntityRegistry.$();
    const regEntityDef = registry.getEntityRefFor(EmbeddedMultipleTypesDeclared);
    const properties = regEntityDef.getPropertyRefs();
    expect(properties).to.have.length(3);

    const emt = new EmbeddedMultipleTypesDeclared();
    emt.object = new MultipleTypesDeclared();
    emt.object.number = 12345;
    emt.object.boolean = false;
    emt.object.string = 'this is a string';
    emt.object.date = new Date();
    // empty

    emt.objects = [
      new MultipleTypesDeclared()
    ];
    emt.objects[0].number = 12345;
    emt.objects[0].string = 'this is a string';
    emt.objects[0].date = new Date();
    emt.objects[0].boolean = true;

    const stringifiedObject = JSON.stringify(emt);
    const _sObject = JSON.parse(stringifiedObject);
    const recreatedObject = regEntityDef.build(_sObject, {skipClassNamespaceInfo: true}) as EmbeddedMultipleTypesDeclared;

    // console.log(stringifiedObject, recreatedObject);
    expect(recreatedObject).to.deep.eq(emt);
    expect(recreatedObject.object.date.toISOString()).to.be.eq(emt.object.date.toISOString());
    expect(recreatedObject.objects[0].date.toISOString()).to.be.eq(emt.objects[0].date.toISOString());

  }


}

