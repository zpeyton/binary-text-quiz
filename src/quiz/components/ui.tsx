import React from "react";
import { CORRECT, DESCRIPTION, H1, INCORRECT, VERSION } from "./constants";
import { InputLetter, NewLetterBtn } from "./form";
import { CorrectIcon, IncorrectIcon } from "./icons";
import { QuizContext } from "./types";
import { useSelector } from "react-redux";

export const Header = () => {
  return (
    <header>
      <h1>{H1}</h1>
      <p>{DESCRIPTION}</p>
    </header>
  );
};

export const Footer = () => {
  return <footer>v {VERSION}</footer>;
};

export const Grid = (props) => {
  return <div className="quiz-grid">{props.children}</div>;
};

export const GridRow = (props) => {
  let quiz = props.quiz as QuizContext;

  return (
    <Grid>
      <Col type="gradient">
        {/* <quiz.InputLetter /> */}
        <InputLetter quiz={quiz} />
      </Col>
      <Col type="equals">=</Col>
      <Col type="gradient">
        <Binary binary={quiz.binary} />
      </Col>
    </Grid>
  );
};

export const Result = (props) => {
  let { quiz } = props;
  let { char, result } = props.quiz as QuizContext;
  return (
    <FlexCenter>{char ? <AnswerMessage result={result} /> : null}</FlexCenter>
  );
};

export const NewRow = (props) => {
  return (
    <FlexCenter>
      <NewLetterBtn quiz={props.quiz} />
    </FlexCenter>
  );
};

export const Col = (props) => {
  return <div className={"quiz-col " + props.type}>{props.children}</div>;
};

export const FlexCenter = (props) => {
  return <div className="flex-center">{props.children}</div>;
};

export const Binary = (props) => {
  return <div className="binary">{props.binary}</div>;
};

export const Alert = (props) => {
  return <div role="alert">{props.message}</div>;
};

export const CorrectUI = () => {
  return (
    <div className="green">
      <CorrectIcon />
      <Alert message={CORRECT} />
    </div>
  );
};

export const IncorrectUI = () => {
  return (
    <div className="red">
      <IncorrectIcon />
      <Alert message={INCORRECT} />
    </div>
  );
};

export const AnswerMessage = (props) => {
  return props.result ? <CorrectUI /> : <IncorrectUI />;
};

export const Content = (props) => {
  let { quiz } = props;

  return (
    <>
      <GridRow quiz={quiz} />
      <Result quiz={quiz} />
      <NewRow quiz={quiz} />
    </>
  );
};

export const UI = (props) => {
  let { quiz } = props;
  return (
    <>
      <Header />
      <Content quiz={quiz} />
      <Footer />
    </>
  );
};
