export default class WS {
  ws;

  constructor(config) {
    if (!config || !config.url) {
      console.log("[WS]", "Missing WS URL");
      return;
    }

    // console.debug("[WS]", "connect");

    this.ws = new WebSocket(config.url);

    for (let i in config.events) {
      let eventName = i;
      let handler = config.events[i];
      let wrapHander = () => {
        handler(this, event);
      };

      this.ws.addEventListener(eventName, wrapHander);
    }
  }

  send(data) {
    // console.debug("[WS]", "send", data);
    let json = JSON.stringify(data);
    this.ws.send(json);
  }

  receive(data) {
    let json = JSON.parse(data);
    // console.debug("[WS]", "recieve", json);
    return json;
  }
}
