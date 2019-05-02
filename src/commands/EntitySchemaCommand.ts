import {ICommand} from "@typexs/base";

export class EntitySchemaCommand implements ICommand {
  readonly aliases: string = 'es';
  readonly command: string = 'entity-schema [op]';
  //readonly describe: string;


  beforeStorage(): void {
  }


  handler(argv: any): any {


  }


}
