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
  getPaySessionAPI,
  createPaymentAPI,
} from "../asg-shared/api";
import { Elements as StripeElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY || "");

const VIDEO_ENABLED = true;
const CHAT_TIMER_ENABLED = false;

export const App = () => {
  let [user, setUser] = useState<any>({});
  let [video, setVideo] = useState(false);
  let [chats, setChats] = useState<any>([]);
  let [loginNotice, setLoginNotice] = useState<any>("");
  let [signupNotice, setSignupNotice] = useState<any>("");
  let [initialVideoLoad, setInitialVideoLoad] = useState<any>("");
  let [initialChatsLoad, setInitialChatsLoad] = useState<any>("");
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
      console.log("[authToken] Valid setUser");
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

    localStorage.setItem("authToken", res.data.user.auth_token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setLoginNotice("");
    setUser(res.data.user);
    return true;
  };

  useEffect(() => {
    console.log("[UseEffect] APP");
    localStorage.removeItem("chats");
    authUser();
  }, []);

  useEffect(() => {
    console.log("[UseEffect] User changed", user);
    if (!user.type) {
      return;
    }
    // once we have the user get messages
  }, [user]);

  useEffect(() => {
    console.log("[UseEffect] initialVideoLoad", initialVideoLoad);
  }, [initialVideoLoad]);

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

  const StripePaymentForm = (props) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState();

    const handleError = (error) => {
      console.log("handleError", error);
      setErrorMessage(error);
    };

    const goback = (event) => {
      event.preventDefault();
      props.resetAddFunds();
    };

    const stripeSubmit = async (event) => {
      event.preventDefault();
      console.log("stripeSubmit");

      if (!elements || !stripe) {
        console.log("missing stripe hooks");
        return;
      }

      const { error: submitError } = await elements.submit();

      if (submitError) {
        handleError(submitError);
        return;
      }

      console.log("form is valid", props.amount);

      const { error, confirmationToken } = await stripe.createConfirmationToken(
        { elements }
      );

      if (error) {
        handleError(error);
        setErrorMessage(error.toString() as any);
        return;
      }

      console.log("got token", confirmationToken);

      // send token to server to create payment intent

      let postBody = {
        confirmationToken: confirmationToken.id,
        customer: props.session.customerId,
        amount: props.amount * 100,
      };

      let res = await createPaymentAPI(postBody);
      if (res.status == "fail") {
        console.log(res.message);
        setErrorMessage(res.message);
        return;
      }

      console.log("[StripePaymentForm] payment intent", res.data.intent);
      console.log(
        "[StripePaymentForm] payment new balance",
        res.data.newBalance
      );
      // success
      if (res.data.intent.status == "succeeded") {
        alert(
          "Thank you for your order. Your account balance has been updated."
        );
        props.resetAddFunds(res.data.newBalance);
      }
    };

    return (
      <form className="stripe-form" onSubmit={stripeSubmit}>
        <h2 className="payment">Aloha {props.user.email}!</h2>
        <p className="amount">Let's add ${props.amount} to your account.</p>
        <PaymentElement />
        <button className="stripe-form-submit">Pay</button>{" "}
        <button className="" onClick={goback}>
          Back
        </button>
        {errorMessage && <div>{errorMessage}</div>}
      </form>
    );
  };

  const PaymentUI = (props) => {
    let [stripeSession, setStripeSession] = useState<any>();
    let [stripeOptions, setStripeOptions] = useState<any>();

    let getPaymentSession = async () => {
      let res = await getPaySessionAPI();
      setStripeSession(res.data);
    };

    useEffect(() => {
      if (!props.user.type) {
        return; // user not set yet
      }
      // console.log("Use Effect PaymentUI");
      getPaymentSession();
    }, []);

    useEffect(() => {
      if (stripeSession) {
        console.log(stripeSession);
        const options = {
          mode: "payment",
          amount: props.amount * 100 || 2000,
          currency: "usd",
          paymentMethodCreation: "manual",
          customerSessionClientSecret:
            stripeSession.customerSession.client_secret,
          // Fully customizable with appearance API.
          appearance: {
            theme: "night",
            rules: {
              ".Error": {
                color: "#fff",
              },
            },
          },
        };
        setStripeOptions(options);
      }
    }, [stripeSession]);

    return (
      <>
        {stripeOptions ? (
          <StripeElements stripe={stripePromise} options={stripeOptions}>
            <StripePaymentForm
              amount={props.amount || 20}
              user={props.user}
              session={stripeSession}
              resetAddFunds={props.resetAddFunds}
            />
          </StripeElements>
        ) : null}
      </>
    );
  };

  const AddFundsUI = (props) => {
    let inputAmountRef = useRef<HTMLInputElement>();
    let btnAddMoney = useRef<HTMLAnchorElement>();
    let [errors, setErrors] = useState<any>([]);
    let [updateCreditCard, setUpdateCreditCard] = useState<any>(false);

    const resetAddFunds = (balance) => {
      setErrors([]);
      setUpdateCreditCard(false);
      if (balance) {
        props.resetTips(balance);
      }
    };

    const amountKeyDown = async (event) => {
      let amount = event.currentTarget.value.replace(/\D/g, "");
      event.currentTarget.value = amount;

      if (event.keyCode == 13) {
        addMoney();
      }
    };

    useEffect(() => {
      if (btnAddMoney.current) {
        //btnAddMoney.current.click();
      }
    }, []);

    const addMoney = async () => {
      console.log("Add Money", inputAmountRef.current?.value);
      let amount = parseInt(
        inputAmountRef.current?.value.replace(/\D/g, "") || ""
      );
      console.log("Add Money", amount);
      if (!amount) {
        return;
      }

      let res = await addFundsAPI({ amount });

      if (res.status == "fail") {
        console.log("Add money failed");

        if (res.message == "Credit card failed") {
          setUpdateCreditCard(true);
          return;
        }
        setErrors([res]);
        return;
      }

      console.log("Add funds success");
      setErrors([]);
      // TODO: if they have a payment method
      // we can reset the amount here props.resetTips();

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
              name="amount"
              placeholder="Enter an amount, say $20"
              // defaultValue="20"
              onKeyDown={amountKeyDown}
              maxLength={3}
              ref={inputAmountRef as LegacyRef<HTMLInputElement> | undefined}
            />{" "}
            <a
              ref={btnAddMoney as LegacyRef<HTMLAnchorElement> | undefined}
              onClick={addMoney}
            >
              $
            </a>
          </>
        )}
      </>
    );
  };

  const TipUI = (props) => {
    let btnSendTip = useRef<HTMLAnchorElement>();
    let inputAmountRef = useRef<HTMLInputElement>();
    let [errors, setErrors] = useState<any>([]);
    let [noMoney, setNoMoney] = useState<any>();
    let [balance, setBalance] = useState<any>(props.user.balance);

    const resetTips = (balance) => {
      setErrors([]);
      setNoMoney(false);
      setBalance(balance);
    };

    const amountChange = async (event) => {
      // console.log("value in change event", event.currentTarget.value);
      // let amount = event.currentTarget.value.replace(/\D/g, "");
      // if (inputAmountRef.current) {
      //   inputAmountRef.current.value = amount;
      // }
    };

    const amountKeyDown = async (event) => {
      let amount = event.currentTarget.value.replace(/\D/g, "");
      event.currentTarget.value = amount;

      if (event.keyCode == 13) {
        sendTip();
      }
    };

    useEffect(() => {
      if (btnSendTip.current) {
        //btnSendTip.current.click();
      }
      if (!balance) {
        // setNoMoney(true);
        // setErrors([{}]);
      }
    }, []);

    const sendTip = async () => {
      console.log("Send Tip!");
      // props.chatRef.current.get();
      if (!props.user.balance) {
        setNoMoney(true);
        setErrors([{}]);
        props.chatRef.current.toggleTwoevencols();
        return;
      }
      if (!inputAmountRef.current) {
        console.log("No inputAmountRef");
        return;
      }

      let amount = parseInt(inputAmountRef.current?.value);

      if (!amount) {
        console.log("Invalid amount");
        return;
      }

      inputAmountRef.current.value = amount.toString();

      let res = await sendTipAPI({ amount });

      if (res.status == "fail") {
        console.log("Send Tip failed");
        if (res.message == "No money") {
          setNoMoney(true);
          props.chatRef.current.toggleTwoevencols();
        }

        setErrors([res]);
        return;
      }

      if (res.status == "OK") {
        // reload chat
        setBalance(res.data.newBalance);
        props.chatRef.current.get();
        return;
      }
    };

    return (
      <div>
        {!noMoney &&
          errors.map((error, index) => {
            return <span key="index">! {error.message}</span>;
          })}
        {noMoney ? <AddFundsUI resetTips={resetTips} user={user} /> : null}
        {errors.length ? null : (
          <>
            <a
              ref={btnSendTip as LegacyRef<HTMLAnchorElement> | undefined}
              onClick={sendTip}
            >
              $
            </a>
            <input
              name="tip-amount"
              placeholder={"Tip $1 " + `/ $${balance || 0}`}
              // defaultValue="1"
              // type="number"
              maxLength={3}
              onKeyDown={amountKeyDown}
              ref={inputAmountRef as LegacyRef<HTMLInputElement> | undefined}
            />

            {/* {!balance ? (
              <a
                className="hidden"
                onClick={() => {
                  setErrors([{}]);
                  setNoMoney(true);
                }}
              >
                $ Add Money
              </a>
            ) : null} */}
          </>
        )}
      </div>
    );
  };

  const Chat = forwardRef((props: any, ref) => {
    let chatsCache = localStorage.getItem("chats");
    let initChats = [];
    if (chatsCache) {
      console.log("Use chats cache on rerender");
      initChats = JSON.parse(chatsCache);
    }

    let [chats, setChats] = useState<any>(initChats);
    let [display, setDisplay] = useState<any>("");
    let [twoevencols, setTwoevencols] = useState<any>(false);
    let inputChat = useRef<HTMLInputElement>();
    let btnSendChat = useRef<HTMLAnchorElement>();
    let chatLog = useRef<HTMLDivElement>();

    useImperativeHandle(ref, () => ({
      get() {
        get();
      },
      toggle() {
        toggle();
      },
      toggleTwoevencols() {
        toggleTwoevencols();
      },
    }));

    useEffect(() => {
      console.log("[Chats.UseEffect]");

      if (!props.user.type) {
        console.log("Chats loaded but no user");
        return; // user not set yet
      }

      if (props.initialChatsLoad) {
        console.log("Already loaded chats");
        return;
      }

      get();
      //
    }, []);

    useEffect(() => {
      chatLog.current?.scrollTo(0, chatLog.current.scrollHeight);
      //inputChat.current?.focus();
    }, [chats]);

    const toggleTwoevencols = () => {
      setTwoevencols(twoevencols ? "" : "twoevencols");
    };

    const toggle = () => {
      setDisplay(display ? null : "hidden");
    };

    const toggleVolume = (event) => {
      let text = props.videoRef.current.muted ? "Mute" : "UnMute";
      event.currentTarget.innerText = text;
      props.videoRef.current.muted = props.videoRef.current.muted
        ? false
        : true;
    };

    const toggleCamera = (event) => {
      console.log("Video Element", props.videoRef.current);

      (window as any).streamClient.switchCamera(props.videoRef.current);
      console.log("Video Element", props.videoRef.current);

      //setVideo(true);
      console.log("toggle Camera end");
      console.log("Video Element", props.videoRef.current);
    };

    const chatKeyDown = async (event) => {
      if (event.keyCode == 13) {
        sendChat();
      }
    };

    const sendChat = async (event?) => {
      event?.preventDefault();
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
      console.log("chats get");
      if (!props.user.type) {
        return;
      }

      let chatsCache = localStorage.getItem("chats");

      if (chatsCache) {
        chats = JSON.parse(chatsCache);
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

      let { messages } = getNewChats.data;

      if (messages.length) {
        let concat = chats.concat(messages);
        console.log("[Chats.get] Set Chats");

        localStorage.setItem("chats", JSON.stringify(concat));

        setChats(concat);

        // setTimeout(() => {
        //   props.parentMethod(true);
        // }, 1000);
        if (!props.initialChatsLoad) {
          props.setInitialChatsLoad(true);
        }
        return;
      }
    };

    return (
      <>
        <div className={"chat-ui"}>
          {/* {chats.length ? <Timer callback={get} /> : null} */}
          <div className="controls">
            {user.type != "stream" ? (
              <button className="toggle" onClick={toggleVolume}>
                Mute
              </button>
            ) : (
              <button className="toggle" onClick={toggleCamera}>
                Switch Camera
              </button>
            )}

            <button className="toggle" onClick={toggle}>
              X
            </button>
          </div>
          <div
            className={"chat-log " + display}
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
          <div className={"chat " + twoevencols + " " + display}>
            <div>
              <input
                name="message"
                placeholder={user.username + ", what's up?"}
                ref={inputChat as LegacyRef<HTMLInputElement> | undefined}
                onKeyDown={chatKeyDown}
              />
              <a
                href="#"
                ref={btnSendChat as LegacyRef<HTMLAnchorElement> | undefined}
                onClick={sendChat}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 384 512"
                  fill="currentColor"
                >
                  <path
                    d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2 160 448c0 17.7 14.3 32 32 32s32-14.3 32-32l0-306.7L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>

            <TipUI chatRef={chatRef} user={user} />
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
      if (checks) {
        // console.log("[Timer] callback");
        if (!CHAT_TIMER_ENABLED) {
          return;
        }

        props.callback();
      }
      setChecks(checks + 1);
    };

    useEffect(() => {
      if (checks) {
        (window as any).chatTimer = setTimeout(call, delay);
      }
    }, [checks]);

    useEffect(() => {
      setTick(call);
      console.log("UseEffect Timer");
      clearTimeout((window as any).chatTimer);
      if (!CHAT_TIMER_ENABLED) {
        console.log("CHAT TIMER DISABLED");
        return;
      }
    }, []);

    return <></>;
  };

  const Video = (props) => {
    let [someOtherVar, setSomeOtherVar] = useState(false);

    useEffect(() => {
      // console.log("[UseEffect] Video");
      // console.log(
      //   "[UseEffect] Video ",
      //   "props.initialVideoLoad",
      //   props.initialVideoLoad,
      //   "video",
      //   video
      // );

      if ((window as any).streamClient) {
        (window as any).streamClient.videoElement = props.videoRef.current;
      }

      if (!props.user.type) {
        console.log("[UseEffect] Video - No user", user);
        return;
      }

      if (props.initialVideoLoad) {
        console.log("Already loaded video");
        return;
      }

      if (props.user.type == "stream") {
        setupWHIPClient();
      } else {
        setupWHEPClient();
      }

      if (!props.initialVideoLoad) {
        props.setInitialVideoLoad(true);
      }
    }, []);

    useEffect(() => {
      console.log("[UseEffect] Video changed", video);
      if (props.video !== undefined) {
        //props.parentMethod("blah");
      }

      if (video === undefined) {
        setTimeout(() => {
          // console.log("[UseEffect] TImeout", video);
        }, 1000);
      }
    }, [video]);

    useEffect(() => {
      console.log("[UseEffect] someOtherVar changed", someOtherVar);
    }, [someOtherVar]);

    let setupWHIPClient = async () => {
      if (!VIDEO_ENABLED) {
        console.log("VIDEO DISABLED");
        return;
      }
      console.log("[setupWHIPClient]");
      let url = await getPublishUrlAPI();

      if ((window as any).streamClient) {
        console.log("[setupWHIPClient] a stream client already exists");
        return;
      }
      let streamClient = new WHIPClient(url, props.videoRef.current);
      (window as any).streamClient = streamClient;
      streamClient.peerConnection.addEventListener(
        "connectionstatechange",
        async () => {
          console.log(
            "[peerConnection] connectionstatechange",
            streamClient.peerConnection.connectionState
          );

          if (streamClient.peerConnection.connectionState == "disconnected") {
            setVideo(false);
            await cleanupStreamClient();
            setupWHIPClient();
          }
          if (streamClient.peerConnection.connectionState == "connected") {
            if (props.videoRef.current) {
              setVideo(true);
              setTimeout(() => {
                if (props.videoRef.current) {
                  props.videoRef.current.srcObject = streamClient.localStream;
                  props.videoRef.current.play();
                }
              }, 100);
            }
          }
        }
      );
      return;
    };

    let setupWHEPClient = async (url?) => {
      console.log("setupWHEPClient");

      if (!url) {
        url = await getWatchUrlAPI();
      }

      setSomeOtherVar(true);

      if (!VIDEO_ENABLED) {
        console.log("VIDEO DISABLED");
        return;
      }

      if ((window as any).streamClient) {
        console.log("setupWHEPClient a stream client already exists");
        return;
      }

      let streamClient = new WHEPClient(url, videoEl.current);
      (window as any).streamClient = streamClient;

      setSomeOtherVar(true);

      streamClient.peerConnection.addEventListener(
        "connectionstatechange",
        async () => {
          console.log(
            "[peerConnection] connectionstatechange",
            streamClient.peerConnection.connectionState
          );

          if (
            streamClient.peerConnection.connectionState == "disconnected" ||
            streamClient.peerConnection.connectionState == "failed"
          ) {
            setVideo(false);
            if (props.videoRef.current) {
              await cleanupStreamClient();
              props.videoRef.current.srcObject = null;
            }
            await setupWHEPClient(url);
          }
          if (streamClient.peerConnection.connectionState == "connected") {
            if (props.videoRef.current) {
              console.log("Set Video True", setVideo);
              setSomeOtherVar(true);
              setVideo(true);
              setTimeout(() => {
                if (props.videoRef.current) {
                  props.videoRef.current.srcObject = streamClient.stream;
                  props.videoRef.current.play();
                }
              }, 100);
            }
          }
        }
      );
    };

    console.log("Video Render");

    return (
      <>
        <video
          ref={props.videoRef as LegacyRef<HTMLVideoElement> | undefined}
          id="watch"
          autoPlay={true}
          // controls={true}
          playsInline={true}
          // style={video ? {} : { height: "1px" }}
          muted={user.type == "stream" ? true : false}
        ></video>
        {props.video ? null : (
          <>
            <div className="loading-video">
              <h2 className="payment">Loading video...</h2>
            </div>
          </>
        )}
      </>
    );
  };

  const parentMethod = (data) => {
    console.log("[parentMethod]", data);
    setInitialVideoLoad(true);
  };

  console.log("App render", "video", video);

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
            video={video}
            videoRef={videoEl}
            initialVideoLoad={initialVideoLoad}
            parentMethod={parentMethod}
            setInitialVideoLoad={setInitialVideoLoad}
          />
          <Chat
            ref={chatRef}
            videoRef={videoEl}
            authUser={authUser}
            user={user}
            setUser={setUser}
            chats={chats}
            setChats={setChats}
            initialChatsLoad={initialChatsLoad}
            parentMethod={parentMethod}
            setInitialChatsLoad={setInitialChatsLoad}
          />
        </>
      ) : null}
    </div>
  );
};
