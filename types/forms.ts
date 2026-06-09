export type FormId = string;
export type QuestionId = string;
export type ChoiceId = string;

export type Choice = {
  id: ChoiceId;
  label: string;
};

export type Question = {
  id: QuestionId;
  text: string;
  choices: Choice[];
  previousQuestionId?: QuestionId;
  nextQuestionId?: QuestionId;
  acceptedChoiceIds: ChoiceId[];
};

export type Form = {
  id: FormId;
  startQuestionId: QuestionId;
  questions: Question[];
};

export type UserAnswer = {
  questionId: QuestionId;
  choiceId: ChoiceId;
  isAccepted: boolean;
};

export type UserFormResponseStatus =
  | "in_progress"
  | "disqualified"
  | "calendar_exposed";

export type UserFormResponse = {
  id: string;
  formId: FormId;
  answers: UserAnswer[];
  status: UserFormResponseStatus;
  isCalendarExposed: boolean;
};

export type QualifiedContact = {
  name: string;
  email: string;
  phone?: string;
};
