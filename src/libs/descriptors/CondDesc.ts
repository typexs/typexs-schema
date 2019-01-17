import {IDesc} from "./IDesc";
import {AbstractCondDesc} from "./AbstractCondDesc";


export class CondDesc extends AbstractCondDesc implements IDesc {

  readonly type:string = 'cond';


}
