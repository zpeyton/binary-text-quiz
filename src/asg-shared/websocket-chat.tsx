import {
  React,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  Icons,
  TipUI,
} from "../asg-shared";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faComments,
  faVideo,
  faShoppingCart,
  faGift,
  faVolumeMute,
  faVolumeHigh,
  faComment,
  faAd,
} from "@fortawesome/free-solid-svg-icons";

export const WebSocketChat = forwardRef((props: any, ref) => {
  //console.debug("[WS] WebSocketChat start");

  let [chats, setChats] = useState<any>([]);
  // let [newChats, setNewChats] = useState<any>([]);

  let [members, setMembers] = useState<any>([]);
  // let [newMembers, setNewMembers] = useState<any>([]);
  // let [removeMembers, setRemoveMembers] = useState<any>([]);

  let [display, setDisplay] = useState<any>("");
  let [twoevencols, setTwoevencols] = useState<any>(false);
  let inputChat = useRef<HTMLInputElement>();
  let btnSendChat = useRef<HTMLAnchorElement>();
  let chatLog = useRef<HTMLDivElement>();

  const newChat = (json) => {
    // console.log("[WS]", "newChat", chats);
    setChats(chats.concat([json]));
  };

  const removeDupsFromObjectArray = (arr, propName) => {
    const props = arr.map((item) => item[propName]);
    // console.log("[useEffect members]", users);
    const filtered = arr.filter(
      (item, index) => !props.includes(item[propName], index + 1)
    );
    return filtered;
  };

  useImperativeHandle(ref, () => ({
    newChat(json) {
      newChat(json);
    },
    newMembers(json) {
      setMembers(members.concat([json]));
    },

    removeMembers(json) {
      let filtered = members.filter((member) => member.joined != json.quit);
      // console.log("filtered", filtered);
      setMembers(filtered);
    },

    toggle() {
      toggle();
    },
    toggleTwoevencols() {
      toggleTwoevencols();
    },

    serverDisconnected() {
      newChat({
        name: "Server",
        message: "Disconnected. Refreshing in 20 seconds",
        timestamp: new Date(),
      });
    },
  }));

  useEffect(() => {
    // console.log("[WS]", "[WebSocketChat.UseEffect]");
    props.webSocket.current.setState(props);
  }, []);

  useEffect(() => {
    chatLog.current?.scrollTo(0, chatLog.current.scrollHeight);
    //inputChat.current?.focus();
  }, [chats]);

  useEffect(() => {
    // console.log("[Chat]", "members changed", members);
    props.webSocket.current.setState(props);
    const filtered = removeDupsFromObjectArray(members, "joined");
    if (filtered.length != members.length) {
      setMembers(filtered);
    }
  }, [members]);

  const kickClick = (event) => {
    event?.preventDefault();
    let sure = confirm("Are you sure you want to kick this user?");
    if (!sure) {
      return;
    }
    let kick = event.target.getAttribute("href");
    props.webSocket.current.api.Kick.send({ kick });
  };

  let isAdmin = props.user.type == "stream";

  let Kick = (props) => {
    return isAdmin ? (
      <a onClick={kickClick} href={props.username}>
        X
      </a>
    ) : null;
  };

  const toggleTwoevencols = () => {
    setTwoevencols(twoevencols ? "" : "twoevencols");
  };

  const toggle = () => {
    setDisplay(display ? null : "hidden");
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

    let message = inputChat.current.value;
    if (message) {
      inputChat.current.value = "";
      //await sendChatAPI(msg);
      //await get();
      props.webSocket.current.api.Chat.send(message);
      // new Routes().Chat.send(props.webSocket.current, message);
      //props.webSocket.current.send({ message });
    }
  };

  const clearChat = async (event?) => {
    event?.preventDefault();

    props.webSocket.current.api.ClearChat.send({ clear: "clear" });
  };

  //console.debug("[WS] Render");
  let viewers = members.filter(
    (item) => item.joined != "alohasurfgirls" && item.joined != "zap"
  );
  return (
    <>
      <div className={"chat-ui"}>
        <div className="viewers">
          {members.length ? (
            <>
              <FontAwesomeIcon icon={faUser} /> {viewers.length}
            </>
          ) : null}
          {members &&
            members.map((item, index) => {
              return (
                <div key={index}>
                  <div>
                    {item.joined} <Kick username={item.joined} />
                  </div>
                </div>
              );
            })}
        </div>
        <div className="controls">
          <button className="toggle" onClick={toggle}>
            <FontAwesomeIcon icon={faComment} />
          </button>
          {props.user.type == "stream" ? (
            <button className="toggle" onClick={clearChat}>
              Clear Chat
            </button>
          ) : null}
        </div>

        <div className={"chat-log " + display} ref={chatLog as any}>
          {chats &&
            chats.map((item, index) => {
              return (
                <div key={index}>
                  <span>{item.name}</span>
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
              ref={inputChat as any}
              onKeyDown={chatKeyDown}
            />
            <a href="#" ref={btnSendChat as any} onClick={sendChat}>
              <Icons.upArrow />
            </a>
          </div>

          <TipUI webSocket={props.webSocket} chatRef={ref} user={props.user} />
        </div>
      </div>
    </>
  );
});
