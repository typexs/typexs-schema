import {ICommand} from '@typexs/base';

/**
 * TODO develop command for cli schema output
 */
export class EntitySchemaCommand implements ICommand {
  readonly aliases: string = 'es';
  readonly command: string = 'entity-schema [op]';
  // readonly describe: string;


  beforeStorage(): void {
  }


  handler(argv: any): any {


  }


}
