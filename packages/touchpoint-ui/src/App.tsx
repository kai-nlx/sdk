/* eslint-disable jsdoc/require-jsdoc */
import {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  useCallback,
  forwardRef,
  useMemo,
  type ReactElement,
} from "react";
import {
  type ConversationHandler,
  createConversation,
  type Subscriber,
  type Response,
  type Config,
  type BotResponse,
} from "@nlxai/chat-core";
import { clsx } from "clsx";
import { findLastIndex } from "ramda";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  type AgentState,
  DisconnectButton,
} from "@livekit/components-react";
import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import { AccessToken } from "livekit-server-sdk";
import type { AccessTokenOptions, VideoGrant } from "livekit-server-sdk";
import { AnimatePresence, motion } from "framer-motion";

import { LaunchButton } from "./components/ui/LaunchButton";
import { ChatHeader } from "./components/ChatHeader";
import { ChatSettings } from "./components/ChatSettings";
import { ChatMessages } from "./components/ChatMessages";
// import ChatInput from "./components/ChatInput";
import {
  type ColorMode,
  type WindowSize,
  // type ChoiceMessage,
  type Theme,
  type CustomModalityComponent,
} from "./types";
import { Context } from "./context";
import { CustomPropertiesContainer } from "./components/Theme";

export interface Props {
  config: Config;
  windowSize?: WindowSize;
  colorMode?: ColorMode;
  /**
   * URL of icon used to display the brand in the chat header
   */
  brandIcon?: string;
  /**
   * URL of icon used on the launch icon in the bottom right when the experience is collapsed
   */
  launchIcon?: string;
  theme?: Partial<Theme>;
  customModalities?: Record<string, CustomModalityComponent<any>>;
}

export interface AppRef {
  expand: () => void;
  collapse: () => void;
  getConversationHandler: () => ConversationHandler | null;
}

export interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
}

const isDev = import.meta.env.DEV;

export function CloseIcon(): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.33398 3.33334L12.6673 12.6667M12.6673 3.33334L3.33398 12.6667"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

function onDeviceFailure(): void {
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab",
  );
}

async function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  metadata?: string | undefined,
): Promise<string> {
  const at = new AccessToken(
    import.meta.env.VITE_LIVEKIT_API_KEY as string,
    import.meta.env.VITE_LIVEKIT_API_SECRET as string,
    {
      ...userInfo,
      ttl: "15m",
      metadata,
    },
  );

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  at.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: import.meta.env.VITE_AGENT_NAME,
      }),
    ],
  });
  return await at.toJwt();
}

function SimpleVoiceAssistant(props: {
  onStateChange: (state: AgentState) => void;
}): ReactElement {
  const { state, audioTrack } = useVoiceAssistant();
  useEffect(() => {
    props.onStateChange(state);
  }, [props, state]);
  return (
    <div className="h-[300px] w-[300px] max-w-[90vw] mx-auto">
      <BarVisualizer
        state={state}
        barCount={5}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ minHeight: 24 }}
      />
    </div>
  );
}

function ControlBar(props: {
  onConnectButtonClicked: () => Promise<void>;
  agentState: AgentState;
}): ReactElement {
  /**
   * Use Krisp background noise reduction when available.
   * Note: This is only available on Scale plan, see {@link https://livekit.io/pricing | LiveKit Pricing} for more details.
   */
  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp
      .setNoiseFilterEnabled(true)
      .then(() => {})
      .catch(() => {});
  }, []);

  return (
    <div className="relative h-[100px]">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="absolute px-4 py-2 text-black uppercase -translate-x-1/2 bg-white rounded-md left-1/2"
            onClick={() => {
              props
                .onConnectButtonClicked()
                .then(() => {})
                .catch(() => {});
            }}
          >
            Start a conversation
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {props.agentState !== "disconnected" &&
          props.agentState !== "connecting" && (
            <motion.div
              initial={{ opacity: 0, top: "10px" }}
              animate={{ opacity: 1, top: 0 }}
              exit={{ opacity: 0, top: "-10px" }}
              transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
              className="absolute flex justify-center h-8 -translate-x-1/2 left-1/2"
            >
              <VoiceAssistantControlBar controls={{ leave: false }} />
              <DisconnectButton>
                <CloseIcon />
              </DisconnectButton>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

const App = forwardRef<AppRef, Props>((props, ref) => {
  const [handler, setHandler] = useState<ConversationHandler | null>(null);

  const [responses, setResponses] = useState<Response[]>([]);

  const isWaiting = responses[responses.length - 1]?.type === "user";

  const colorMode = props.colorMode ?? "dark";

  const [isExpanded, setIsExpanded] = useState(isDev);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, [setIsExpanded]);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, [setIsExpanded]);

  useImperativeHandle(
    ref,
    () => {
      return {
        expand,
        collapse,
        getConversationHandler: () => handler,
      };
    },
    [expand, collapse, handler],
  );

  useEffect(() => {
    setHandler(createConversation(props.config));
  }, [props.config, setHandler]);

  useEffect(() => {
    if (handler == null) {
      return;
    }
    const fn: Subscriber = (responses) => {
      setResponses(responses);
    };
    handler.subscribe(fn);
    return () => {
      handler?.unsubscribe(fn);
    };
  }, [handler, setResponses]);

  const initialWelcomeIntentSent = useRef<boolean>(false);

  useEffect(() => {
    if (handler == null || !isExpanded || initialWelcomeIntentSent.current) {
      return;
    }
    initialWelcomeIntentSent.current = true;
    handler.sendWelcomeIntent();
  }, [handler, isExpanded]);

  const windowSize: WindowSize = props.windowSize ?? "half";

  const lastBotResponse = useMemo<{
    index: number;
    response: BotResponse;
  } | null>(() => {
    const index = findLastIndex((res) => res.type === "bot", responses);
    if (index === -1) {
      return null;
    }
    const response = responses[index];
    if (response?.type !== "bot") {
      return null;
    }
    return { index, response };
  }, [responses]);

  /*
  const choiceMessage = useMemo<ChoiceMessage | undefined>(() => {
    if (lastBotResponse == null) {
      return;
    }
    const choiceMessageIndex = findLastIndex((message) => {
      return message.choices.length > 0;
    }, lastBotResponse.response.payload.messages);
    if (choiceMessageIndex === -1) {
      return;
    }
    const choiceMessage =
      lastBotResponse.response.payload.messages[choiceMessageIndex];
    if (choiceMessage == null) {
      return;
    }
    return {
      message: choiceMessage,
      messageIndex: choiceMessageIndex,
      responseIndex: lastBotResponse.index,
    };
  }, [lastBotResponse]);
  */

  const [uploadedFiles /* setUploadedFiles */] = useState<Record<string, File>>(
    {},
  );

  // Copied from LiveKit example
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [connectionDetails, updateConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined);
  const onConnectButtonClicked = useCallback(async () => {
    const participantName = `voice_assistant_user_${Math.floor(
      Math.random() * 10_000,
    )}`;
    const roomName = `voice_assistant_room_${Math.floor(
      Math.random() * 10_000,
    )}`;
    const metadata = {
      "nlx-bot-url": import.meta.env.VITE_BOT_URL,
      "nlx-api-key": import.meta.env.VITE_BOT_API_KEY,
      "nlx-language-code": "en-US",
      "nlx-metadata": { "nlx-user-id": "+16084064851" },
    };
    const participantToken = await createParticipantToken(
      {
        identity: participantName,
      },
      roomName,
      JSON.stringify(metadata),
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: import.meta.env.VITE_LIVEKIT_URL as string,
      roomName,
      participantToken,
      participantName,
    };
    updateConnectionDetails(data);
  }, []);

  const customModalities = props.customModalities ?? {};

  if (handler == null) {
    return null;
  }

  return (
    <Context.Provider value={{ handler }}>
      {isExpanded ? (
        <CustomPropertiesContainer
          theme={props.theme}
          colorMode={colorMode}
          className="grid grid-cols-2 xl:grid-cols-[1fr_632px] fixed inset-0 z-touchpoint"
        >
          {windowSize === "half" ? (
            <div className="hidden md:block bg-overlay" />
          ) : null}
          <div
            className={clsx(
              "w-full bg-background text-primary-80 flex relative flex-col h-full backdrop-blur-overlay",
              {
                "col-span-2 md:col-span-1": windowSize === "half",
                "col-span-2": windowSize === "full",
              },
            )}
          >
            <ChatHeader
              windowSize={windowSize}
              colorMode={colorMode}
              brandIcon={props.brandIcon}
              isSettingsOpen={isSettingsOpen}
              toggleSettings={() => {
                setIsSettingsOpen((prev) => !prev);
              }}
              collapse={() => {
                setIsExpanded(false);
              }}
              reset={() => {
                handler.reset({ clearResponses: true });
                handler.sendWelcomeIntent();
              }}
            />
            {isSettingsOpen ? (
              <ChatSettings
                className={clsx(
                  "flex-none",
                  windowSize === "full"
                    ? "w-full md:max-w-content md:mx-auto"
                    : "",
                )}
                onClose={() => {
                  setIsSettingsOpen(false);
                }}
                handler={handler}
              />
            ) : (
              <>
                <ChatMessages
                  isWaiting={isWaiting}
                  lastBotResponseIndex={lastBotResponse?.index}
                  responses={responses}
                  colorMode={colorMode}
                  handler={handler}
                  uploadedFiles={uploadedFiles}
                  customModalities={customModalities}
                  className={clsx(
                    "flex-grow",
                    windowSize === "full"
                      ? "w-full md:max-w-content md:mx-auto"
                      : "",
                  )}
                />
                <LiveKitRoom
                  token={connectionDetails?.participantToken}
                  serverUrl={connectionDetails?.serverUrl}
                  connect={connectionDetails !== undefined}
                  audio={true}
                  video={false}
                  onMediaDeviceFailure={onDeviceFailure}
                  onDisconnected={() => {}}
                  className="grid grid-rows-[2fr_1fr] items-center"
                >
                  <SimpleVoiceAssistant onStateChange={setAgentState} />
                  <ControlBar
                    onConnectButtonClicked={onConnectButtonClicked}
                    agentState={agentState}
                  />
                  <RoomAudioRenderer />
                </LiveKitRoom>
                {/* <ChatInput
                  className={clsx(
                    "flex-none",
                    windowSize === "full"
                      ? "w-full md:max-w-content md:mx-auto"
                      : "",
                  )}
                  choiceMessage={choiceMessage}
                  handler={handler}
                  uploadUrl={
                    lastBotResponse?.response.payload.metadata?.uploadUrls?.[0]
                  }
                  onFileUpload={({ uploadId, file }) => {
                    setUploadedFiles((prev) => ({ ...prev, [uploadId]: file }));
                  }}
                /> */}
              </>
            )}
          </div>
        </CustomPropertiesContainer>
      ) : (
        <CustomPropertiesContainer
          className="font-sans"
          theme={props.theme}
          colorMode={colorMode}
        >
          <LaunchButton
            className="fixed z-100 bottom-2 right-2 backdrop-blur z-launchButton"
            iconUrl={props.launchIcon}
            onClick={() => {
              setIsExpanded(true);
            }}
            label="Expand chat"
          />
        </CustomPropertiesContainer>
      )}
    </Context.Provider>
  );
});

App.displayName = "App";

export default App;
