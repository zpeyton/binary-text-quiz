import React from "react";
import ReactDOM from "react-dom";
import { App } from "./app";
import "./styles.css";

let PROD = process.env.NODE_ENV == "production";
let webSocketHost = PROD ? "asg-live.zapteck.workers.dev" : "localhost:9000";

//alert(document.location.host);
if (document.location.host.includes("192.168.1")) {
  webSocketHost = document.location.host + ":9000";
}
// alert(webSocketHost);

ReactDOM.render(
  <App webSocketHost={webSocketHost} />,
  document.getElementById("main")
);
