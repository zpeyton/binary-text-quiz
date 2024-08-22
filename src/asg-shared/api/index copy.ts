import { random } from "lodash";

let APIRoot =
  process.env.NODE_ENV == "development"
    ? "http://localhost:8787"
    : "https://asg-test.zapteck.workers.dev";

console.log("APIRoot", process.env.NODE_ENV, APIRoot);

export class API {
  async call(config) {
    let authToken = localStorage.getItem("authToken");
    let headers = new Headers({
      Authorization: `Bearer ${authToken}`,
    });

    if (typeof config.body == "object") {
      config.body = JSON.stringify(config.body);
    }

    config.url =
      config.url.indexOf(APIRoot) < 0 ? APIRoot + config.url : config.url;

    let fetchConfig = {
      ...config,
      headers,
    };

    let res = await fetch(config.url, fetchConfig);
    let resJson = await res.json();
    console.log("[API]", resJson);
    return resJson;
  }
}

export const getWatchUrlAPI = async () => {
  let res = await new API().call({ url: "/watch" });
  console.log("[getWatchUrlAPI]", res);
  return (res as any).data.watch;
};

export const getPublishUrlAPI = async () => {
  let res = await new API().call({ url: "/stream" });
  return res.data.publish;
};

export const getChatsAPI = async (lastId) => {
  let query = "?date=" + lastId;
  let res = await new API().call({ url: "/messages" + query });
  return res.data.messages;
  console.log("[getChatsAPI]", lastId);
  return await new Promise((resolve, reject) => {
    let interval = setTimeout(() => {
      // console.log("getChatsAPI");
      let mockDataWithRecord = [
        { id: 3, message: "Hello" + random(0, 10), user: "Zach" },
      ];

      let mockDataEmpty = [];
      let rand = random(0, 1);
      resolve(rand ? mockDataWithRecord : mockDataEmpty);
    }, 1000);
  });
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
