import React from "react";
import ReactDOM from "react-dom";
import { App } from "./app";
import "./styles.css";

let PROD = process.env.NODE_ENV == "production";
let host = PROD ? "asg-live.zapteck.workers.dev" : "localhost:9000";

ReactDOM.render(<App host={host} />, document.getElementById("main"));
