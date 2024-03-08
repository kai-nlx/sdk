import fetch from "isomorphic-fetch";

// Initial configuration used when creating a journey manager
export interface Config {
  apiKey: string;
  workspaceId: string;
  conversationId: string;
  journeyId: string;
  languageCode: string;
  debug?: boolean;
  apiUrl?: string;
}

export type Context = Record<string, any>;

// The journey manager object
export interface VoiceCompass {
  sendStep: (stepId: string, context?: Context) => Promise<void>;
}

export const create = (config: Config): VoiceCompass => {
  const conversationId = config.conversationId;

  if (!conversationId) {
    console.warn(
      'No conversation ID provided. Please call the Voice Compass client `create` method with a `conversationId` field extracted from the URL. Example code: `new URLSearchParams(window.location.search).get("cid")`',
    );
  }

  const apiUrl = config.apiUrl ?? "https://mm.nlx.ai";

  // uuid v4 regex
  const stepIdRegex =
    /^[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
  const sendStep = (stepId: string, context?: Context) => {
    if (!stepIdRegex.test(stepId)) {
      throw new Error("Invalid stepId. It should be formatted as a UUID.");
    }

    const payload = {
      stepId,
      context,
      conversationId,
      journeyId: config.journeyId,
      languageCode: config.languageCode,
    };

    return fetch(`${apiUrl}/track`, {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "x-nlx-id": config.workspaceId,
      },
      body: JSON.stringify(payload),
    })
      .then(() => {
        if (config.debug) {
          console.info(`✓ step: ${stepId}`, payload);
        }
      })
      .catch((err: Error) => {
        if (config.debug) {
          console.error(`× step: ${stepId}`, err, payload);
        }
        throw err;
      });
  };

  return { sendStep };
};
