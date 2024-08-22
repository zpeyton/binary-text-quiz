import React, { LegacyRef, useEffect, useRef, useState } from "react";
import WHEPClient from "../public/WHEPClient";
import WHIPClient from "../public/WHIPClient";
import {
  disconnectAPI,
  getChatsAPI,
  getPublishUrlAPI,
  getWatchUrlAPI,
  loginAPI,
  sendChatAPI,
  signupAPI,
  tokenAPI,
} from "../asg-shared/api";

export const App = () => {
  let [video, setVideo] = useState(false);
  let [chats, setChats] = useState<any>([]);
  let [user, setUser] = useState<any>({});
  let [client, setClient] = useState<any>({});
  let [loginNotice, setLoginNotice] = useState<any>("");
  let [signupNotice, setSignupNotice] = useState<any>("");
  let videoEl = useRef<HTMLVideoElement>();
  let inputChat = useRef<HTMLInputElement>();
  let btnSendChat = useRef<HTMLButtonElement>();
  let chatLog = useRef<HTMLDivElement>();

  let cleanupStreamClient = async () => {
    await (window as any).streamClient.peerConnection.close();
    if ((window as any).streamClient?.disconnectStream) {
      await (window as any).streamClient?.disconnectStream();
    }

    (window as any).streamClient = null;
  };
  window.onbeforeunload = async () => {
    console.log("onbeforeunload");
    await cleanupStreamClient();
    await disconnectAPI();
  };

  let authUser = async (creds?) => {
    let token = localStorage.getItem("authToken");
    let user = JSON.parse(localStorage.getItem("user") || "{}");
    if (token) {
      // is token valid
      let validateToken = await tokenAPI({ token });
      if (validateToken.status == "fail") {
        console.log("authUser token check failed");
        setLoginNotice("Login Required - Token Expired");
        setUser({});
        setVideo(false);
        await cleanupStreamClient();
        localStorage.setItem("authToken", "");
        return;
      }
      setLoginNotice("");
      setUser(user);
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
    //console.log(res, "set user");
    localStorage.setItem("authToken", res.data.user.auth_token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setLoginNotice("");
    setUser(res.data.user);
    return;
  };

  let setupWHIPClient = async () => {
    console.log("setupWHIPClient");
    let url = await getPublishUrlAPI();
    if ((window as any).streamClient) {
      console.log("setupWHIPClient a stream client already exists");
      return;
    }
    let streamClient = new WHIPClient(url, videoEl.current);
    (window as any).streamClient = streamClient;
    streamClient.peerConnection.addEventListener(
      "connectionstatechange",
      async () => {
        console.log(
          "connectionstatechange",
          streamClient.peerConnection.connectionState
        );
        if (streamClient.peerConnection.connectionState == "disconnected") {
          setVideo(false);
          await cleanupStreamClient();
          setupWHIPClient();
        }
        if (streamClient.peerConnection.connectionState == "connected") {
          if (videoEl.current) {
            setVideo(true);
            setTimeout(() => {
              if (videoEl.current) {
                videoEl.current.srcObject = streamClient.localStream;
                videoEl.current.play();
              }
            }, 100);
          }
        }
      }
    );
    return;
  };

  let setupWHEPClient = async (url?) => {
    if (!url) {
      url = await getWatchUrlAPI();
    }

    if ((window as any).streamClient) {
      console.log("setupWHEPClient a stream client already exists");
      return;
    }

    let streamClient = new WHEPClient(url, videoEl.current);
    (window as any).streamClient = streamClient;
    console.log("streamClient", streamClient);
    streamClient.peerConnection.addEventListener(
      "connectionstatechange",
      async () => {
        console.log(
          "connectionstatechange",
          streamClient.peerConnection.connectionState
        );

        if (
          streamClient.peerConnection.connectionState == "disconnected" ||
          streamClient.peerConnection.connectionState == "failed"
        ) {
          setVideo(false);
          if (videoEl.current) {
            await cleanupStreamClient();
            videoEl.current.srcObject = null;
          }
          await setupWHEPClient(url);
        }
        if (streamClient.peerConnection.connectionState == "connected") {
          if (videoEl.current) {
            setVideo(true);
            setTimeout(() => {
              if (videoEl.current) {
                videoEl.current.srcObject = streamClient.stream;
                videoEl.current.play();
              }
            }, 100);
          }
        }
      }
    );
  };

  const Timer = (props) => {
    let [checks, setChecks] = useState<any>(0);
    let [tick, setTick] = useState<any>();
    let delay = 4000;
    let call = () => {
      setChecks(checks + 1);
      if (checks) {
        // console.log("[Timer] callback");
        props.callback();
      }
    };

    useEffect(() => {
      if (checks) {
        setTimeout(call, delay);
      }
    }, [checks]);

    useEffect(() => {
      setTick(call);
    }, []);

    return <></>;
  };

  useEffect(() => {
    authUser();
  }, []);

  useEffect(() => {
    // console.log("User changed");
    if (!user.type) {
      return;
    }

    if (user.type == "stream") {
      setupWHIPClient();
    } else {
      setupWHEPClient();
    }

    inputChat.current?.focus();
  }, [user]);

  const sendChat = async () => {
    if (!inputChat.current) {
      console.log("No input field");
      return;
    }

    let msg = inputChat.current.value;
    if (msg) {
      inputChat.current.value = "";
      await sendChatAPI(msg);
      await getNewChats();
    }
  };

  const chatKeyDown = async (event) => {
    if (event.keyCode == 13) {
      sendChat();
    }
  };

  const getNewChats = async () => {
    //console.log("[getNewChats]", chats, chatLog.current?.innerHTML);
    if (!user) {
      return;
    }
    if (chatLog.current?.innerHTML && !chats.length) {
      console.log(
        "Somehow we have loaded chats but the state is not current in this call??"
      );
      return;
    }
    let lastChat = chats[chats.length - 1];

    let lastChatId = lastChat?.id || 0;

    let getNewChats = await getChatsAPI(lastChatId);

    if (getNewChats.status == "fail") {
      if (!loginNotice) {
        authUser();
      }
      return;
    }

    let newChats = getNewChats.data.messages;

    if ((newChats as any[]).length) {
      let concat = chats.concat(newChats);
      setChats(concat);
      return;
    }
  };

  const SignupUI = (props) => {
    let usernameRef = useRef<HTMLInputElement>();
    let passwordRef = useRef<HTMLInputElement>();
    let emailRef = useRef<HTMLInputElement>();
    let [errors, setErrors] = useState<any>([]);

    let inputKeyDown = (event) => {
      if (event.keyCode == 13) {
        signupSubmit();
      }
    };

    // useEffect(() => {
    //   usernameRef?.current?.focus();
    // });

    let signupSubmit = async () => {
      if (!emailRef.current || !usernameRef.current || !passwordRef.current) {
        return;
      }

      let email = emailRef.current.value;
      let username = usernameRef.current.value;
      let password = passwordRef.current.value;
      let errorsList: any = [];
      if (!username) {
        setErrors(errorsList.push({ type: "username" }));
      }

      if (!email) {
        setErrors(errorsList.push({ type: "email" }));
      }

      if (!password) {
        setErrors(errorsList.push({ type: "password" }));
      }

      if (errorsList.length) {
        setErrors(errorsList);
        return;
      }

      //props.signup();

      let res = await signupAPI({ email, username, password });

      if (res.status == "fail") {
        console.log("Sign up fail");
        // setSignupNotice(res.message);
        setErrors([{ type: "general", message: res.message }]);
        return;
      }

      // after sign up we should return an auth_token so we can auth
      if (res.data.user.authToken) {
        localStorage.setItem("authToken", res.data.user.authToken);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        props.authUser();
      }
    };

    return 1 ? (
      <div>
        Become a member
        <p>
          {/* {errors.map((item) => {
            return item.type;
          })} */}
          <input
            ref={emailRef as LegacyRef<HTMLInputElement> | undefined}
            name="email"
            placeholder="email"
            onKeyDown={inputKeyDown}
          />
          {errors.some((item) => item.type == "email") ? (
            <p>Missing Email</p>
          ) : null}
        </p>
        <p>
          {/* {errors.map((item) => {
            return item.type;
          })} */}
          <input
            ref={usernameRef as LegacyRef<HTMLInputElement> | undefined}
            name="username"
            placeholder="username"
            onKeyDown={inputKeyDown}
          />
          {errors.some((item) => item.type == "username") ? (
            <p>Missing username</p>
          ) : null}
        </p>
        <p>
          <input
            onKeyDown={inputKeyDown}
            ref={passwordRef as LegacyRef<HTMLInputElement> | undefined}
            name="password"
            placeholder="password"
          />
        </p>
        {errors.some((item) => item.type == "password") ? (
          <p>Missing Password</p>
        ) : null}
        {errors.some((item) => item.type == "general") ? (
          <p>{errors[0].message}</p>
        ) : null}
        <button onClick={signupSubmit}>Join</button>
      </div>
    ) : null;
  };

  const LoginUI = (props) => {
    let usernameRef = useRef<HTMLInputElement>();
    let passwordRef = useRef<HTMLInputElement>();
    let [errors, setErrors] = useState<any>([]);

    let inputKeyDown = (event) => {
      if (event.keyCode == 13) {
        loginSubmit();
      }
    };

    useEffect(() => {
      usernameRef?.current?.focus();
    });

    let loginSubmit = () => {
      if (!usernameRef.current || !passwordRef.current) {
        return;
      }

      let username = usernameRef.current.value;
      let password = passwordRef.current.value;
      let errorsList: any = [];
      if (!username) {
        setErrors(errorsList.push({ type: "username" }));
      }

      if (!password) {
        setErrors(errorsList.push({ type: "password" }));
      }

      if (errorsList.length) {
        setErrors(errorsList);
        return;
      }

      props.authUser({ username, password });
    };
    return props.notice ? (
      <div>
        {props.notice}
        <p>
          {/* {errors.map((item) => {
            return item.type;
          })} */}
          <input
            ref={usernameRef as LegacyRef<HTMLInputElement> | undefined}
            name="username"
            placeholder="username"
            onKeyDown={inputKeyDown}
          />
          {errors.some((item) => item.type == "username") ? (
            <p>Missing username</p>
          ) : null}
        </p>
        <p>
          <input
            onKeyDown={inputKeyDown}
            ref={passwordRef as LegacyRef<HTMLInputElement> | undefined}
            name="password"
            placeholder="password"
          />
        </p>
        {errors.some((item) => item.type == "password") ? (
          <p>Missing Password</p>
        ) : null}
        <button onClick={loginSubmit}>Login</button>
      </div>
    ) : null;
  };

  const Chat = (props) => {
    useEffect(() => {
      chatLog.current?.scrollTo(0, chatLog.current.scrollHeight);
    }, []);
    return (
      <>
        <div
          className="chat-log"
          ref={chatLog as LegacyRef<HTMLDivElement> | undefined}
        >
          {props.chats &&
            props.chats.map((item, index) => {
              return (
                <div key={index}>
                  <span>{item.username}</span>
                  <span>:</span>
                  <span>{item.message}</span>
                </div>
              );
            })}
        </div>
      </>
    );
  };

  return (
    <>
      <div className="page">
        {user.type == "stream" ? null : (
          <>
            {video ? null : (
              <div className="waiting">
                {loginNotice ? (
                  <>
                    <LoginUI notice={loginNotice} authUser={authUser} />
                    <SignupUI notice={signupNotice} authUser={authUser} />
                  </>
                ) : (
                  <div>Waiting for live feed...</div>
                )}
              </div>
            )}
          </>
        )}
        {user.type ? (
          <>
            <Timer callback={getNewChats} />
            <video
              ref={videoEl as LegacyRef<HTMLVideoElement> | undefined}
              id="watch"
              autoPlay={true}
              playsInline={true}
              controls={true}
              style={video ? {} : { height: "1px" }}
              muted={user.type == "stream" ? true : false}
            ></video>
            <div className="chat-ui">
              <Chat chats={chats} />
              <div className="chat">
                <div>
                  <input
                    name="message"
                    placeholder={user.username}
                    ref={inputChat as LegacyRef<HTMLInputElement> | undefined}
                    onKeyDown={chatKeyDown}
                  />
                </div>
                <div>
                  <button
                    ref={
                      btnSendChat as LegacyRef<HTMLButtonElement> | undefined
                    }
                    onClick={sendChat}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};
