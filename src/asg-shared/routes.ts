import { logout } from ".";

class APIRoute {
  webSocket;
  receive;
  send;
  constructor(webSocket) {
    this.webSocket = webSocket;
  }
}

class Chat extends APIRoute {
  send = async (message) => {
    let request = {
      method: "post",
      path: "Chat",
      body: { message },
    };

    await this.webSocket.send(request);
  };

  receive = async (props) => {
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
  };
}

class User extends APIRoute {
  receive = async (props) => {
    let { data: response } = props.response;
    let { joined, quit } = response;

    console.debug("[Route.User]", response);

    await new Promise((r) => {
      let wait = setInterval(() => {
        let { chatRef } = props.ws.state;
        if (chatRef?.current) {
          clearInterval(wait);
          r(true);
        }
      }, 100);
    });

    let { current: chat } = props.ws.state.chatRef;

    if (joined) {
      chat.newMembers(response);
    }

    if (quit) {
      chat.removeMembers(response);
    }
  };
}

class VideoRoute extends APIRoute {
  send = async (body) => {
    console.log("[API.Video]", this);
    let request = {
      method: "post",
      path: "Video",
      body,
    };
    await this.webSocket.send(request);
  };

  receive = async (props) => {
    let { live } = props.response.data;
    let { user, whep } = props.ws.state;

    if (live && user.type != "stream") {
      console.log("got video update");

      setTimeout(() => {
        whep.init();
        //window.location.reload();
      }, 4000);
    }
  };
}

class Login extends APIRoute {
  send = async (creds) => {
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

    console.debug("[Routes.Login.send]", creds);

    await this.webSocket.send(request);
  };

  receive = async (props) => {
    let { status } = props.response;
    let { user } = props.response.data;
    let { setUser, setLoginNotice } = props.ws.state;

    if (status == "fail") {
      setLoginNotice("Login Failed - Try again");
      return;
    }

    localStorage.setItem("authToken", user.auth_token);
    setLoginNotice("");
    setUser(user);
  };
}

class Signup extends APIRoute {
  send = async (creds) => {
    let { username, password } = creds;
    if (!username || !password) {
      return console.log("Missing creds");
    }

    let request = {
      method: "post",
      path: "Signup",
      body: { creds },
    };

    console.debug("[Routes.Signup.send]", creds);
    await this.webSocket.send(request);
  };

  receive = async (props) => {
    let { status, message } = props.response;
    let { user } = props.response.data;
    let { setUser, setLoginNotice, setSignupNotice, setErrors } =
      props.ws.state;

    if (status == "fail") {
      setSignupNotice("Signup Failed - Try again");
      setErrors([{ type: "general", message }]);
      return;
    }

    localStorage.setItem("authToken", user.auth_token);
    setLoginNotice("");
    setUser(user);
  };
}

class Auth extends APIRoute {
  send = async (props) => {
    // console.log("[API.Auth]", this);
    let request = {
      method: "post",
      path: "Auth",
    };

    await this.webSocket.send(request);
  };

  receive = async (props) => {
    let { setUser } = props.ws.state;
    let { status, message } = props.response;
    let { user } = props.response.data;

    // for now we let guests in
    // failed auth tokens get removed
    if (status == "fail" && message == "No results") {
      logout();
      return;
    }

    setUser(user);

    return;
  };
}

class Pay {
  async send(ws, body?) {
    if (!body) {
      let request = {
        method: "get",
        path: "Pay",
      };
      await ws.send(request);
      return;
    }

    let request = {
      method: "post",
      path: "Pay",
      body,
    };

    await ws.send(request);
    return;
  }

  async receive(props) {
    let { ws, response } = props;
    let { setStripeSession, setErrorMessage, resetAddFunds } = ws.state;
    let { data: session } = response;
    let { request } = response;

    if (request.method == "get") {
      if (session.status == "fail") {
        setErrorMessage(session.message);
        return;
      }
      setStripeSession(session);
    }

    if (request.method == "post") {
      if (session.status == "fail") {
        setErrorMessage(session.message);
        return;
      }

      if (session.intent.status == "succeeded") {
        resetAddFunds(session.newBalance);
      }
    }
  }
}

class Tip extends APIRoute {
  send = async (amount, handleResponse) => {
    console.debug("[Route.Tip.send]");
    let request = {
      method: "post",
      path: "Tip",
      body: { amount },
    };
    console.debug("[Route.Tip.send]", this.webSocket);
    await this.webSocket.send(request);
    this.receive = handleResponse;
  };
}

export class Routes {
  webSocket;
  Auth;
  User;
  Chat;
  Video;
  Login;
  Signup;
  Pay;
  Tip;
  constructor(webSocket?) {
    this.webSocket = webSocket;
    this.Auth = new Auth(webSocket);
    this.User = new User(webSocket);
    this.Chat = new Chat(webSocket);
    this.Video = new VideoRoute(webSocket);
    this.Login = new Login(webSocket);
    this.Signup = new Signup(webSocket);
    this.Pay = new Pay();
    this.Tip = new Tip(webSocket);
  }
}
