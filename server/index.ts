import { Router } from "./router";
import { start } from "./server";
import * as config from "./config";

const port = process.env.PORT || 3000;

let handleHttp = async (req, res) => {
  let api = new Router(req, res, config);
  await api.route();
};

let onServerListen = () => {
  console.log("[Server]");
  console.log("[Server] \x1b[34m" + `http://localhost:${port}` + "\x1b[0m");
};

start({ handleHttp, port, onServerListen });
