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
} from "../asg-shared";

export const App = (props) => {
  console.debug("[Video] App render");
  let [host, setHost] = useState<any>(props.host);
  let [user, setUser] = useState<any>({});
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

  let initWebSocket = () => {
    let webSocketConfig = {
      url: `wss://${host}/`,
      events: {
        open: async (ws, event) => {
          // console.debug("[WS]", "open", event);
          ws.api.Auth.send(ws);
        },
        message: async (ws, event) => {
          let response = await ws.receive(event.data);

          if (!response.request) {
            console.log("Missing request path");
            return;
          }

          let handler = ws.api[response.request.path];

          await handler.receive({ ws, response });
        },
        close: async (ws, event) => {
          console.log("[WS]", "close", event);
          if (chatRef?.current) {
            chatRef.current.serverDisconnected();
          }
          await new Promise(async (r) => {
            let interval = setInterval(async (a) => {
              try {
                let checkServer = await fetch(`https://${host}/`);
                if (checkServer) {
                  clearInterval(interval);
                  r(true);
                }
              } catch (e) {}
            }, 20000);
          });

          window.location.reload();
        },
        error: (ws, event) => {
          console.log("[WS]", "error", event);
        },
      },
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
    });

    window.addEventListener("pagehide", async function (event) {
      event.stopPropagation();
      event.preventDefault();

      // console.log("pagehide");
      webSocket.current.ws.close(1000, "Logged Out");
      // console.log("webSocket readyState", webSocket.current.ws.readyState);
    });

    window.addEventListener("unload", function (event) {
      event.stopPropagation();
      event.preventDefault();

      console.log("unload");
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
          {user.type == "guest" && !loginNotice ? (
            <>
              <a
                onClick={() => {
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
