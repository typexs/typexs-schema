import {Book} from './Book';

import {Property} from '../../../../src/libs/decorators/Property';
import {PropertyOf} from '../../../../src/libs/decorators/PropertyOf';

/**
 * - first parameter must be the reference to an other entity (string|Class)
 * - second parameter must be the name of the property, it is also the name
 *   under which the property is attach in the entity by (defineProperty)
 */
@PropertyOf('summary', Book /*, {single_or_multiple}*/)
export class Summary {

  @Property({type: 'number'})
  size: number;

  @Property({type: 'string'})
  content: string;

}
