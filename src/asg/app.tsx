import React, { useEffect, useRef, useState } from "react";
import { loginAPI, tokenAPI } from "../asg-shared/api";
import { WHEP, WHIP } from "../asg-shared/webrtc";
import { Video } from "../asg-shared/video";
import { LoginUI, SignupUI } from "../asg-shared/auth";
import { WebSocketChat } from "../asg-shared/websocket-chat";

import WS from "../asg-shared/websocket/websocket";

const whip = new WHIP();
const whep = new WHEP();

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
    let { username } = user;

    // TODO: generate a new room ID when the live session starts
    // this.storage.deleteAll() to delete the old room?

    let PROD = process.env.NODE_ENV == "production";
    let host = PROD ? "asg-live.zapteck.workers.dev" : "localhost:9000";

    let room = PROD
      ? "f90eacab58705de980a4e51d25d41fdf1c9d1121ecda877e810d1cecfac157af"
      : "8d93923a4a41daf7b7885aacff1371bda08136a64759ac13a4d696eaa2053d24";

    let url = `wss://${host}/api/room/${room}/websocket`;

    let config = {
      url,
      events: {
        open: (ws, event) => {
          let data = { name: username };
          // console.debug("[WS]", "open", event);
          setTimeout(() => {
            // console.debug("[WS]", "join the room", ws);
            ws.send(data); // Join the room
          }, 500);
        },
        close: (ws, event) => {
          console.log("[WS]", "close", event);
        },
        error: (ws, event) => {
          console.log("[WS]", "error", event);
        },
        message: (ws, event) => {
          let json = ws.receive(event.data);

          if (json.live && user.type != "stream") {
            setTimeout(() => {
              window.location.reload();
            }, 5000);
          }

          if (json.joined) {
            chatRef.current.newMembers(json);
          }

          if (json.quit) {
            chatRef.current.removeMembers(json);
          }

          if (json.message) {
            chatRef.current.newChat(json);
          }
        },
      },
    };

    webSocket.current = new WS(config);
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
    // localStorage.removeItem("chats");
    authUser();

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
    // console.debug("[UseEffect] User changed", user);

    initWebSocket();
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
          {/* <Chat ref={chatRef} user={user} whip={whip} videoRef={videoRef} /> */}
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
