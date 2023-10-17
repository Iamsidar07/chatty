"use client";
import { trpc } from "@/app/_trpc/client";
import ChatInput from "./Chat/ChatInput";
import Messages from "./Chat/Messages";
import { ChevronLeft, Loader, XCircle } from "lucide-react";
import Link from "next/link";
import { ChatContextProvider } from "./Chat/chatContext";

const ChatWrapper = ({ fileId }: { fileId: string }) => {
  const { data, isLoading } = trpc.getFileUploadStatus.useQuery(
    { fileId },
    {
      refetchInterval: (data) =>
        data?.status === "SUCCESS" || data?.status === "FAILED" ? false : 500,
    },
  );

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-zinc-50 flex flex-col divide-y divide-zinc-200 gap-2">
        <div className="flex-1 flex flex-col items-center justify-center mb-28">
          <div className="flex flex-col items-center gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            <h3 className="font-semibold text-xl">Loading...</h3>
            <p className="text-zinc-400 text-sm">We are preparing your pdf</p>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    );
  }

  if (data?.status === "PROCESSING")
    return (
      <div className="relative min-h-screen bg-zinc-50 flex flex-col divide-y divide-zinc-200 gap-2">
        <div className="flex-1 flex flex-col items-center justify-center mb-28">
          <div className="flex flex-col items-center gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            <h3 className="font-semibold text-xl">Processing pdf...</h3>
            <p className="text-zinc-400 text-sm">It won&apos;t take long</p>
          </div>
        </div>
        <ChatInput isDisabled />
      </div>
    );
  
  if (data?.status === "FAILED")
    return (
      <div className="relative min-h-screen bg-zinc-50 flex flex-col divide-y divide-zinc-200 gap-2">
        <div className="flex-1 flex flex-col items-center justify-center mb-28">
          <div className="flex flex-col items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-xl">
              Failed to process your pdf
            </h3>
            <p className="text-zinc-400 text-sm">Too many pages in your pdf</p>
            <p className="text-zinc-500 text-sm">
              Your <span className="font-semibold font-mono">free</span> plan
              ony support 5 pages per pdf.
            </p>
            <Link
              href={"/dashboard"}
              className="flex items-center gap-2 mt-6 bg-zinc-100 px-4 py-2.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-semibold">Back</span>
            </Link>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    );

  return (
    <ChatContextProvider fileId={fileId}>
      {" "}
      <div className="relative min-h-[calc(100vh-3.5rem)] bg-zinc-50 flex flex-col divide-y divide-zinc-200 gap-2">
        <div className="flex-1 flex flex-col mb-28 ">
          <Messages fileId={fileId} />
        </div>
        <ChatInput />
      </div>
    </ChatContextProvider>
  );
};

export default ChatWrapper;
