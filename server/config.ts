import { validateAuthHeader } from "./utils/auth";

import sqlite from "sqlite-sync";

const db = sqlite.connect("./database.db");

export const routes = "./routes";

export const defaults = {
  moduleName: "home",
  db,
};

export const authMethod = validateAuthHeader;

export const authList = ["contacts"];

let auth = (router) => {
  // console.log("[auth] start");
  let shouldAuth = router.authList.indexOf(router.moduleName) > -1;
  if (shouldAuth) {
    console.log("[auth] should");
    if (!router.authMethod) {
      console.log("[auth] no authMethod defined");
    }
    let auth = router.authMethod(router.req.headers);
    if (!auth) {
      router.response(router.defaultCodes.UNAUTHORIZED);
      return false;
    }
    return true;
  }
  console.log("[auth] No auth needed.");
  return true;
};

export const middleware = [auth];
