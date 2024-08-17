import { Router } from "../../router";
import { clientError, ok } from "../../utils/response";

export class Home {
  get = (router: Router) => {
    router.log("some log");
    return ok({ status: "Ok" });
  };
}
