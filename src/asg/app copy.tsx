import React, { LegacyRef, useEffect, useRef, useState } from "react";
import WHEPClient from "../public/WHEPClient";
import { random } from "lodash";
import moment from "moment";

let APIRoot =
  process.env.NODE_ENV == "development"
    ? "http://localhost:8787"
    : "https://asg-test.zapteck.workers.dev";

console.log("APIRoot", process.env.NODE_ENV, APIRoot);
// const waitVideoState = async () => {
//   return await new Promise((resolve, reject) => {
//     let interval = setInterval(() => {
//       let videoState = localStorage.getItem("videoState");
//       if (videoState && videoState === "connected") {
//         clearInterval(interval);
//         resolve(true);
//       }
//     }, 100);
//   });
// };
const getWatchUrlAPI = async () => {
  let authToken = localStorage.getItem("authToken");
  let headers = new Headers({
    Authorization: `Bearer ${authToken}`,
  });

  let res = await fetch(APIRoot + "/watch", {
    headers,
  });
  let body = await res.json();
  return body.data.messages;
};

const getChatsAPI = async (lastFetchDate) => {
  let authToken = localStorage.getItem("authToken");
  let headers = new Headers({
    Authorization: `Bearer ${authToken}`,
  });

  let res = await fetch(APIRoot + "/messages?date=" + lastFetchDate, {
    headers,
  });
  let body = await res.json();
  return body.data.messages;
  console.log("[getChatsAPI]", lastFetchDate);
  return await new Promise((resolve, reject) => {
    let interval = setTimeout(() => {
      // console.log("getChatsAPI");
      let mockDataWithRecord = [
        { id: 3, message: "Hello" + random(0, 10), user: "Zach" },
      ];

      let mockDataEmpty = [];
      let rand = random(0, 1);
      resolve(rand ? mockDataWithRecord : mockDataEmpty);
    }, 1000);
  });
};

const sendChatAPI = async (message) => {
  let authToken = localStorage.getItem("authToken");
  let headers = new Headers({
    Authorization: `Bearer ${authToken}`,
  });

  let res = await fetch(APIRoot + "/messages", {
    method: "POST",
    body: JSON.stringify({ message: message }),
    headers,
  });
  let body = await res.json();
  return body.data.messages;
  console.log("[getChatsAPI]", body);
  return await new Promise((resolve, reject) => {
    let interval = setTimeout(() => {
      // console.log("getChatsAPI");
      let mockData = [
        { message: "Hello" + random(0, 10), user: { name: "Zach" } },
      ];

      resolve(mockData);
    }, 1000);
  });
};

export const App = () => {
  let [video, setVideo] = useState(false);
  let [chats, setChats] = useState<any>([]);
  let [newChats, setNewChats] = useState<any>([]);
  let [lastChatDate, setLastChatDate] = useState<any>();
  let [checks, setChecks] = useState<any>(0);
  let [streamClient, setStreamClient] = useState<any>();

  let reloadChats = () => {
    //setChecks(checks + 1);
    //console.log("reloadChats");
    setTimeout(() => {
      //console.log(chats);
      //getNewChats();
    }, 4000);
  };

  //const url =
  //"https://customer-aria4pdgkvgu9z0v.cloudflarestream.com/341f971987242898666f88c9bdd75cad/webRTC/play";
  let url =
    "https://customer-aria4pdgkvgu9z0v.cloudflarestream.com/0dbe52278517838e32dbff6f59cc3e82/webRTC/play";
  let videoEl = useRef<HTMLVideoElement>();

  // let getVideoState = async () => {
  //   let videoState: any = localStorage.getItem("videoState");
  //   videoState = await waitVideoState();
  //   setVideo(videoState);
  //   return await waitVideoState();
  // };
  let setupWHEPClient = () => {
    let url = getWatchUrlAPI();

    let streamClient = new WHEPClient(url, videoEl.current);
    // setStreamClient(streamClient);
    streamClient.peerConnection.addEventListener(
      "connectionstatechange",
      () => {
        // console.log(
        //   "[connectionstatechange]",
        //   streamClient.peerConnection.connectionState
        // );
        if (streamClient.peerConnection.connectionState == "disconnected") {
          setVideo(false);
          setupWHEPClient();
        }
        if (streamClient.peerConnection.connectionState == "connected") {
          if (videoEl.current) {
            videoEl.current.srcObject = streamClient.stream;
            videoEl.current.play();
            setVideo(true);
          }
        }
      }
    );
  };

  const Timer = (props) => {
    let [checks, setChecks] = useState<any>(0);
    let delay = 4000;
    let tick = async () => {
      setChecks(checks + 1);
      props.callback();
    };

    useEffect(() => {
      setTimeout(tick, delay);
    }, [checks]);

    return <>{/* <div>{checks}</div> */}</>;
  };

  useEffect(() => {
    //getVideoState();
    //setupWHEPClient();
    getNewChats();
    //setInterval(getNewChats.bind(chats), 5000);
    // setTimeout(() => {
    //   //console.log(chats);
    //   getNewChats();
    // }, 4000);
  }, []);

  useEffect(() => {
    //console.log("useEffect chats", chats.length);
    chatLog.current?.scrollTo(0, chatLog.current.scrollHeight);
    //reloadChats();
  }, [chats]);

  let inputChat = useRef<HTMLInputElement>();
  let btnSendChat = useRef<HTMLButtonElement>();
  let chatLog = useRef<HTMLDivElement>();

  const chatKeyDown = async (event) => {
    //console.log(event);
    if (event.keyCode == 13) {
      let msg = event.currentTarget.value;
      if (msg) {
        console.log("Send Chat", msg);
        event.currentTarget.value = "";
        await sendChatAPI(msg);
        await getNewChats();
      }
    }
  };

  const getNewChats = async () => {
    console.log("[getNewChats] Chats", chats.length);
    return;
    // if (chats.length > 60) {
    //   return;
    // }
    // let dateString = moment()
    //   .utc()
    //   .subtract("1 second")
    //   .format("YYYY-MM-DD HH:mm:ss");

    let lastChat = chats[chats.length - 1];
    //console.log("lastChat", lastChat);

    let lastChatId = lastChat?.id;
    let dateQuery = lastChatId || 0;
    // if (!dateQuery) {
    //   console.log("dateString return", dateString);
    //   return;
    // }
    //console.log("getNewChats", dateQuery);

    let newChats = await getChatsAPI(dateQuery);
    // console.log("dateString", dateString);

    //setLastChatDate(dateQuery);

    if ((newChats as any[]).length) {
      let concat = chats.concat(newChats);
      //console.log("concat", concat);
      setChats(concat);
      return;
    } else {
      //console.log("no change");
      //reloadChats();
    }
  };

  const Chat = (props) => {
    // console.log("[Chat]", props.context.chats);
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
                  <span>{item.user}</span>
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
      {/* <h1>Aloha Surf Girls</h1> */}
      <div className="page">
        <Timer callback={getNewChats} />
        {video ? null : <div className="waiting">Waiting for live feed...</div>}
        <video
          ref={videoEl as LegacyRef<HTMLVideoElement> | undefined}
          id="watch"
          autoPlay={true}
          controls
        ></video>
        <div className="chat-ui">
          <Chat chats={chats} />
          <div className="chat">
            {/* <p>Chat</p> */}
            <div>
              <input
                ref={inputChat as LegacyRef<HTMLInputElement> | undefined}
                onKeyDown={chatKeyDown}
              />
            </div>
            <div>
              <button
                ref={btnSendChat as LegacyRef<HTMLButtonElement> | undefined}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
