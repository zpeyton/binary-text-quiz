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

    await new Promise((r) => {
      let wait = setInterval(() => {
        if (props.ws.state.chatRef?.current) {
          clearInterval(wait);
          r(true);
        }
      }, 100);
    });

    props.ws.state.chatRef.current.newChat(data);
  }
}

class User {
  async receive(props) {
    console.debug("[Route.User]", props);
    let { response } = props;

    await new Promise((r) => {
      let wait = setInterval(() => {
        let { chatRef } = props.ws.state;
        if (chatRef.current) {
          clearInterval(wait);
          r(true);
        }
      }, 100);
    });

    let { joined, quit } = response.data;
    let { current: chat } = props.ws.state.chatRef;

    if (joined) {
      chat.newMembers(response.data);
    }

    if (quit) {
      chat.removeMembers(response.data);
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

class Login {
  async send(ws, creds) {
    let { username, password } = creds;
    if (!username || !password) {
      return console.log("Missing creds");
    }

    let request = {
      method: "post",
      path: "Login",
      body: { creds },
      headers: {},
    };
    console.debug("[Routes.Login.send]", ws, creds);
    await ws.send(request);
  }

  async receive(props) {
    let { status } = props.response;
    let { user } = props.response.data;
    let { setUser, cleanupStreamClient, setLoginNotice } = props.ws.state;

    if (status == "fail") {
      setLoginNotice("Login Failed - Try again");
      return;
    }

    localStorage.setItem("authToken", user.auth_token);
    setLoginNotice("");
    setUser(user);
  }
}

class Auth {
  async send(ws) {
    let authToken = localStorage.getItem("authToken");
    // do we auth here even if there
    // is no auth token?
    // if(!authToken){
    //     return;
    // }
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

    // for now we let them in
    // need to show login button now

    if (status == "fail") {
      //   setLoginNotice("Login");
      //   localStorage.removeItem("authToken");
      //   localStorage.removeItem("user");
      //   setUser({});
      //   await cleanupStreamClient();
      //   return;
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
  Login = new Login();
}
