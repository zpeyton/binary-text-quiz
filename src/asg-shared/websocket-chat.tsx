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

export const WebSocketChat = forwardRef((props: any, ref) => {
  //console.debug("[WS] WebSocketChat start");

  let [chats, setChats] = useState<any>([]);
  let [newChats, setNewChats] = useState<any>([]);

  let [members, setMembers] = useState<any>([]);
  let [newMembers, setNewMembers] = useState<any>([]);
  let [removeMembers, setRemoveMembers] = useState<any>([]);

  let [display, setDisplay] = useState<any>("");
  let [twoevencols, setTwoevencols] = useState<any>(false);
  let inputChat = useRef<HTMLInputElement>();
  let btnSendChat = useRef<HTMLAnchorElement>();
  let chatLog = useRef<HTMLDivElement>();

  useImperativeHandle(ref, () => ({
    newChat(json) {
      // console.log("[WS]", "newChat");
      setNewChats([json]);
    },
    newMembers(json) {
      // console.log("[WS]", "newMembers");
      setNewMembers([json]);
    },

    removeMembers(json) {
      setRemoveMembers(json);
    },

    toggle() {
      toggle();
    },
    toggleTwoevencols() {
      toggleTwoevencols();
    },

    serverDisconnected() {
      setNewChats([
        {
          name: "Server",
          message: "Disconnected. Refreshing in 20 seconds",
          timestamp: new Date(),
        },
      ]);
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
    setChats(chats.concat(newChats));
  }, [newChats]);

  useEffect(() => {
    // console.log("[Chat]", "members changed", members);
    const users = members.map(({ joined }) => joined);
    // console.log("[useEffect members]", users);
    const filtered = members.filter(
      ({ joined }, index) => !users.includes(joined, index + 1)
    );
    // console.log("[useEffect members] filtered", filtered);
    if (filtered.length != members.length) {
      setMembers(filtered);
    }
  }, [members]);

  useEffect(() => {
    props.webSocket.current.setState(props);
    setMembers(members.concat(newMembers));
  }, [newMembers]);

  useEffect(() => {
    props.webSocket.current.setState(props);
    let filtered = members.filter(
      (member) => member.joined != removeMembers.quit
    );
    // console.log("filtered", filtered);
    setMembers(filtered);
  }, [removeMembers]);

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

  //console.debug("[WS] Render");

  return (
    <>
      <div className={"chat-ui"}>
        <div className="controls">
          {props.user.type != "stream" ? (
            <button className="toggle" onClick={toggleVolume}>
              Unmute
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
        <div>
          {members.length ? <>Users: {members.length}</> : null}
          {members &&
            members.map((item, index) => {
              return (
                <div key={index}>
                  <span>{item.joined}</span>
                </div>
              );
            })}
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
