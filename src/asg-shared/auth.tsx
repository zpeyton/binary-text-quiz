import React, { useEffect, useRef, useState } from "react";
import { DEFAULT_EMAIL, DEFAULT_PASSWORD, DEFAULT_USERNAME, logout } from ".";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserPlus, faUsers } from "@fortawesome/free-solid-svg-icons";

export const SignupUI = (props) => {
  let usernameRef = useRef<HTMLInputElement>();
  let passwordRef = useRef<HTMLInputElement>();
  let emailRef = useRef<HTMLInputElement>();
  let [errors, setErrors] = useState<any>([]);

  let inputKeyDown = (event) => {
    if (event.keyCode == 13) {
      signupSubmit();
    }
  };

  let signupSubmit = async () => {
    if (!emailRef.current || !usernameRef.current || !passwordRef.current) {
      return;
    }

    let email = emailRef.current.value;
    let username = usernameRef.current.value;
    let password = passwordRef.current.value;
    let errorsList: any = [];

    if (!username) {
      setErrors(errorsList.push({ type: "username" }));
    }

    if (!email) {
      setErrors(errorsList.push({ type: "email" }));
    }

    if (!password) {
      setErrors(errorsList.push({ type: "password" }));
    }

    if (errorsList.length) {
      setErrors(errorsList);
      return;
    }

    let { current: webSocket } = props.webSocket;

    webSocket.setState({ setErrors });

    webSocket.api.Signup.send({
      email,
      username,
      password,
    });
  };

  return 1 ? (
    <div>
      <FontAwesomeIcon icon={faUserPlus} /> {props.notice}
      <p>
        {/* {errors.map((item) => {
            return item.type;
          })} */}
        <input
          ref={emailRef as any}
          name="email"
          placeholder="email"
          defaultValue={DEFAULT_EMAIL}
          onKeyDown={inputKeyDown}
        />
        {errors.some((item) => item.type == "email") ? (
          <p>Missing Email</p>
        ) : null}
      </p>
      <p>
        {/* {errors.map((item) => {
            return item.type;
          })} */}
        <input
          ref={usernameRef as any}
          name="username"
          placeholder="username"
          defaultValue={DEFAULT_USERNAME}
          onKeyDown={inputKeyDown}
        />
        {errors.some((item) => item.type == "username") ? (
          <p>Missing username</p>
        ) : null}
      </p>
      <p>
        <input
          onKeyDown={inputKeyDown}
          ref={passwordRef as any}
          name="password"
          defaultValue={DEFAULT_PASSWORD}
          placeholder="password"
          type="password"
        />
      </p>
      {errors.some((item) => item.type == "password") ? (
        <p>Missing Password</p>
      ) : null}
      {errors.some((item) => item.type == "general") ? (
        <p>{errors[0].message}</p>
      ) : null}
      <button onClick={signupSubmit}>Join</button>
    </div>
  ) : null;
};

export const LoginUI = (props) => {
  let emailRef = useRef<HTMLInputElement>();
  let usernameRef = useRef<HTMLInputElement>();
  let passwordRef = useRef<HTMLInputElement>();
  let newPasswordRef = useRef<HTMLInputElement>();
  let newPasswordConfirmRef = useRef<HTMLInputElement>();
  let [forgot, setForgot] = useState<any>(false);
  let [forgotResponse, setForgotResponse] = useState<any>(true);
  let [errors, setErrors] = useState<any>([]);
  let [resetPass, setResetPass] = useState(props.resetPass);
  let inputKeyDown = (event) => {
    if (event.keyCode == 13) {
      loginSubmit();
    }
  };

  useEffect(() => {
    usernameRef?.current?.focus();
  });

  let loginSubmit = async () => {
    if (!usernameRef.current || !passwordRef.current) {
      return;
    }

    let username = usernameRef.current.value;
    let password = passwordRef.current.value;
    let errorsList: any = [];

    if (!username) {
      setErrors(errorsList.push({ type: "username" }));
    }

    if (!password) {
      setErrors(errorsList.push({ type: "password" }));
    }

    if (errorsList.length) {
      setErrors(errorsList);
      return;
    }

    let { current: webSocket } = props.webSocket;
    // console.log("[LoginUI] websocket");
    webSocket.api.Login.send({ username, password });
    // await new Routes().Login.send(props.webSocket.current, );
  };

  const forgotPassClick = async (event) => {
    event.preventDefault();
    setForgot(true);
  };

  const forgotSubmit = async (event) => {
    event.preventDefault();
    let email = emailRef.current?.value;
    console.log(email);
    // setForgot(true);
    let { current: webSocket } = props.webSocket;
    let forgotResponse = () => {
      setForgotResponse(
        "If your email is in our database you will receive a link to reset your password shortly."
      );
    };

    webSocket.api.ForgotPass.send({ email }, forgotResponse);
  };

  const resetSubmit = async (event) => {
    event.preventDefault();
    let newPassword = newPasswordRef.current?.value;
    let newPasswordConfirm = newPasswordConfirmRef.current?.value;

    if (!newPassword || !newPasswordConfirm) {
      alert("Please enter a new password and confirm");
      return;
    }

    if (newPassword != newPasswordConfirm) {
      alert("Passwords do not match");
      return;
    }

    let resetResponse = () => {
      // setForgotResponse(
      //   "If your email is in our database you will receive a link to reset your password shortly."
      // );
      console.log("resetResponse");
      setForgotResponse("Your password has been reset.");
    };

    let auth_token = resetPass;

    let { current: webSocket } = props.webSocket;

    webSocket.api.ResetPass.send(
      { auth_token, password: newPassword },
      resetResponse
    );
  };

  return props.notice ? (
    <div>
      {!forgot && !resetPass ? (
        <>
          <FontAwesomeIcon icon={faUser} /> {props.notice}
          <p>
            {/* {errors.map((item) => {
            return item.type;
          })} */}

            <input
              ref={usernameRef as any}
              name="username"
              placeholder="username"
              defaultValue={DEFAULT_USERNAME}
              onKeyDown={inputKeyDown}
            />
            {errors.some((item) => item.type == "username") ? (
              <p>Missing username</p>
            ) : null}
          </p>
          <p>
            <input
              onKeyDown={inputKeyDown}
              ref={passwordRef as any}
              name="password"
              type="password"
              defaultValue={DEFAULT_PASSWORD}
              placeholder="password"
            />
          </p>
          {errors.some((item) => item.type == "password") ? (
            <p>Missing Password!</p>
          ) : null}
          <button onClick={loginSubmit}>Login</button>
          <p>
            <a href="@" onClick={forgotPassClick}>
              Forgot Password?
            </a>
          </p>
        </>
      ) : null}
      {resetPass ? (
        <>
          <FontAwesomeIcon icon={faUser} /> Reset Pass
          <p>
            <input ref={newPasswordRef as any} placeholder="new password" />
          </p>
          <p>
            <input
              ref={newPasswordConfirmRef as any}
              placeholder="new password confirm"
            />
          </p>
          <p>{forgotResponse}</p>
          <button onClick={resetSubmit}>Reset</button>
        </>
      ) : null}
      {forgot ? (
        <>
          <FontAwesomeIcon icon={faUser} /> Forgot Pass
          <p>
            <input ref={emailRef as any} placeholder="email" />
          </p>
          <p>{forgotResponse}</p>
          <p>
            <button onClick={forgotSubmit}>Forgot</button>
          </p>
        </>
      ) : null}
    </div>
  ) : null;
};

export const AuthUI = (props) => {
  let { user, loginNotice, setLoginNotice, signupNotice, webSocket } = props;

  // let logoutClick = (event) => {
  //   event.preventDefault();
  //   logout();
  // };

  let loginClick = (event) => {
    event.preventDefault();
    setLoginNotice("Login");
  };

  let cancelLoginSignupClick = (event) => {
    event.preventDefault();
    setLoginNotice("");
  };

  const LoginSignupBtn = (props) => {
    return (
      <>
        <a onClick={loginClick} className="login">
          <FontAwesomeIcon icon={faUser} /> Login |{" "}
          <FontAwesomeIcon icon={faUserPlus} /> Sign up
        </a>
      </>
    );
  };

  let loggedIn =
    user.type == "member" || user.type == "stream" || user.type == "mod";

  return loggedIn ? (
    <></>
  ) : (
    <>
      {loginNotice ? (
        <div className="waiting">
          <LoginUI
            notice={loginNotice}
            webSocket={webSocket}
            resetPass={props.resetPass}
          />
          {props.resetPass ? null : (
            <SignupUI notice={signupNotice} webSocket={webSocket} />
          )}

          <button
            className="cancel-login-signup"
            onClick={cancelLoginSignupClick}
          >
            X
          </button>
        </div>
      ) : (
        <LoginSignupBtn />
      )}
    </>
  );
};
