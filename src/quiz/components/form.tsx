import React from "react";

export const NewLetterBtn = (props) => {
  return (
    <button
      className="new-letter btn btn-primary"
      ref={props.context.newBtn}
      onClick={props.context.newClick}
    >
      New Binary Code
    </button>
  );
};

export const InputLetter = (props) => {
  return (
    <input
      className="input-char"
      ref={props.context.inputChar}
      value={props.context.char}
      onChange={props.context.charChange}
    />
  );
};
