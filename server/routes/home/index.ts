import { Router } from "../../router";
import { clientError, ok } from "../../utils/response";

export class Home {
  get = (router: Router) => {
    return ok({ status: "Ok" });
  };
}
