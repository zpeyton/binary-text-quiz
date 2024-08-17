import React, { useEffect, useRef, useState } from "react";
import {
  refClick,
  refFocus,
  randomBinary,
  getResult,
  validateInput,
} from "./utils";
import { UI } from "./ui";
import { FormEvent, QuizContext } from "./types";

export const Quiz = () => {
  let [char, setChar] = useState("");
  let [binary, setBinary] = useState("");
  let [result, setResult] = useState(false);

  let newBtn = useRef();
  let inputChar = useRef();

  let init = () => {
    refClick(newBtn);
  };

  useEffect(init, []);

  const newClick = (event: FormEvent) => {
    let binary = randomBinary();
    setBinary(binary);
    setChar("");
    refFocus(inputChar);
  };

  const charChange = (event: FormEvent) => {
    let value = validateInput(event.currentTarget.value);
    let result = getResult(value, binary);
    setResult(result);
    setChar(value);
  };

  let context: QuizContext = {
    binary,
    char,
    inputChar,
    charChange,
    newClick,
    newBtn,
    result,
  };

  return <UI quiz={context} />;
};
