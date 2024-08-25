import { random } from "lodash";

let PROD = process.env.NODE_ENV == "production";
let APIRoot = PROD
  ? "https://asg-test.zapteck.workers.dev"
  : "https://localhost:8787";

console.log("APIRoot", APIRoot);

let dev = process.env.STRIPE_PUBLISHABLE_KEY_DEV;
let prod = process.env.STRIPE_PUBLISHABLE_KEY_PROD;

export const STRIPE_PUBLISHABLE_KEY = PROD ? prod : dev;

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
      console.log("[API] Call", resJson);
      if (resJson.message == "Server Error") {
        resJson.status = "500";
        alert(
          "Whoops. There was a problem with this request. We are working on it."
        );
      }

      return resJson;
    } catch (e) {
      console.log("[API] Error", fetchConfig, e);
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
  let query = "?offsetid=" + lastId;
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

export const getPaySessionAPI = async () => {
  let config = {
    url: "/pay-session",
  };

  let res = await new API().call(config);
  return res;
};

export const createPaymentAPI = async (body) => {
  let config = {
    url: "/pay-session",
    method: "POST",
    body,
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
