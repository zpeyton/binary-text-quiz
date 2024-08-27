import WS from "./websocket";

export default class Chat {
  ws;
  config;

  constructor(config) {
    this.config = config;
    console.debug("[Chat]", "connect");
    this.ws = new WS(config);
    if (!config) {
      console.debug("[Chat]", "missing config");
      return;
    }
    if (config.chatInput) {
      this.init(config);
    }
  }

  init(config) {
    config.chatInput.addEventListener("keydown", (event) => {
      if (event.keyCode == 13) {
        console.debug("keydown", event.keyCode);

        let message = event.currentTarget.value;
        let json = { message };
        this.ws.send(json);

        event.currentTarget.value = "";
      }
    });

    config.chatInput.focus();
  }
}
