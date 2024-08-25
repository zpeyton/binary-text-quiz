import React, {
  forwardRef,
  LegacyRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { getChatsAPI, sendChatAPI } from "./api";
import * as Icons from "../asg-shared/icons";
import { TipUI } from "./tips";

export const Chat = forwardRef((props: any, ref) => {
  let chatsCache = localStorage.getItem("chats");
  let initChats = [];
  if (chatsCache) {
    console.debug("[Chat] Use chats cache on rerender");
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
    // console.log("[Chats.UseEffect]");

    if (!props.user.type) {
      console.log("[Chat] loaded but no user");
      return; // user not set yet
    }
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
    if (!props.videoRef.current) {
      return;
    }

    let text = props.videoRef.current.muted ? "Mute" : "UnMute";
    event.currentTarget.innerText = text;
    props.videoRef.current.muted = props.videoRef.current.muted ? false : true;
  };

  const toggleCamera = (event) => {
    props.whip.client.switchCamera(props.videoRef);
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
    console.debug("[Chat.get]");

    if (!props.user.type) {
      return;
    }

    let chatsCache = localStorage.getItem("chats");

    if (chatsCache) {
      chats = JSON.parse(chatsCache);
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
      console.debug("[Chat.get] Set Chats");

      localStorage.setItem("chats", JSON.stringify(concat));

      setChats(concat);

      return;
    }
  };

  return (
    <>
      <div className={"chat-ui"}>
        {/* {chats.length ? (
             <TimerEl delay="4000" name="chat" callback={get} />
          ) : null} */}
        <div className="controls">
          {props.user.type != "stream" ? (
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
              placeholder={props.user.username + ", what's up?"}
              ref={inputChat as LegacyRef<HTMLInputElement> | undefined}
              onKeyDown={chatKeyDown}
            />
            <a
              href="#"
              ref={btnSendChat as LegacyRef<HTMLAnchorElement> | undefined}
              onClick={sendChat}
            >
              <Icons.upArrow />
            </a>
          </div>

          <TipUI chatRef={ref} user={props.user} />
        </div>
      </div>
    </>
  );
});
