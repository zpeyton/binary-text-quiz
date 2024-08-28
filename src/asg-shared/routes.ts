class Chat {
  async send(ws, message) {
    let authToken = localStorage.getItem("authToken");
    let request = {
      method: "post",
      path: "Chat",
      body: { message },
      headers: { Authorization: authToken },
    };

    await ws.send(request);
  }

  async receive(props) {
    console.debug("[Route.Chat]", props);
    let { data } = props.response;

    if (props.ws.state.chatRef?.current) {
      props.ws.state.chatRef.current.newChat(data);
    }
  }
}

class User {
  async receive(props) {
    console.debug("[Route.User]", props);
    let { response } = props;

    if (!props.ws.state.chatRef) {
      console.debug("No chat ref", response);
      await new Promise((r) => {
        let wait = setInterval(() => {
          if (props.ws.state.chatRef.current) {
            clearInterval(wait);
            r(true);
          }
        }, 100);
      });
    }

    let { joined, quit, user } = response.data;

    if (joined) {
      props.ws.state.chatRef.current.newMembers(response.data);
    }

    if (quit) {
      props.ws.state.chatRef.current.removeMembers(response.data);
    }
  }
}

class VideoRoute {
  async send(ws, message) {
    let authToken = localStorage.getItem("authToken");
    let request = {
      method: "post",
      path: "Video",
      body: message,
      headers: { Authorization: authToken },
    };
    await ws.send(request);
  }

  async receive(props) {
    let { live } = props.response.data;
    let { user } = props.ws.state;

    if (live && user.type != "stream") {
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  }
}

class Auth {
  async send(ws) {
    let authToken = localStorage.getItem("authToken");
    let request = {
      method: "post",
      path: "Auth",
      headers: { Authorization: authToken },
    };

    await ws.send(request);
  }

  async receive(props) {
    let { setUser, cleanupStreamClient, setLoginNotice } = props.ws.state;
    let { status } = props.response;
    let { user } = props.response.data;

    if (status == "fail") {
      setLoginNotice("Login");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setUser({});
      await cleanupStreamClient();
      return;
    }

    setUser(user);

    return;
  }
}

export class Routes {
  Auth = new Auth();
  User = new User();
  Chat = new Chat();
  Video = new VideoRoute();
}
