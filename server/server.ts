import http from "http";

export const start = (config) => {
  http
    .createServer(config.handleHttp)
    .listen(config.port, config.onServerListen);
};
