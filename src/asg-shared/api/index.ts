import { random } from "lodash";

let ENV = process.env.NODE_ENV;
let APIRoot =
  ENV == "development"
    ? "https://localhost:8787"
    : "https://asg-test.zapteck.workers.dev";

console.log("APIRoot", APIRoot);

let dev = process.env.STRIPE_PUBLISHABLE_KEY_DEV;
let prod = process.env.STRIPE_PUBLISHABLE_KEY_PROD;

export const STRIPE_PUBLISHABLE_KEY = ENV == "development" ? dev : prod;

export class API {
  async call(config) {
    let authToken = localStorage.getItem("authToken");
    let headers;
    if (authToken) {
      headers = new Headers({
        Authorization: `Bearer ${authToken}`,
      });
    }

    if (typeof config.body == "object") {
      config.body = JSON.stringify(config.body);
    }

    config.url =
      config.url.indexOf(APIRoot) < 0 ? APIRoot + config.url : config.url;

    let fetchConfig = {
      ...config,
      headers,
    };

    let res, resJson;
    try {
      res = await fetch(config.url, fetchConfig);
      resJson = await res.json();
      console.log("[API]", resJson);
      return resJson;
    } catch (e) {
      console.log("[API]", e);
      return { status: "fail" };
    }
  }
}

export const tokenAPI = async (token) => {
  let config = {
    url: "/token",
    method: "POST",
    body: token,
  };

  let res = await new API().call(config);
  return res;
};

export const test404API = async () => {
  let config = {
    url: "/asdf",
  };

  let res = await new API().call(config);
  return res;
};

export const disconnectAPI = async () => {
  let config = {
    url: "/disconnect",
  };

  let res = await new API().call(config);
  return res;
};

export const loginAPI = async (creds) => {
  let config = {
    url: "/login",
    method: "POST",
    body: { creds },
  };

  let res = await new API().call(config);
  return res;
};

export const signupAPI = async (user) => {
  let config = {
    url: "/signup",
    method: "POST",
    body: user,
  };

  let res = await new API().call(config);
  return res;
};

export const getWatchUrlAPI = async () => {
  let res = await new API().call({ url: "/watch" });
  return res.data.watch;
};

export const getPublishUrlAPI = async () => {
  let res = await new API().call({ url: "/stream" });
  return res.data.publish;
};

export const getChatsAPI = async (lastId) => {
  let query = "?date=" + lastId;
  let config = { url: "/messages" + query };
  let res = await new API().call(config);
  return res;
};

export const sendChatAPI = async (message) => {
  let config = {
    url: "/messages",
    method: "POST",
    body: { message },
  };

  let res = await new API().call(config);
  return res;
};

export const sendTipAPI = async (amount) => {
  let config = {
    url: "/tips",
    method: "POST",
    body: amount,
  };

  let res = await new API().call(config);
  return res;
};

export const addFundsAPI = async (amount) => {
  let config = {
    url: "/funds",
    method: "POST",
    body: amount,
  };

  let res = await new API().call(config);
  return res;
};

export const getPaymentMethodsAPI = async () => {
  let config = {
    url: "/payment-methods",
  };

  let res = await new API().call(config);
  return res;
};
