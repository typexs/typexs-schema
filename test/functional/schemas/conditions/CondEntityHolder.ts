import {Schema} from '../../../../src/libs/decorators/Schema';
import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';

import {CondObjectContent} from './CondObjectContent';
import {Eq, Key} from '@allgemein/expressions';
import {Asc} from '../../../../src/libs/descriptors/OrderDesc';

@Schema({name: 'conditions'})
@Entity()
export class CondEntityHolder {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'number'})
  mynr: number;

  @Property({
    type: CondObjectContent, nullable: true, cardinality: 0,
    cond: Eq('somenr', Key('mynr')),
    order: Asc(Key('nickname'))
  })
  contents: CondObjectContent[];

}

