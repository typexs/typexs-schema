import {IMiddleware, K_ROUTE_CONTROLLER} from "typexs-server";
import {ROUTE} from "typexs-server/types";
import {IApplication} from "typexs-server/libs/server/IApplication";
import {RoutingControllersOptions, Action} from 'routing-controllers';

// TODO move this to typexs-server
export class AuthCheckerFallback implements IMiddleware {
  validate(cfg: any): boolean {
    return true;
  };


  extendOptions(usedAppOptions: ROUTE): void {
    if (usedAppOptions.type == K_ROUTE_CONTROLLER) {
      if (!(<RoutingControllersOptions>usedAppOptions).authorizationChecker) {
        (<RoutingControllersOptions>usedAppOptions).authorizationChecker = (action: Action, roles: any[]) => {
          return true;
        }
      }
      if (!(<RoutingControllersOptions>usedAppOptions).currentUserChecker) {
        (<RoutingControllersOptions>usedAppOptions).currentUserChecker = (action: Action) => {
          return null;
        }
      }
    }
  }

  use(app: IApplication): void {

  }

}
