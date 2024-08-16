import renderer from "react-test-renderer";
import { Quiz } from "../src/quiz/components/quiz";
import {
  binary2Char,
  int2Binary,
  randomLowerCaseInt,
  validateInput,
} from "../src/quiz/components/utils";
import { AnswerMessage, UI } from "../src/quiz/components/ui";
import { CorrectIcon, IncorrectIcon } from "../src/quiz/components/icons";

it("Check Quiz Grades Answers Correctly", () => {
  const component = renderer.create(<Quiz />);
  const root = component.root;

  let ui = root.findByType(UI);

  let answer = root.findAllByType(AnswerMessage);

  expect(answer.length).toBe(0);

  renderer.act(() => ui.props.context.newClick());

  let char = binary2Char(ui.props.context.binary);
  let mockEvent = { currentTarget: { value: char } };

  renderer.act(() => ui.props.context.charChange(mockEvent));

  root.findByType(CorrectIcon);

  mockEvent = { currentTarget: { value: "." } };

  renderer.act(() => ui.props.context.charChange(mockEvent));

  root.findByType(IncorrectIcon);
});

it("Convert Binary to Text", () => {
  let char = binary2Char("01100001");

  expect(char).toBe("a");
});

it("Convert Int to Binary", () => {
  let binary = int2Binary(97);
  expect(binary).toBe("01100001");
});

it("Validate Input", () => {
  let input = validateInput("abcd");
  expect(input).toBe("a");
  input = validateInput("A");
  expect(input).toBe("a");
});

it("Random Lowercase Int", () => {
  let int = randomLowerCaseInt();
  expect(int).toBeGreaterThanOrEqual(97);
  expect(int).toBeLessThan(123);
});
