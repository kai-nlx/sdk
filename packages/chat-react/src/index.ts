import { useState, useEffect, useRef, useMemo } from "react";

// Code from here on out is identical in the React and Preact packages
import { last } from "ramda";
import createConversation, {
  type Config,
  type ConversationHandler,
  shouldReinitialize,
  type Response
} from "@nlxai/chat-core";

export interface ChatHook {
  conversationHandler: ConversationHandler;
  inputValue: string;
  setInputValue: (val: string) => void;
  responses: Response[];
  waiting: boolean;
}

export const useChat = (config: Config): ChatHook => {
  const prevConversationHandler = useRef<ConversationHandler | null>(null);
  const prevConfig = useRef<Config | null>(null);

  useEffect(() => {
    prevConfig.current = config;
  }, [config]);

  const conversationHandler: ConversationHandler = useMemo(() => {
    // Prevent re-initialization if backend-related props have not changed
    if (
      // initial eslint integration
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      prevConfig.current &&
      // initial eslint integration
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      prevConversationHandler.current &&
      // initial eslint integration
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      !shouldReinitialize(prevConfig.current, config)
    ) {
      return prevConversationHandler.current;
    }
    const newHandler = createConversation(config);
    prevConversationHandler.current = newHandler;
    return newHandler;
  }, [config]);

  const [responses, setResponses] = useState<Response[]>([]);

  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    setResponses([]);
    conversationHandler.subscribe(setResponses);
    return () => {
      conversationHandler.destroy();
    };
  }, [conversationHandler]);

  const lastMessage = last<Response>(responses);
  // initial eslint integration
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const isWaiting = lastMessage ? lastMessage.type === "user" : false;

  return {
    conversationHandler,
    inputValue,
    responses,
    waiting: isWaiting,
    setInputValue
  };
};

export default useChat;
