import { SyntheticEvent } from "react";

export interface FormEvent extends React.FormEvent<HTMLInputElement> {}

export interface QuizContext {
  binary: string;
  char: string;
  inputChar;
  newBtn;
  charChange: React.ChangeEventHandler<HTMLInputElement>;
  newClick: React.EventHandler<SyntheticEvent>;
  result: boolean;
  InputLetter?;
}
