import { random } from "lodash";

export const binary2Char = (binary: string) => {
  return String.fromCharCode(parseInt(binary, 2));
};

export const int2Binary = (int: number) => {
  let binary = int.toString(2);
  binary = leadZeroByte(binary);
  return binary;
};

export const leadZeroByte = (binary: string) => {
  return binary.length < 8 ? "0" + binary : binary;
};

export const getFirstChar = (input: string) => {
  if (input && input?.length > 1) {
    input = input[0];
  }
  return input;
};

export const validateInput = (input: string) => {
  return getFirstChar(input).toLowerCase();
};

export const getResult = (char: string, binary: string) => {
  return char === binary2Char(binary);
};

export const randomLowerCaseInt = () => {
  return random(97, 122);
};

export const randomBinary = () => {
  let int = randomLowerCaseInt();
  return int2Binary(int);
};

export const refClick = (ref: React.MutableRefObject<any>) => {
  return ref.current?.click();
};

export const refFocus = (ref: React.MutableRefObject<any>) => {
  return ref.current?.focus();
};
