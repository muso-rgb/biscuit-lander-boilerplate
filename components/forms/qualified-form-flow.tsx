"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Loader2, XCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Form, Question } from "@/types/forms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getFallbackContactEmail } from "@/content/fallback-contact";
import {
  clearSessionStorageKey,
  SESSION_STORAGE_LEAD_PREFIX,
  useSessionStorageState,
} from "@/hooks/use-session-storage-state";
import { ApplicationStepIndicator } from "./application-step-indicator";
import { ContactCapture } from "./contact-capture";
import { LockedCalendarPreview } from "./locked-calendar-preview";

type QualifiedFormFlowProps = {
  companyId: string;
  traceId?: string;
  fallbackEmail?: string;
};

type ResponseForQuestion = {
  answers: Array<{ questionId: string }>;
  formSnapshot?: Form;
};

function getQuestionPath(form: Form): Question[] {
  const questionsById = new Map(form.questions.map((question) => [question.id, question]));
  const path: Question[] = [];
  const visited = new Set<string>();
  let currentId: string | undefined = form.startQuestionId;

  while (currentId && !visited.has(currentId)) {
    const question = questionsById.get(currentId);
    if (!question) break;
    path.push(question);
    visited.add(currentId);
    currentId = question.nextQuestionId;
  }

  return path;
}

function getCurrentQuestion(
  form: Form,
  response: ResponseForQuestion | null,
): Question | null {
  const activeForm = response?.formSnapshot ?? form;
  const questionsById = new Map(
    activeForm.questions.map((question) => [question.id, question]),
  );

  if (!response || response.answers.length === 0) {
    return questionsById.get(activeForm.startQuestionId) ?? null;
  }

  const lastAnswer = response.answers[response.answers.length - 1];
  let nextQuestionId = questionsById.get(lastAnswer.questionId)?.nextQuestionId;
  const answeredQuestionIds = new Set(
    response.answers.map((answer) => answer.questionId),
  );

  while (nextQuestionId) {
    const nextQuestion = questionsById.get(nextQuestionId);
    if (!nextQuestion) return null;
    if (!answeredQuestionIds.has(nextQuestion.id)) return nextQuestion;
    nextQuestionId = nextQuestion.nextQuestionId;
  }

  return null;
}

export function QualifiedFormFlow({
  companyId,
  traceId,
  fallbackEmail,
}: QualifiedFormFlowProps) {
  const published = useQuery(api.forms.queries.getPublishedFormForPublic, { companyId });
  const responseStorageKey = companyId
    ? `${SESSION_STORAGE_LEAD_PREFIX}${companyId}:responseId`
    : null;
  const [responseId, setResponseId] = useSessionStorageState<string | null>(
    responseStorageKey,
    null,
  );
  const [answering, setAnswering] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const startResponse = useMutation(api.forms.mutations.startUserFormResponse);
  const answerQuestion = useMutation(api.forms.mutations.answerQuestion);
  const saveContact = useMutation(api.forms.mutations.saveQualifiedContact);
  const response = useQuery(
    api.forms.queries.getUserFormResponse,
    responseId ? { responseId } : "skip",
  );

  const form = published?.form as Form | null | undefined;
  const resolvedFallbackEmail = getFallbackContactEmail(fallbackEmail);
  const contactStorageKey = responseId
    ? `${SESSION_STORAGE_LEAD_PREFIX}${companyId}:contact:${responseId}`
    : null;

  useEffect(() => {
    if (!published?.form || !published.formId || responseId) return;
    let canceled = false;
    void startResponse({ companyId, formId: published.formId, traceId })
      .then((result) => {
        if (!canceled) setResponseId(result.responseId);
      })
      .catch((err) => {
        if (!canceled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      canceled = true;
    };
  }, [
    companyId,
    published?.form,
    published?.formId,
    responseId,
    setResponseId,
    startResponse,
    traceId,
  ]);

  const currentQuestion = useMemo(() => {
    if (!form) return null;
    return getCurrentQuestion(form, response ?? null);
  }, [form, response]);

  const totalQuestionCount = useMemo(() => {
    if (!form) return 0;
    const activeForm = (response?.formSnapshot as Form | undefined) ?? form;
    return getQuestionPath(activeForm).length || activeForm.questions.length;
  }, [form, response]);

  const progress = useMemo(() => {
    if (!form || form.questions.length === 0 || !response) return 0;
    return Math.min(100, (response.answers.length / totalQuestionCount) * 100);
  }, [form, response, totalQuestionCount]);

  if (published === undefined) {
    return (
      <section className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </section>
    );
  }

  if (!published?.form || !published.formId) {
    return (
      <Alert>
        <AlertCircle className="size-4" />
        <AlertTitle>Form unavailable</AlertTitle>
        <AlertDescription>This company does not have a published application form yet.</AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load form</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!responseId || response === undefined) {
    return (
      <section className="flex items-center gap-3 rounded-lg border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading application...
      </section>
    );
  }

  if (response === null) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Response unavailable</AlertTitle>
        <AlertDescription>
          This application response could not be found. Reload the form to start again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!form) {
    return (
      <Alert>
        <AlertCircle className="size-4" />
        <AlertTitle>Form unavailable</AlertTitle>
        <AlertDescription>This company does not have a published application form yet.</AlertDescription>
      </Alert>
    );
  }

  if (response.status === "disqualified") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border bg-card p-5 text-center shadow-sm"
      >
        <XCircle className="mx-auto mb-3 size-8 text-destructive" />
        <h1 className="text-lg font-semibold">Application closed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Calendar booking is not available for this response.
        </p>
      </motion.section>
    );
  }

  if (response.status === "calendar_exposed") {
    return (
      <div className="space-y-5">
        <ApplicationStepIndicator activeStep="book" />
        <BookingFlow
          companyId={companyId}
          traceId={traceId}
          formResponseId={responseId}
          variant="qualified"
          fallbackEmail={resolvedFallbackEmail}
          contactCaptured={!!response.contact}
          contactPanel={
            !response.contact ? (
              <ContactCapture
                title="Add your details"
                description="We need these details to send the calendar invite."
                submitLabel="Save details"
                className="border-0 bg-transparent p-0 shadow-none"
                loading={contactSaving}
                error={contactError}
                storageKey={contactStorageKey}
                onSubmit={async (contact) => {
                  setContactSaving(true);
                  setContactError(null);
                  try {
                    await saveContact({ responseId, ...contact });
                    clearSessionStorageKey(contactStorageKey);
                  } catch (err) {
                    setContactError(err instanceof Error ? err.message : String(err));
                  } finally {
                    setContactSaving(false);
                  }
                }}
              />
            ) : null
          }
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <Alert>
        <AlertCircle className="size-4" />
        <AlertTitle>No question available</AlertTitle>
        <AlertDescription>This form has no remaining question to display.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <ApplicationStepIndicator activeStep="form" />
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm lg:grid lg:grid-cols-2">
        <section className="border-b p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="mb-5 space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">
              Step {response.answers.length + 1} of {totalQuestionCount}
            </p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <h1 className="text-xl font-semibold leading-snug">{currentQuestion.text}</h1>
              <div className="grid gap-2">
                {currentQuestion.choices.map((choice) => (
                  <Button
                    key={choice.id}
                    type="button"
                    variant="outline"
                    className="h-auto justify-start whitespace-normal py-3 text-left"
                    disabled={answering}
                    onClick={async () => {
                      setAnswering(true);
                      setError(null);
                      try {
                        await answerQuestion({
                          responseId,
                          questionId: currentQuestion.id,
                          choiceId: choice.id,
                        });
                      } catch (err) {
                        setError(err instanceof Error ? err.message : String(err));
                      } finally {
                        setAnswering(false);
                      }
                    }}
                  >
                    {choice.label}
                  </Button>
                ))}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </motion.div>
          </AnimatePresence>
        </section>
        <LockedCalendarPreview className="hidden lg:flex" />
      </div>
      <LockedCalendarPreview className="lg:hidden" />
    </div>
  );
}
