import React, { useEffect, useRef, useState } from "react";
import { loginAPI, tokenAPI } from "../asg-shared/api";
import { WHEP, WHIP } from "../asg-shared/webrtc";
import { Timer } from "../asg-shared/timer";
import { Video } from "../asg-shared/video";
import { Chat } from "../asg-shared/chat";
import { LoginUI, SignupUI } from "../asg-shared/auth";

const whip = new WHIP();
const whep = new WHEP();

export const App = () => {
  let [user, setUser] = useState<any>({});
  let [video, setVideo] = useState(false);
  let [loginNotice, setLoginNotice] = useState<any>("");
  let [signupNotice, setSignupNotice] = useState<any>("");
  let videoEl = useRef<HTMLVideoElement>();
  let chatRef = useRef<any>();

  let cleanupStreamClient = async () => {
    whip.client?.peerConnection?.close();

    if (whip.client?.disconnectStream) {
      await whip.client?.disconnectStream();
    }
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
      // console.log("[authToken] Valid setUser");
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
    localStorage.removeItem("chats");
    authUser();
  }, []);

  useEffect(() => {
    if (!user.type) {
      return;
    }

    console.debug("[UseEffect] User changed", user);

    // once we have the user get messages

    if (chatRef.current) {
      chatRef.current.get();
    }
  }, [user]);

  const TimerEl = (props) => {
    // console.log("Timer El");

    if (window[props.name + "Timer"]) {
      window[props.name + "Timer"].clear();
    }

    window[props.name + "Timer"] = new Timer(props);

    return <></>;
  };

  console.debug("App render");

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
            videoRef={videoEl}
            setVideo={setVideo}
          />
          <Chat ref={chatRef} user={user} whip={whip} videoRef={videoEl} />
        </>
      ) : null}
    </div>
  );
};
