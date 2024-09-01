import React, { useEffect, useRef, useState } from "react";
import { DEFAULT_EMAIL, DEFAULT_PASSWORD, DEFAULT_USERNAME } from ".";

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
      {props.notice}
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
  let usernameRef = useRef<HTMLInputElement>();
  let passwordRef = useRef<HTMLInputElement>();
  let [errors, setErrors] = useState<any>([]);

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

  return props.notice ? (
    <div>
      {props.notice}
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
        <p>Missing Password</p>
      ) : null}
      <button onClick={loginSubmit}>Login</button>
    </div>
  ) : null;
};
