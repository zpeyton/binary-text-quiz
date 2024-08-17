import { validateAuthHeader } from "./utils/auth";

export const routes = "./routes";

export const defaults = {
  moduleName: "home",
};

export const authMethod = validateAuthHeader;

export const authList = ["contacts"];

let auth = (router) => {
  console.log("[auth] start");

  let shouldAuth = router.authList.indexOf(router.moduleName) > -1;
  if (shouldAuth) {
    console.log("[auth] should");
    if (!router.authMethod) {
      console.log("[auth] no authMethod defined");
    }
    console.log("[auth] run authmethod");
    let auth = router.authMethod(router.req.headers);
    if (!auth) {
      router.response(router.defaultCodes.UNAUTHORIZED);
      return false;
    }
    return true;
  }
  console.log("[auth] no auth");
  return true;
};

export const middleware = [auth];
