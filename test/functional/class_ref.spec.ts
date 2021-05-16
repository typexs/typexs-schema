import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {ClassRef, RegistryFactory, SchemaUtils} from '@allgemein/schema-api';

// TODO move to @allgemein/schema-api

@suite('functional/class_ref')
class ClassRefSpec {

  static after() {
    RegistryFactory.reset();
  }


  @test
  async 'class name'() {
    class Abc {
    }

    let classRef = ClassRef.get(Abc);
    expect(classRef.className).to.be.eq('Abc');

    const fn = SchemaUtils.clazz('Def');
    classRef = ClassRef.get(fn);
    expect(classRef.className).to.be.eq('Def');

  }


  @test
  async 'placeholder '() {

    const classRef = ClassRef.get('Placeholder');
    expect(classRef.isPlaceholder()).to.be.true;

    class Placeholder {

    }

    const classRef2 = ClassRef.get(Placeholder);
    expect(classRef).to.be.eq(classRef);
    expect(classRef2.isPlaceholder()).to.be.false;

  }

}

