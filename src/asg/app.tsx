import React, { useEffect, useRef, useState } from "react";
import { loginAPI, tokenAPI } from "../asg-shared/api";
import { WHEP, WHIP } from "../asg-shared/webrtc";
import { Video } from "../asg-shared/video";
import { LoginUI, SignupUI } from "../asg-shared/auth";
import { WebSocketChat } from "../asg-shared/websocket-chat";

import WS from "../asg-shared/websocket/websocket";

const whip = new WHIP();
const whep = new WHEP();

let PROD = process.env.NODE_ENV == "production";
let host = PROD ? "asg-live.zapteck.workers.dev" : "localhost:9000";

let websocketUrl = `wss://${host}/`;

let webSocketConfig = {
  url: websocketUrl,
  events: {},
};

class Auth {
  async send(ws) {
    let authToken = localStorage.getItem("authToken");
    let request = {
      method: "post",
      path: "Auth",
      headers: { Authorization: authToken },
    };

    await ws.send(request);
  }

  async receive(props) {
    let { setUser, cleanupStreamClient } = props;
    let { status } = props.response;
    let { user } = props.response.data;

    if (status == "fail") {
      props.setLoginNotice("Login");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setUser({});
      await cleanupStreamClient();
      return;
    }

    setUser(user);

    return;
  }
}

class Chat {
  async receive(props) {
    console.log("[Route.Chat]", props);
    let { data } = props.response;
    props.chatRef.current.newChat(data);
  }
}

class User {
  async receive(props) {
    let { response, chatRef } = props;
    let { joined, quit, user } = response.data;
    let { current: chat } = chatRef;

    if (joined) {
      chat.newMembers(response.data);
    }

    if (quit) {
      chat.removeMembers(response.data);
    }
  }
}

class VideoRoute {
  async receive(props) {
    let { live } = props.response.data;
    if (live && props.user.type != "stream") {
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  }
}

class Routes {
  Auth = new Auth();
  User = new User();
  Chat = new Chat();
  Video = new VideoRoute();
}

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

        let handler = new Routes()[response.request.path];

        let props = {
          ws,
          response,
          user,
          setUser,
          loginNotice,
          setLoginNotice,
          cleanupStreamClient,
          chatRef,
          videoRef,
        };

        let result = await handler.receive(props);

        console.log("handler result", result);

        return;

        // if (json.live && user.type != "stream") {
        //   setTimeout(() => {
        //     window.location.reload();
        //   }, 5000);
        // }

        // if (json.joined) {
        //   chatRef.current.newMembers(json);
        // }

        // if (json.quit) {
        //   chatRef.current.removeMembers(json);
        // }

        // if (json.message) {
        //   chatRef.current.newChat(json);
        // }
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
  }, [user]);

  // console.debug("App render");

  return (
    <div className="page">
      {user.type == "stream" ? null : (
        <>
          {loginNotice ? (
            <>
              <div className="waiting">
                <LoginUI notice={loginNotice} authUser={authUser} />
                <SignupUI notice={signupNotice} authUser={authUser} />
              </div>
            </>
          ) : null}
        </>
      )}
      {user.type ? (
        <>
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
