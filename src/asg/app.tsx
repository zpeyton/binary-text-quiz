import {
  React,
  useEffect,
  useRef,
  useState,
  WS,
  Routes,
  whip,
  whep,
  Video,
  LoginUI,
  SignupUI,
  WebSocketChat,
  PRODUCTION,
  checkBundleUpdate,
  logout,
} from "../asg-shared";

export const App = (props) => {
  console.debug("[Video] App render");
  let [webSocketHost, setWebSocketHost] = useState<any>(props.webSocketHost);
  let [user, setUser] = useState<any>({});
  let [loadDate, setLoadDate] = useState<any>(new Date());
  let [video, setVideo] = useState(false);
  let [loginNotice, setLoginNotice] = useState<any>("");
  let [signupNotice, setSignupNotice] = useState<any>("Become a member");
  let videoRef = useRef<HTMLVideoElement>();
  let chatRef = useRef<any>();
  let webSocket = useRef<any>();

  let cleanupStreamClient = async () => {
    whip.client?.peerConnection?.close();

    if (whip.client?.disconnectStream) {
      await whip.client?.disconnectStream();
    }
  };

  let initWebSocket = async () => {
    let reload = await checkBundleUpdate(loadDate);
    if (reload) {
      return;
    }

    let open = async (ws, event) => {
      // console.debug("[WS]", "open", event);
      let reload = await checkBundleUpdate(loadDate);
      if (reload) {
        return;
      }
      ws.api.Auth.send(ws);
    };

    let message = async (ws, event) => {
      // let reload = await checkBundleUpdate(loadDate);
      // if (reload) {
      //   return;
      // }

      let response = await ws.receive(event.data);

      if (!response.request) {
        console.log("Missing request path");
        return;
      }

      let handler = ws.api[response.request.path];

      await handler.receive({ ws, response });
    };

    let close = async (ws, event) => {
      console.log("[WS]", "close", event);
      if (chatRef?.current) {
        chatRef.current.serverDisconnected();
      }
      await new Promise(async (r) => {
        let interval = setInterval(async (a) => {
          try {
            let checkServer = await fetch(`https://${webSocketHost}/`);
            if (checkServer) {
              clearInterval(interval);
              r(true);
            }
          } catch (e) {}
        }, 20000);
      });

      window.location.reload();
    };

    let error = (ws, event) => {
      console.log("[WS]", "error", event);
    };

    let webSocketConfig = {
      url: `wss://${webSocketHost}/`,
      events: { open, message, close, error },
    };

    webSocket.current = new WS(webSocketConfig);

    let routes = new Routes(webSocket.current);

    let authToken = localStorage.getItem("authToken");
    webSocket.current.authToken = authToken;

    webSocket.current.api = routes;

    webSocket.current.setState({
      setUser,
      setLoginNotice,
      setSignupNotice,
      cleanupStreamClient,
      whep,
    });

    window.addEventListener("pagehide", async function (event) {
      event.stopPropagation();
      event.preventDefault();

      // console.log("pagehide");
      webSocket.current.ws.close(1000, "Logged Out");
      // console.log("webSocket readyState", webSocket.current.ws.readyState);
    });

    console.debug("[initWebsocket] set window events");
    window.addEventListener("focus", async (event) => {
      checkBundleUpdate(loadDate);
    });

    window.addEventListener("unload", function (event) {
      event.stopPropagation();
      event.preventDefault();

      console.debug("unload");
      webSocket.current.ws.close(1000, "Logged Out");
      // console.log("webSocket readyState", webSocket.current.ws.readyState);
    });
  };

  useEffect(() => {
    // console.log("[UseEffect] APP");
    initWebSocket();
  }, []);

  useEffect(() => {
    if (!user.type) {
      return;
    }
    console.debug("[UseEffect] User changed", user);

    let authToken = localStorage.getItem("authToken");
    webSocket.current.authToken = authToken;

    webSocket.current.setState({
      user,
      loginNotice,
      chatRef,
      videoRef,
    });
  }, [user]);

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
          {user.type == "member" || user.type == "stream" ? (
            <>
              <a
                onClick={(event) => {
                  event.preventDefault();
                  logout();
                }}
                href="#"
                className="login"
              >
                Logout
              </a>
            </>
          ) : (
            <>
              {!loginNotice ? (
                <>
                  <a
                    onClick={(event) => {
                      event.preventDefault();
                      setLoginNotice("Login");
                    }}
                    className="login"
                  >
                    Login / Sign up
                  </a>
                </>
              ) : null}
            </>
          )}

          <Video
            user={user}
            whip={whip}
            whep={whep}
            video={video}
            videoRef={videoRef}
            chatRef={chatRef}
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
