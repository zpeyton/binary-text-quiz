import React, { useEffect, useRef, useState } from "react";
import {
  int2Binary,
  binary2Char,
  randomLowerCaseInt,
  refClick,
  refFocus,
  validateInput,
} from "./utils";
import { UI } from "./ui";
import { FormEvent } from "./types";

export const Quiz = () => {
  let [char, setChar] = useState("");
  let [binary, setBinary] = useState("");
  let [result, setResult] = useState(false);

  let newBtn = useRef<HTMLButtonElement>();
  let inputChar = useRef<HTMLInputElement>();

  let init = () => {
    refClick(newBtn);
  };

  useEffect(init, []);

  const newClick = (event: FormEvent) => {
    let int = randomLowerCaseInt();
    let binary = int2Binary(int);
    setBinary(binary);
    setChar("");
    refFocus(inputChar);
  };

  const charChange = (event: FormEvent) => {
    let value = validateInput(event.currentTarget.value);
    let char = binary2Char(binary);
    let result = value == char;
    setResult(result);
    setChar(value);
  };

  let context = {
    binary,
    char,
    inputChar,
    charChange,
    newClick,
    newBtn,
    result,
  };

  return <UI context={context} />;
};
