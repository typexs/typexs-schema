import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';

import * as _ from "lodash";
import {ClassRef, SchemaUtils} from "commons-schema-api";


@suite('functional/class_ref')
class Class_refSpec {

  @test
  async 'class name'() {
    class Abc {}
    let classRef = ClassRef.get(Abc);
    expect(classRef.className).to.be.eq('Abc');

    let fn = SchemaUtils.clazz('Def');
    classRef = ClassRef.get(fn);
    expect(classRef.className).to.be.eq('Def');

  }


  @test
  async 'placeholder '() {

    let classRef = ClassRef.get('Placeholder');
    expect(classRef.isPlaceholder).to.be.true;

    class Placeholder {

    }

    let classRef2 = ClassRef.get(Placeholder);
    expect(classRef).to.be.eq(classRef);
    expect(classRef2.isPlaceholder).to.be.false;

  }

}

