import React from "react";
import ReactDOM from "react-dom";
import { App } from "./app";
import "./styles.css";

let PROD = process.env.NODE_ENV == "production";
let webSocketHost = PROD ? "asg-live.zapteck.workers.dev" : "localhost:9000";

ReactDOM.render(
  <App webSocketHost={webSocketHost} />,
  document.getElementById("main")
);
