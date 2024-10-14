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
  let [privateSession, setPrivateSession] = useState<any>(
    props.user.private ? true : false
  );
  let inputChat = useRef<HTMLInputElement>();
  let btnSendChat = useRef<HTMLAnchorElement>();
  let chatLog = useRef<HTMLDivElement>();
  let privateUsernameRef = useRef<any>();

  const goPrivateClick = async (event) => {
    event.preventDefault();
    let username = privateUsernameRef.current.value;
    props.webSocket.current.api.GoPrivate.send({ username });
    // setPrivateSession(true);
  };

  const endPrivateClick = async (event) => {
    event.preventDefault();
    props.webSocket.current.api.EndPrivate.send({});
    // setPrivateSession(true);
  };

  const newChat = (json) => {
    // console.log("[WS]", "newChat", chats);
    setChats(chats.concat([json]));
  };

  const deleteChat = (event) => {
    // console.log("[WS]", "newChat", chats);
    event?.preventDefault();
    let sure = confirm("Are you sure you want to delete this chat message?");
    if (!sure) {
      return;
    }
    let key = event.target.getAttribute("rel");

    props.webSocket.current.api.DeleteChat.send({ key });
    // let filtered = chats.filter((chats) => chats.timestamp != key);
    // // console.log("filtered", filtered);
    // setChats(filtered);
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

    togglePrivate(username) {
      console.log("togglePrivate", username);
      if (username) {
        console.log("togglePrivate props.user.private", props.user.private);
        props.user.private = username;
        props.setUser(props.user);

        newChat({
          name: "Server",
          message: "Private session started.",
          timestamp: new Date(),
        });
      } else {
        props.user.private = null;
        props.setUser(props.user);
      }
      console.log("end togglePrivate", props.user.private);
      setPrivateSession(username ? true : false);
      // console.log("end togglePrivate", privateSession ? false : true);
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
    props.webSocket.current.setState({
      chats,
      setChats,
    });
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

  let isAdmin = props.user.type == "stream" || props.user.type == "mod";

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

  console.debug(
    "[WS] Render chat privateSession",
    privateSession,
    "props.user",
    props.user
  );
  let viewers = members.filter(
    (item) => item.joined != "alohasurfgirls" && item.joined != "zap"
  );
  return (
    <>
      <div className={"chat-ui"}>
        {props.user.type == "stream" || props.user.type == "mod" ? (
          <div className="go-private">
            <select ref={privateUsernameRef} defaultValue={props.user.private}>
              {members &&
                members.map((item, index) => {
                  if (item.joined != props.user.username) {
                    return <option key={index}>{item.joined}</option>;
                  }
                })}
            </select>{" "}
            {props.user.private
              ? `Feed is private for ${props.user.private} `
              : null}
            {/* {props.user.private ? `private ${privateSession}` : "public"} */}
            {privateSession ? (
              <button onClick={endPrivateClick}>End Private</button>
            ) : (
              <button onClick={goPrivateClick}>Go Private</button>
            )}
          </div>
        ) : null}

        {privateSession ? null : (
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
        )}

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
                <div key={index} rel={item.timestamp}>
                  <span>{item.name}</span>
                  <span>:</span>
                  <span>{item.message}</span>
                  {props.user.type == "stream" || props.user.type == "mod" ? (
                    <button rel={item.timestamp} onClick={deleteChat}>
                      X
                    </button>
                  ) : null}
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
