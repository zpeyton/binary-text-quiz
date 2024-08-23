import React, {
  forwardRef,
  LegacyRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import WHEPClient from "../public/WHEPClient";
import WHIPClient from "../public/WHIPClient";
import {
  addFundsAPI,
  disconnectAPI,
  getChatsAPI,
  getPaymentMethodsAPI,
  getPublishUrlAPI,
  getWatchUrlAPI,
  loginAPI,
  sendChatAPI,
  sendTipAPI,
  signupAPI,
  tokenAPI,
  STRIPE_PUBLISHABLE_KEY,
} from "../asg-shared/api";
import { Elements as StripeElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY || "");

export const App = () => {
  let [video, setVideo] = useState(false);
  let [user, setUser] = useState<any>({});
  let [loginNotice, setLoginNotice] = useState<any>("");
  let [signupNotice, setSignupNotice] = useState<any>("");
  let videoEl = useRef<HTMLVideoElement>();
  let chatRef = useRef();

  let cleanupStreamClient = async () => {
    await (window as any).streamClient?.peerConnection?.close();
    if ((window as any).streamClient?.disconnectStream) {
      await (window as any).streamClient?.disconnectStream();
    }

    (window as any).streamClient = null;
  };

  // window.onbeforeunload = async () => {
  //   console.log("onbeforeunload");
  //   await cleanupStreamClient();
  //   await disconnectAPI();
  // };

  let authUser = async (creds?) => {
    // console.log("authUser");
    let token = localStorage.getItem("authToken");
    let user = JSON.parse(localStorage.getItem("user") || "{}");
    if (token) {
      // is token valid
      let validateToken = await tokenAPI({ token });
      if (validateToken.status == "fail") {
        // console.log("authUser token check failed");
        setLoginNotice("Login Required - Token Expired");
        setUser({});
        setVideo(false);
        await cleanupStreamClient();
        localStorage.setItem("authToken", "");
        return;
      }
      if (loginNotice) {
        setLoginNotice("");
      }
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

    localStorage.setItem("authToken", res.data.user.auth_token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setLoginNotice("");
    setUser(res.data.user);
    return true;
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
    return;
    if (!url) {
      url = await getWatchUrlAPI();
    }

    if ((window as any).streamClient) {
      console.log("setupWHEPClient a stream client already exists");
      return;
    }

    let streamClient = new WHEPClient(url, videoEl.current);
    (window as any).streamClient = streamClient;
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

  useEffect(() => {
    // console.log("UseEffect APP");
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
  }, [user]);

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

  const PaymentUI = (props) => {
    let [methods, setMethods] = useState<any>([]);
    // get existing methods
    let getPaymentMethods = async () => {
      let res = await getPaymentMethodsAPI();
      setMethods(res.data.methods);
    };

    useEffect(() => {
      if (!props.user.type) {
        return; // user not set yet
      }
      // console.log("Use Effect PaymentUI");
      getPaymentMethods();
    }, []);

    const options = {
      mode: "payment",
      amount: props.amount * 100 || 2000,
      currency: "usd",
      paymentMethodCreation: "manual",
      // Fully customizable with appearance API.
      appearance: {
        /*...*/
      },
    };

    return (
      <form className="stripe-form">
        <div className="amount">Add ${props.amount || 20}</div>
        <StripeElements stripe={stripePromise} options={options as any}>
          <PaymentElement />
          <button className="stripe-form-submit">Submit</button>
        </StripeElements>
        {false &&
          methods.map((item, index) => {
            return (
              <div key={index}>
                {item.type == "card" ? (
                  <>
                    {item.brand} x{item.last4}
                  </>
                ) : null}
              </div>
            );
          })}
      </form>
    );
  };

  const AddFundsUI = (props) => {
    let inputAmountRef = useRef<HTMLInputElement>();
    let btnAddMoney = useRef<HTMLButtonElement>();
    let [errors, setErrors] = useState<any>([]);
    let [updateCreditCard, setUpdateCreditCard] = useState<any>(false);

    const resetAddFunds = () => {
      setErrors([]);
      setUpdateCreditCard(false);
    };

    const addMoney = async () => {
      console.log("Add Money");
      let amount = inputAmountRef.current?.value;
      if (!amount) {
        return;
      }

      let res = await addFundsAPI({ amount });

      if (res.status == "fail") {
        console.log("Add money failed");

        if (res.message == "Credit card failed") {
          setUpdateCreditCard(true);
        }
        setErrors([res]);
        return;
      }

      console.log("Add funds success");
      setErrors([]);
      props.resetTips();
      // update tips UI
      //props.chatRef.current.get();
    };

    return (
      <>
        {updateCreditCard ? (
          <PaymentUI
            resetAddFunds={resetAddFunds}
            user={props.user}
            amount={inputAmountRef.current?.value}
          />
        ) : null}
        {!updateCreditCard &&
          errors.map((error, index) => {
            return <span key="index">! {error.message}</span>;
          })}{" "}
        {errors.length ? null : (
          <>
            <input
              name="message"
              placeholder="$20"
              ref={inputAmountRef as LegacyRef<HTMLInputElement> | undefined}
            />{" "}
            <button
              ref={btnAddMoney as LegacyRef<HTMLButtonElement> | undefined}
              onClick={addMoney}
            >
              $ Add Money
            </button>
          </>
        )}
      </>
    );
  };

  const TipUI = (props) => {
    let btnSendTip = useRef<HTMLButtonElement>();
    let inputAmountRef = useRef<HTMLInputElement>();
    let [errors, setErrors] = useState<any>([]);
    let [noMoney, setNoMoney] = useState<any>(false);

    const resetTips = () => {
      setErrors([]);
      setNoMoney(false);
    };

    const sendTip = async () => {
      console.log("Send Tip");
      // has money?
      let res = await sendTipAPI({ amount: 2 });
      if (res.status == "fail") {
        console.log("Send Tip failed");
        if (res.message == "No money") {
          setNoMoney(true);
        }
        setErrors([res]);
        return;
      }
    };

    return (
      <div className="tip">
        {!noMoney &&
          errors.map((error, index) => {
            return <span key="index">! {error.message}</span>;
          })}
        {noMoney ? <AddFundsUI resetTips={resetTips} user={user} /> : null}
        {errors.length ? null : (
          <button
            ref={btnSendTip as LegacyRef<HTMLButtonElement> | undefined}
            onClick={sendTip}
          >
            $ Tip
          </button>
        )}
      </div>
    );
  };

  const Chat = forwardRef((props: any, ref) => {
    let [chats, setChats] = useState<any>([]);
    let inputChat = useRef<HTMLInputElement>();
    let btnSendChat = useRef<HTMLButtonElement>();
    let chatLog = useRef<HTMLDivElement>();

    useImperativeHandle(ref, () => ({
      get() {
        console.log("refget");
        get();
      },
    }));

    useEffect(() => {
      if (!props.user.type) {
        return; // user not set yet
      }
      get();
    }, []);

    useEffect(() => {
      chatLog.current?.scrollTo(0, chatLog.current.scrollHeight);
      inputChat.current?.focus();
    }, [chats]);

    const chatKeyDown = async (event) => {
      if (event.keyCode == 13) {
        sendChat();
      }
    };

    const sendChat = async () => {
      if (!inputChat.current) {
        console.log("No input field");
        return;
      }

      let msg = inputChat.current.value;
      if (msg) {
        inputChat.current.value = "";
        await sendChatAPI(msg);
        await get();
      }
    };

    const get = async () => {
      if (!props.user) {
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
        console.log("getNewChats.status == fail");

        if (getNewChats.message == "Not Authorized") {
          props.authUser();
        }
        return;
      }

      let newChats = getNewChats.data.messages;

      if (newChats.length) {
        let concat = chats.concat(newChats);
        setChats(concat);
        return;
      }
    };

    return (
      <>
        <div className="chat-ui">
          <Timer callback={get} />
          <div
            className="chat-log"
            ref={chatLog as LegacyRef<HTMLDivElement> | undefined}
          >
            {chats &&
              chats.map((item, index) => {
                return (
                  <div key={index}>
                    <span>{item.username}</span>
                    <span>:</span>
                    <span>{item.message}</span>
                  </div>
                );
              })}
          </div>
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
                ref={btnSendChat as LegacyRef<HTMLButtonElement> | undefined}
                onClick={sendChat}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </>
    );
  });

  const Timer = (props) => {
    let [checks, setChecks] = useState<any>(0);
    let [tick, setTick] = useState<any>();
    let delay = 4000;
    let call = () => {
      setChecks(checks + 1);
      if (checks) {
        // console.log("[Timer] callback");
        //props.callback();
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

  return (
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
          <video
            ref={videoEl as LegacyRef<HTMLVideoElement> | undefined}
            id="watch"
            autoPlay={true}
            playsInline={true}
            controls={true}
            style={video ? {} : { height: "1px" }}
            muted={user.type == "stream" ? true : false}
          ></video>
          <Chat ref={chatRef} authUser={authUser} user={user} />
        </>
      ) : null}
      {loginNotice ? null : (
        <>
          <TipUI chatRef={chatRef} user={user} />
          {/* <PaymentUI user={user} /> */}
        </>
      )}
    </div>
  );
};
