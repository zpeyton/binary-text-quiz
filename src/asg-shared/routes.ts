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
        if (chatRef?.current) {
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

class Signup {
  async send(ws, creds) {
    let { username, password } = creds;
    if (!username || !password) {
      return console.log("Missing creds");
    }

    let request = {
      method: "post",
      path: "Signup",
      body: { creds },
      headers: {},
    };

    console.debug("[Routes.Signup.send]", ws, creds);
    await ws.send(request);
  }

  async receive(props) {
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

class Pay {
  async send(ws, body?) {
    let authToken = localStorage.getItem("authToken");
    let headers = { Authorization: authToken };
    if (!body) {
      let request = {
        method: "get",
        path: "Pay",
        headers,
      };
      await ws.send(request);
      return;
    }

    let request = {
      method: "post",
      path: "Pay",
      headers,
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

class Tip {
  async send(ws, body?) {
    let authToken = localStorage.getItem("authToken");
    let headers = { Authorization: authToken };
    let request = {
      method: "post",
      path: "Tip",
      headers,
      body,
    };

    await ws.send(request);
  }
  async receive(props) {
    let { ws, response } = props;
    let { setNoMoney, setErrors, setBalance } = ws.state;
    let { chatRef } = ws.state;

    if (response.status == "fail") {
      console.log("Send Tip failed");
      if (response.message == "No money") {
        setNoMoney(true);
        chatRef.current.toggleTwoevencols();
      }

      setErrors([response]);
      return;
    }

    if (response.status == "OK") {
      let { newBalance } = response.data;
      setBalance(newBalance);
      return;
    }
  }
}

export class Routes {
  Auth = new Auth();
  User = new User();
  Chat = new Chat();
  Video = new VideoRoute();
  Login = new Login();
  Signup = new Signup();
  Pay = new Pay();
  Tip = new Tip();
}
