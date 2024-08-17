import React from "react";
import { INPUTCHARLABEL } from "./constants";
import { QuizContext } from "./types";

export const NewLetterBtn = (props) => {
  let { newBtn, newClick } = props.quiz as QuizContext;

  return (
    <button
      className="new-letter btn btn-primary"
      ref={newBtn}
      onClick={newClick}
    >
      New Binary Code
    </button>
  );
};

export const InputLetter = (props) => {
  let { inputChar, binary, char, charChange } = props.quiz as QuizContext;
  return (
    <input
      className="input-char"
      ref={inputChar}
      aria-label={INPUTCHARLABEL + binary}
      value={char}
      onChange={charChange}
    />
  );
};
