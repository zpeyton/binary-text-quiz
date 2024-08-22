import { Router } from "../../router";
import { clientError, ok } from "../../utils/response";

export class Auth {
  post = async (router: Router) => {
    let postBody: any = {};
    try {
      postBody = JSON.parse(router.req.body);
    } catch (e) {
      router.log(e);
    }

    let { username, password } = postBody;

    if (!username || !password) {
      return clientError({
        status: "fail",
        message: "Missing required username or password",
        data: router.urlParams,
      });
    }

    let validUser = password == process.env.PASSWORD;

    let token;

    if (validUser) {
      token = process.env.TOKEN;
      return ok({ token, db: router.defaults.db });
    }

    return clientError({
      status: "fail",
      message: "Incorrect Username or password",
    });
  };

  put = async (router: Router) => {
    // logout
    return ok({});
  };
}
