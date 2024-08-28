import React, { LegacyRef, useEffect, useRef, useState } from "react";
import { signupAPI } from "./api";
import { Routes } from "./routes";

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

  // useEffect(() => {
  //   usernameRef?.current?.focus();
  // });

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

    //props.signup();

    let res = await signupAPI({ email, username, password });

    if (res.status == "fail") {
      console.log("Sign up fail");
      // setSignupNotice(res.message);
      setErrors([{ type: "general", message: res.message }]);
      return;
    }

    // after sign up we should return an auth_token so we can auth
    if (res.data.user.authToken) {
      localStorage.setItem("authToken", res.data.user.authToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      props.authUser();
    }
  };

  return 1 ? (
    <div>
      Become a member
      <p>
        {/* {errors.map((item) => {
            return item.type;
          })} */}
        <input
          ref={emailRef as LegacyRef<HTMLInputElement> | undefined}
          name="email"
          placeholder="email"
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
          ref={usernameRef as LegacyRef<HTMLInputElement> | undefined}
          name="username"
          placeholder="username"
          onKeyDown={inputKeyDown}
        />
        {errors.some((item) => item.type == "username") ? (
          <p>Missing username</p>
        ) : null}
      </p>
      <p>
        <input
          onKeyDown={inputKeyDown}
          ref={passwordRef as LegacyRef<HTMLInputElement> | undefined}
          name="password"
          placeholder="password"
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

    await new Routes().Login.send(props.webSocket.current, {
      username,
      password,
    });
    // props.authUser({ username, password });
  };

  return props.notice ? (
    <div>
      {props.notice}
      <p>
        {/* {errors.map((item) => {
            return item.type;
          })} */}
        <input
          ref={usernameRef as LegacyRef<HTMLInputElement> | undefined}
          name="username"
          placeholder="username"
          defaultValue={process.env.NODE_ENV != "production" ? "testuser" : ""}
          onKeyDown={inputKeyDown}
        />
        {errors.some((item) => item.type == "username") ? (
          <p>Missing username</p>
        ) : null}
      </p>
      <p>
        <input
          onKeyDown={inputKeyDown}
          ref={passwordRef as LegacyRef<HTMLInputElement> | undefined}
          name="password"
          defaultValue={process.env.NODE_ENV != "production" ? "1234" : ""}
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
