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
  WebSocketChat,
  PRODUCTION,
  checkBundleUpdate,
  AuthUI,
  logout,
  cloudflareSubDomain,
} from "../asg-shared";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faComments,
  faVideo,
  faShoppingCart,
  faGift,
  faUsers,
  faList,
  faCalendar,
  faCalendarAlt,
  faMoneyBill,
  faCommentsDollar,
  faCircleInfo,
  faTowerBroadcast,
  faTowerCell,
  faDollarSign,
  faInfoCircle,
  faCopyright,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import { PaymentUI } from "../asg-shared/tips";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// import { setMinutes } from "react-datepicker/dist/date_utils";
// import * as test from "react-datepicker/dist/date_utils";

// let blah = test.setMinutes(new Date(), 0);

export const App = (props) => {
  console.debug("[Video] App render");
  let [webSocketHost, setWebSocketHost] = useState<any>(props.webSocketHost);
  let [user, setUser] = useState<any>({});
  let [loadDate, setLoadDate] = useState<any>(new Date());
  let [video, setVideo] = useState(false);
  let [loginNotice, setLoginNotice] = useState<any>("");
  let [signupNotice, setSignupNotice] = useState<any>("Join us");
  let [videoList, setVideoList] = useState<any>([]);
  let [purchased, setPurchasedList] = useState<any>([]);
  let [tab, setTab] = useState<any>("store");
  let [bookSuccess, setBookSuccess] = useState<any>(false);
  let videoRef = useRef<HTMLVideoElement>();
  let chatRef = useRef<any>();
  let webSocket = useRef<any>();
  let datePickerRef = useRef<any>();
  let [checkout, setCheckout] = useState({
    product: { videoId: 0, amount: 0 },
  });
  const [page, setPage] = useState("videos");
  const [startDate, setStartDate] = useState(
    new Date(moment(new Date()).format("YYYY-MM-DD HH:00:00"))
  );
  console.log(moment(new Date()).format("YYYY-MM-DD HH:00:00"));
  let cleanupStreamClient = async () => {
    whip.client?.peerConnection?.close();

    if (whip.client?.disconnectStream) {
      await whip.client?.disconnectStream();
    }
  };

  let tabClick = (event) => {
    event.preventDefault();
    setTab(event.target.getAttribute("href"));
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

    // window.addEventListener("load", function () {
    //   // alert("load event");
    //   setTimeout(function () {
    //     window.scrollTo(0, 500);
    //   }, 100);
    // });

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
      setVideoList,
      setPurchasedList,
    });

    loadVideos();
    loadPurchases();
  }, [user]);

  const loadVideos = async () => {
    await webSocket.current.api.VideoList.send();
  };

  const loadPurchases = async () => {
    await webSocket.current.api.Purchases.send();
  };

  const handleNavClick = (page) => {
    setPage(page);
    // Add navigation logic here if needed
    if (page == "chat") {
    }
  };

  const buyClick = (event) => {
    event.preventDefault();
    console.log("buy video", event.target.parentNode);
    let target = event.target;

    while (!target.getAttribute("rel")) {
      target = target.parentNode;
    }
    if (user.type == "guest") {
      alert("Please login to purchase videos");
      return;
    }
    setCheckout({
      product: {
        videoId: target.getAttribute("rel"),
        amount: target.getAttribute("aria-valuenow"),
      },
    });
  };

  const testcallback = (success) => {
    console.log("testcallback");
    setCheckout({
      product: {
        videoId: 0,
        amount: 0,
      },
    });
    if (success) {
      console.log("Payment success, reload purchases");
      webSocket.current.setState({
        user,
        loginNotice,
        chatRef,
        videoRef,
        setVideoList,
        setPurchasedList,
      });

      loadPurchases();
      setTab("purchased");
    }
  };

  const bookDateChange = (event) => {
    console.log("bookDateChange", event);
  };

  let logoutClick = (event) => {
    event.preventDefault();
    logout();
  };

  const LogoutBtn = (props) => {
    return (
      <>
        <a onClick={logoutClick} href="#" className="login">
          Logout
        </a>
      </>
    );
  };

  let loggedIn = user.type == "member" || user.type == "stream";
  let thumbJpg = "thumbnails/thumbnail.jpg";

  const filterPassedTime = (time) => {
    const currentDate = new Date();
    const selectedDate = new Date(time);

    return currentDate.getTime() < selectedDate.getTime();
  };

  const bookReceive = async (api) => {
    console.log("[API.bookSuccess]", api);
    let { response } = api;
    if (response.status == "OK") {
      setBookSuccess(true);
    }
  };

  const datePickerClick = async (event) => {
    event.preventDefault();
    console.log(datePickerRef.current);
    datePickerRef.current.input.click();
  };

  const bookClick = async (event) => {
    console.log("bookClick");
    event.preventDefault();
    if (user.type == "guest") {
      alert("Please login before you book");
      return;
    }

    let postBody = {
      date: startDate,
      timeZone: `GMT${(new Date().getTimezoneOffset() * -1) / 60} ${
        Intl.DateTimeFormat().resolvedOptions().timeZone
      }`,
    };

    await webSocket.current.api.Book.send(postBody, bookReceive);
  };

  return (
    <div className="page">
      {user.type == "stream" ? null : <>{loginNotice ? <></> : null}</>}

      {user.type ? (
        <>
          <nav className="bottom-nav">
            <ul>
              <li
                className={page === "account" ? "active" : ""}
                onClick={() => handleNavClick("account")}
              >
                <FontAwesomeIcon icon={faTowerCell} />
              </li>
              {/* <li
                className={page === "chat" ? "active" : ""}
                onClick={() => handleNavClick("chat")}
              >
                <FontAwesomeIcon icon={faCommentsDollar} />
              </li> */}
              <li
                className={page === "videos" ? "active" : ""}
                onClick={() => handleNavClick("videos")}
              >
                <FontAwesomeIcon icon={faList} />
              </li>
              <li
                className={page === "book" ? "active" : ""}
                onClick={() => handleNavClick("book")}
              >
                <FontAwesomeIcon icon={faCalendarAlt} />
              </li>
              <li
                className={page === "info" ? "active" : ""}
                onClick={() => handleNavClick("info")}
              >
                <FontAwesomeIcon icon={faCircleInfo} />
              </li>
            </ul>
          </nav>

          {page == "info" ? (
            <>
              {loggedIn ? <LogoutBtn /> : null}
              <div className="sub-page">
                <div className="scroll-list">
                  <h1>
                    <FontAwesomeIcon icon={faInfoCircle} /> About Us
                  </h1>
                  <p>
                    Aloha Surf Girls is based in Haleiwa HI, on the North Shore
                    of O'ahu.
                  </p>
                  <div className="text-center">
                    <img src="https://alohasurfgirls.com/alohasurfgirls.png" />
                    <br />
                    <br />
                    PO Box 1012, Haleiwa, HI 96712
                    <br />
                    <br />
                    808-492-2909
                    <br />
                    <br />
                    Copyright <FontAwesomeIcon icon={faCopyright} /> Aloha Surf
                    Girls. <br />
                    <br />
                    All Rights Reserved.
                  </div>
                  <p></p>
                </div>
              </div>
            </>
          ) : null}

          {page == "book" ? (
            <div className="sub-page">
              <div className="scroll-list">
                <h1>
                  <FontAwesomeIcon icon={faCalendarAlt} /> Book a session
                </h1>
                {bookSuccess ? (
                  <>
                    <p>
                      Thank you for booking. We will be in touch and plan a
                      session.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Reserve your time so we can plan a fun and memorable
                      experience.
                    </p>
                    <p>
                      {/* <DatePicker onChange={bookDateChange} /> */}
                      <div className="vertcal-center">
                        <div
                          className="date-picker-text"
                          onClick={datePickerClick}
                        >
                          Pick a date:
                        </div>
                        <FontAwesomeIcon
                          onClick={datePickerClick}
                          icon={faCalendarAlt}
                        />
                        <DatePicker
                          ref={datePickerRef}
                          selected={startDate}
                          showTimeSelect
                          timeIntervals={60}
                          timeFormat="p"
                          dateFormat="Pp"
                          filterTime={filterPassedTime}
                          minDate={new Date()}
                          onChange={(date) => {
                            setStartDate(date as any);
                          }}
                          icon={<FontAwesomeIcon icon={faInfoCircle} />}
                        />
                      </div>

                      <div className="vertcal-center">
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <div>
                          Your timezone is{" "}
                          {(new Date().getTimezoneOffset() * -1) / 60}{" "}
                          {Intl.DateTimeFormat().resolvedOptions().timeZone}.
                        </div>
                      </div>
                    </p>
                    <p>
                      <button onClick={bookClick}>Book</button>
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {page == "videos" ? (
            <div className="sub-page">
              <div className="scroll-list">
                <h1>
                  <FontAwesomeIcon onClick={datePickerClick} icon={faVideo} />{" "}
                  Videos
                </h1>
                <div className="tab-nav">
                  <div className="tabs">
                    <a
                      className={tab == "store" ? "active" : ""}
                      onClick={tabClick}
                      href="store"
                    >
                      Store
                    </a>
                    <a
                      className={tab == "purchased" ? "active" : ""}
                      onClick={tabClick}
                      href="purchased"
                    >
                      Purchased
                    </a>
                  </div>
                </div>
                <div className={"tab" + (tab == "purchased" ? "active" : "")}>
                  {purchased.map((video, index) => (
                    <div className="video-list-item" key={index}>
                      {/* <h3>Purchased Video</h3> */}
                      {/* <a>{video.price || "$10"}</a> */}
                      <div
                        className="img-wrap"
                        rel={video.cf_uid}
                        aria-valuenow={video.price}
                        onClick={buyClick}
                      >
                        <iframe
                          allow="fullscreen"
                          src={`https://${cloudflareSubDomain}/${video.video_id}/watch`}
                        ></iframe>
                      </div>

                      <p
                        title={moment
                          .utc(video.purchase_date)
                          .local()
                          .toString()}
                      >
                        <span>Purchased</span>{" "}
                        {moment.utc(video.purchase_date).local().fromNow()}
                      </p>
                    </div>
                  ))}
                  <div className="bottom-spacer">
                    {purchased.length ? (
                      <h2>Thank you for your purchase!</h2>
                    ) : (
                      <h2>Click the store tab to purchase your first video.</h2>
                    )}
                  </div>
                </div>
                <div className={"tab" + (tab == "store" ? "active" : "")}>
                  <p>
                    Purchase recorded videos of our live feeds and other shows.
                  </p>
                  {(user.type == "member" || user.type == "stream") &&
                  checkout.product.amount ? (
                    <>
                      <PaymentUI
                        user={user}
                        videoId={checkout.product.videoId}
                        amount={checkout.product.amount}
                        webSocket={webSocket}
                        callback={testcallback}
                      />
                    </>
                  ) : null}
                  {videoList.map((video, index) => (
                    <div className="video-list-item" key={video.id}>
                      <h3>{video.name}</h3>
                      <a>{video.price || "$10"}</a>
                      <div
                        className="img-wrap buy"
                        rel={video.cf_uid}
                        aria-valuenow={video.price}
                        onClick={buyClick}
                      >
                        <img
                          src={`https://${cloudflareSubDomain}/${
                            video.cf_uid
                          }/${thumbJpg}?nocache=${new Date().getTime()}`}
                          alt={video.name}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="bottom-spacer">
                    <h2>More coming soon!</h2>
                  </div>
                </div>
                {/* tab */}
              </div>
              {/* scroll list */}
              {/* subpage */}
            </div>
          ) : null}

          <AuthUI
            user={user}
            loginNotice={loginNotice}
            signupNotice={signupNotice}
            setLoginNotice={setLoginNotice}
            webSocket={webSocket}
          />

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
