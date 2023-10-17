import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infiniteQuery";
import { Loader, MessageSquareDashed } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import { useIntersection } from "@mantine/hooks";
import Message from "./Message";
import { ChatContext } from "./chatContext";

interface MessagesProps {
  fileId: string;
}

const Messages = ({ fileId }: MessagesProps) => {
  const { isLoading: isAIThinking } = useContext(ChatContext);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const { ref, entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 1,
  });
  const { data, isLoading, fetchNextPage } =
    trpc.getFileMessages.useInfiniteQuery(
      {
        fileId,
        limit: INFINITE_QUERY_LIMIT,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        keepPreviousData: true,
      },
    );

  useEffect(() => {
    if (entry?.isIntersecting) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage]);

  const messages = data?.pages.flatMap((page) => page.messages);

  const loadingMessage = {
    id: "loading-message",
    createdAt: new Date().toISOString(),
    text: (
      <span className="h-full grid place-items-center">
        <Loader className="w-4 h-4 animate-spin" />
      </span>
    ),
    isUserMessage: false,
  };
  const combinedMessages = [
    ...(isAIThinking ? [loadingMessage] : []), // message of loading
    ...(messages ?? []), // all messages
  ];

  return (
    <div className="flex max-h-[calc(100vh-3.5rem-7rem] border-zinc-200 flex-col-reverse gap-3 overflow-y-auto overflow-x-hidden">
      {combinedMessages && combinedMessages?.length > 0 ? (
        combinedMessages.map((message, i) => {
          // keep track of last message
          const isNextMessageBySamePerson =
            combinedMessages[i - 1]?.isUserMessage ===
            combinedMessages[i]?.isUserMessage;

          if (i === combinedMessages.length - 1) {
            return (
              <Message
                key={message.id}
                message={message}
                isNextMessageBySamePerson={isNextMessageBySamePerson}
                ref={ref}
              />
            );
          }

          return (
            <Message
              key={message.id}
              message={message}
              isNextMessageBySamePerson={isNextMessageBySamePerson}
            />
          );
        })
      ) : isLoading ? (
        <div className="w-full h-full grid place-items-center">
          <Loader className="w-4 h-4 animate-spin" />
          <h2 className="text-sm text-zinc-900">
            Your messages being loading...
          </h2>
        </div>
      ) : (
        <div className="flex flex-col items-center mt-28 gap-3">
          <MessageSquareDashed className="w-4 h-4 text-red-500" />
          <h2 className="text-sm text-zinc-900">
            Nothing to show here! Start your first chat with your lovely PDF
          </h2>
        </div>
      )}
    </div>
  );
};

export default Messages;
