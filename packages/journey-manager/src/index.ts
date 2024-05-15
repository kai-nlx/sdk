import { type Config, type Client, create } from "@nlxai/voice-compass";
import { find, decode, type Query, type EncodedQuery } from "./queries";
export {
  type EncodedQuery,
  type Method,
  type SerializedRegex,
} from "./queries";

/**
 * Step ID
 */
export type StepId = string;

/**
 * URL match condition
 */
export interface UrlCondition {
  /**
   * Condition operator
   */
  operator: "eq" | "neq" | "suffix" | "prefix" | "contains" | "not_contains";
  /**
   * Condition value
   */
  value: string;
  // TODO: add regex match condition
}

/**
 * A single trigger
 */
export interface Trigger {
  /**
   * Event
   */
  event: "pageLoad" | "click";
  /**
   * A query identifying the element
   */
  query?: EncodedQuery;
  /**
   * A flag specifying whether the trigger should only fire a single time
   */
  once?: boolean;
  /**
   * URL condition
   */
  urlCondition?: UrlCondition;
}

/**
 * A record of triggers
 */
export type Triggers = Record<StepId, Trigger>;

interface LoadStep {
  stepId: StepId;
  once?: boolean;
  urlCondition?: UrlCondition;
}

interface ClickStep {
  stepId: StepId;
  query: Query;
  once?: boolean;
  urlCondition?: UrlCondition;
}

const matchesUrlCondition = (urlCondition: UrlCondition): boolean => {
  const url = window.location.href;
  if (urlCondition.operator === "eq") {
    return url === urlCondition.value;
  }
  if (urlCondition.operator === "neq") {
    return url !== urlCondition.value;
  }
  if (urlCondition.operator === "prefix") {
    return url.startsWith(urlCondition.value);
  }
  if (urlCondition.operator === "suffix") {
    return url.endsWith(urlCondition.value);
  }
  if (urlCondition.operator === "contains") {
    return url.includes(urlCondition.value);
  }
  if (urlCondition.operator === "not_contains") {
    return !url.includes(urlCondition.value);
  }
  return false;
};

const localStorageKey = (conversationId: string): string =>
  `jb-triggered-steps-${conversationId}`;

const saveTriggeredSteps = (conversationId: string, steps: string[]): void => {
  localStorage.setItem(localStorageKey(conversationId), JSON.stringify(steps));
};

const getTriggeredSteps = (conversationId: string): string[] => {
  try {
    const jsonString = localStorage.getItem(localStorageKey(conversationId));
    if (jsonString == null) {
      return [];
    }
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error("Triggered steps must be an array");
    }
    return parsed;
  } catch (_err) {
    return [];
  }
};

/**
 * Created by {@link run}.
 */
export interface RunOutput {
  /**
   * Stop running the journey, removing all event listeners
   */
  teardown: () => void;
  /**
   * The regular multimodal SDK client
   */
  client: Client;
}

/**
 * Configuration for the run method
 */
export interface RunProps {
  /**
   * The regular multimodal configuration
   */
  config: Config;
  /**
   * The triggers dictionary, downloaded from the Dialog Studio desktop app
   */
  triggers: Triggers;
  /**
   * Digression detection callback
   */
  onDigression?: (client: Client) => void;
}

/**
 * Run the multimodal journey
 * @param props - The run configuration object
 * @returns an object containing a teardown function and the multimodal client.
 */
export const run = (props: RunProps): RunOutput => {
  const client = create(props.config);

  const triggeredSteps = getTriggeredSteps(props.config.conversationId);

  // If all triggers have a URL constraint set and none match the current URL, fire a digression calback
  if (
    props?.onDigression != null &&
    !Object.values(props.triggers).some(
      (trigger) => trigger.urlCondition == null,
    )
  ) {
    if (
      Object.entries(props.triggers).find(
        ([_step, trigger]) =>
          trigger.urlCondition != null &&
          matchesUrlCondition(trigger.urlCondition),
      ) == null
    ) {
      props.onDigression(client);
    }
  }

  const sendStep = (stepId: string, once: boolean): void => {
    if (triggeredSteps.includes(stepId)) {
      if (once) {
        return;
      }
    } else {
      triggeredSteps.push(stepId);
      saveTriggeredSteps(props.config.conversationId, triggeredSteps);
    }
    client.sendStep(stepId).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn(err);
    });
  };

  const loadSteps: LoadStep[] = Object.entries(props.triggers).reduce(
    (prev: LoadStep[], [stepId, trigger]: [StepId, Trigger]) => {
      if (trigger.event === "pageLoad") {
        return [...prev, { stepId, urlCondition: trigger.urlCondition }];
      }
      return prev;
    },
    [],
  );

  loadSteps.forEach(({ stepId, urlCondition, once }) => {
    if (urlCondition != null && !matchesUrlCondition(urlCondition)) {
      return;
    }
    sendStep(stepId, once ?? false);
  });

  const clickSteps: ClickStep[] = Object.entries(props.triggers).reduce(
    (prev: ClickStep[], [stepId, trigger]: [StepId, Trigger]) => {
      if (trigger.event === "click" && trigger.query != null) {
        const newEntry: ClickStep = {
          stepId,
          query: decode(trigger.query),
          urlCondition: trigger.urlCondition,
        };
        return [...prev, newEntry];
      }
      return prev;
    },
    [],
  );

  const handleGlobalClickForAnnotations = async (ev: any): Promise<void> => {
    const targets = await Promise.all(
      clickSteps
        .filter(
          ({ urlCondition }) =>
            urlCondition == null || matchesUrlCondition(urlCondition),
        )
        .map(async ({ stepId, query }) => {
          try {
            return {
              stepId,
              query,
              elements: await find(query),
            };
          } catch (e) {
            return { stepId, query };
          }
        }),
    );
    const node = ev.target;
    const clickStep:
      | (ClickStep & {
          /**
           *
           */
          elements?: HTMLElement[];
        })
      | undefined = targets.find(({ elements }) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      (elements ?? []).some((element: HTMLElement) => element.contains(node)),
    );
    if (clickStep != null) {
      sendStep(clickStep.stepId, clickStep.once ?? false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises --  initial eslint integration: disable all existing eslint errors
  document.addEventListener("click", handleGlobalClickForAnnotations);

  return {
    client,
    teardown: () => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises --  initial eslint integration: disable all existing eslint errors
      document.removeEventListener("click", handleGlobalClickForAnnotations);
    },
  };
};
