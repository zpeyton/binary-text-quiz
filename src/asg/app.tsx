import React, { useEffect, useRef, useState } from "react";
import { loginAPI, tokenAPI } from "../asg-shared/api";
import { WHEP, WHIP } from "../asg-shared/webrtc";
import { Video } from "../asg-shared/video";
import { LoginUI, SignupUI } from "../asg-shared/auth";
import { WebSocketChat } from "../asg-shared/websocket-chat";

import WS from "../asg-shared/websocket/websocket";
import { Routes } from "../asg-shared/routes";

const whip = new WHIP();
const whep = new WHEP();

let PROD = process.env.NODE_ENV == "production";
let host = PROD ? "asg-live.zapteck.workers.dev" : "localhost:9000";

let websocketUrl = `wss://${host}/`;

let webSocketConfig = {
  url: websocketUrl,
  events: {},
};

export const App = () => {
  let [user, setUser] = useState<any>({});
  let [video, setVideo] = useState(false);
  let [loginNotice, setLoginNotice] = useState<any>("");
  let [signupNotice, setSignupNotice] = useState<any>("");
  let videoRef = useRef<HTMLVideoElement>();
  let chatRef = useRef<any>();

  let webSocket = useRef<any>();

  let cleanupStreamClient = async () => {
    whip.client?.peerConnection?.close();

    if (whip.client?.disconnectStream) {
      await whip.client?.disconnectStream();
    }
  };

  let initWebSocket = () => {
    webSocketConfig.events = {
      open: async (ws, event) => {
        // console.debug("[WS]", "open", event);
        new Routes().Auth.send(ws);
      },
      close: (ws, event) => {
        console.log("[WS]", "close", event);
        window.location.reload();
      },
      error: (ws, event) => {
        console.log("[WS]", "error", event);
      },
      message: async (ws, event) => {
        let response = await ws.receive(event.data);

        if (!response.request) {
          console.log("Missing request path");
          return;
        }

        let handler = new Routes()[response.request.path];

        let result = await handler.receive({ ws, response });

        return;
      },
    };

    webSocket.current = new WS(webSocketConfig);
  };

  let authUser = async (creds?) => {
    // console.log("authUser");
    let auth_token = localStorage.getItem("authToken");
    let user = JSON.parse(localStorage.getItem("user") || "{}");
    if (auth_token) {
      // is token valid
      let validateToken = await tokenAPI({ auth_token });
      if (validateToken.status == "fail") {
        // console.log("authUser token check failed");
        setLoginNotice("Login Required - Token Expired");
        setUser({});
        await cleanupStreamClient();
        localStorage.setItem("authToken", "");
        return;
      }
      if (loginNotice) {
        setLoginNotice("");
      }
      localStorage.setItem("user", JSON.stringify(validateToken.data.user));
      // console.log("[WS][authToken] Valid setUser");
      setUser(validateToken.data.user);

      return;
    }

    if (!creds) {
      // console.log("Login");
      setLoginNotice("Login");
      setUser({});
      await cleanupStreamClient();
      return;
    }

    let { username, password } = creds;
    if (!username || !password) {
      setUser({});
      setLoginNotice("Login");
      return console.log("Missing creds");
    }

    let res = await loginAPI(creds);

    if (res.status == "fail") {
      setLoginNotice("Login Failed - Try again");
      return;
    }

    if (res.data.user) {
      localStorage.setItem("authToken", res.data.user.auth_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }

    setLoginNotice("");
    setUser(res.data.user);
    return true;
  };

  useEffect(() => {
    // console.log("[UseEffect] APP");

    initWebSocket();
    webSocket.current.setState({
      setUser,
      setLoginNotice,
      cleanupStreamClient,
    });

    window.addEventListener("pagehide", async function (event) {
      event.stopPropagation();
      event.preventDefault();

      // console.log("pagehide");
      webSocket.current.ws.close(1000, "Logged Out");
      // console.log("webSocket readyState", webSocket.current.ws.readyState);
    });
  }, []);

  useEffect(() => {
    if (!user.type) {
      return;
    }
    console.debug("[UseEffect] User changed", user);
    webSocket.current.setState({
      user,
      loginNotice,
      chatRef,
      videoRef,
    });
  }, [user]);

  // console.debug("App render");

  return (
    <div className="page">
      {user.type == "stream" ? null : (
        <>
          {loginNotice ? (
            <>
              <div className="waiting">
                <LoginUI notice={loginNotice} webSocket={webSocket} />
                <SignupUI notice={signupNotice} webSocket={webSocket} />
              </div>
            </>
          ) : null}
        </>
      )}

      {user.type ? (
        <>
          {user.type == "guest" && !loginNotice ? (
            <>
              <a
                onClick={() => {
                  setLoginNotice("Login");
                  setLoginNotice("Login");
                }}
                className="login"
              >
                Login / Sign up
              </a>
            </>
          ) : null}

          <Video
            user={user}
            whip={whip}
            whep={whep}
            video={video}
            videoRef={videoRef}
            setVideo={setVideo}
            webSocket={webSocket}
          />
          <WebSocketChat
            ref={chatRef}
            user={user}
            whip={whip}
            videoRef={videoRef}
            webSocket={webSocket}
          />
        </>
      ) : null}
    </div>
  );
};
