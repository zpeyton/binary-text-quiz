import React from "react";
import { CORRECT, DESCRIPTION, H1, INCORRECT } from "./constants";
import { InputLetter, NewLetterBtn } from "./form";
import { CorrectIcon, IncorrectIcon } from "./icons";

export const Header = () => {
  return (
    <header>
      <h1>{H1}</h1>
      <p>{DESCRIPTION}</p>
    </header>
  );
};

export const Grid = (props) => {
  return <div className="quiz-grid">{props.children}</div>;
};

export const Col = (props) => {
  return <div className={"quiz-col " + props.type}>{props.children}</div>;
};

export const FlexCenter = (props) => {
  return <div className="flex-center">{props.children}</div>;
};

export const Binary = (props) => {
  return <div className="binary">{props.context.binary}</div>;
};

export const AnswerMessage = (props) => {
  return (
    <div className={props.context.result ? "green" : "red"}>
      {props.context.result ? <CorrectIcon /> : <IncorrectIcon />}
      {props.context.result ? CORRECT : INCORRECT}
    </div>
  );
};

export const UI = (props) => {
  return (
    <>
      <Header />
      <Grid>
        <Col type="gradient">
          <InputLetter context={props.context} />
        </Col>
        <Col type="equals">=</Col>
        <Col type="gradient">
          <Binary context={props.context} />
        </Col>
      </Grid>
      <FlexCenter>
        {props.context.char ? <AnswerMessage context={props.context} /> : null}
      </FlexCenter>
      <FlexCenter>
        <NewLetterBtn context={props.context} />
      </FlexCenter>
    </>
  );
};
