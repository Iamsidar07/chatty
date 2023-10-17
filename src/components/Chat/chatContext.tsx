import { ChangeEvent, ReactNode, createContext, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infiniteQuery";

interface ChatContextProps {
  addMessage: () => void;
  message: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
}
interface Props {
  fileId: string;
  children: ReactNode;
}
export const ChatContext = createContext<ChatContextProps>({
  addMessage: () => {},
  message: "",
  handleInputChange: () => {},
  isLoading: false,
});

export const ChatContextProvider = ({ fileId, children }: Props) => {
  const utils = trpc.useContext();
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const backMessageRef = useRef("");
  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch("/api/message", {
        method: "POST",
        body: JSON.stringify({
          fileId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message.");
      }

      return response.body;
    },
    onMutate: async ({ message }) => {
      backMessageRef.current = message;
      setMessage("");

      await utils.getFileMessages.cancel();

      const previousMessages = utils.getFileMessages.getInfiniteData();

      utils.getFileMessages.setInfiniteData(
        { fileId, limit: INFINITE_QUERY_LIMIT },
        (oldMessages) => {
          if (!oldMessages) {
            return {
              pages: [],
              pageParams: [],
            };
          }
          let newPages = [...oldMessages.pages];
          let latestPage = newPages[0]!;
          latestPage.messages = [
            {
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(),
              text: message,
              isUserMessage: true,
            },
            ...latestPage.messages,
          ];

          newPages[0] = latestPage;
          return {
            ...oldMessages,
            pages: newPages,
          };
        },
      );

      setIsLoading(true);

      return {
        previourMessages:
          previousMessages?.pages.flatMap((page) => page.messages) ?? [],
      };
    },
    onSuccess: async (stream) => {
      setIsLoading(false);
      if (!stream) {
        return toast({
          title: "There was a problem in sending message.",
          description: "Please refresh this page and try again.",
          variant: "destructive",
        });
      }
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let isDone = false;
      let accumulatedResponse = "";
      while (!isDone) {
        const { value, done: doneReading } = await reader?.read();
        isDone = doneReading;
        const chunkValue = decoder.decode(value);
        accumulatedResponse += chunkValue;
      }
      utils.getFileMessages.setInfiniteData(
        { fileId, limit: INFINITE_QUERY_LIMIT },
        (oldMessages) => {
          if (!oldMessages) {
            return {
              pages: [],
              pageParams: [],
            };
          }
          let isAIResponseCreated = oldMessages.pages.some((page) =>
            page.messages.some((message) => message.id === "ai-response"),
          );
          let updatedPages = oldMessages.pages.map((page) => {
            if (page === oldMessages.pages[0]) {
              let updatedMessages;
              if (!isAIResponseCreated) {
                updatedMessages = [
                  {
                    createdAt: new Date().toISOString(),
                    id: "ai-response",
                    text: accumulatedResponse,
                    isUserMessage: false,
                  },
                  ...page.messages,
                ];
              } else {
                updatedMessages = page.messages.map((message) => {
                  if (message.id === "ai-response") {
                    return {
                      ...message,
                      text: accumulatedResponse,
                    };
                  }
                  return message;
                });
              }
              return {
                ...page,
                messages: updatedMessages,
              };
            }
            return page;
          });
          return { ...oldMessages, pages: updatedPages };
        },
      );
    },
    onError: (_, __, context) => {
      setMessage(backMessageRef.current);
      utils.getFileMessages.setData(
        { fileId },
        {
          messages: context?.previourMessages ?? [],
        },
      );
    },
    onSettled: async () => {
      setIsLoading(false);
      await utils.getFileMessages.invalidate({ fileId });
    },
  });

  const addMessage = () => sendMessage({ message });

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };
  return (
    <ChatContext.Provider
      value={{
        addMessage,
        handleInputChange,
        isLoading,
        message,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
