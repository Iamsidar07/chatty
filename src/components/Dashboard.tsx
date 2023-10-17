"use client";

import { trpc } from "@/app/_trpc/client";
import UploadButton from "./UploadButton";
import { ChefHat, Ghost, Loader, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { useState } from "react";
import { getUserSubscriptionPlan } from "@/lib/stripe";
interface DashboardProps {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
}
const Dashboard = ({ subscriptionPlan }: DashboardProps) => {
  const utils = trpc.useContext();
  const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<
    string | null
  >(null);
  const { data: files, isLoading } = trpc.getUserFiles.useQuery();
  const { mutate: deleteFile } = trpc.deleteFile.useMutation({
    onSuccess: () => {
      utils.getUserFiles.invalidate();
    },
    onMutate: ({ id }) => {
      setCurrentlyDeletingFile(id);
    },
    onSettled: () => {
      setCurrentlyDeletingFile(null);
    },
  });
  return (
    <main className="mx-auto max-w-7xl md:p-10">
      <div className="flex flex-col items-start justify-between mt-8 gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
        <h1 className="mb-4 text-5xl font-bold text-gray-800">My Files</h1>
        <UploadButton isSubscribed={subscriptionPlan.isSubscribed} />
      </div>
      {files && files?.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {files
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((file) => (
              <li
                key={file.key}
                className="col-span-1 bg-white rounded-2xl shadow transition-all hover:shadow-lg"
              >
                <Link
                  href={`/dashboard/${file.id}`}
                  className="flex flex-col gap-2"
                >
                  <div className="flex w-full items-center pt-8 px-6 gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    <div className="truncate flex-1 font-medium text-lg">
                      {file.name}
                    </div>
                  </div>
                </Link>
                <div className="mt-4 px-6 grid grid-cols-3 place-items-center py-2 gap-6 text-zinc-700">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <p className="truncate whitespace-nowrap">
                      {format(new Date(file.createdAt), "MMM yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ">
                    <ChefHat className="w-5 h-5" />
                    <p>Messages</p>
                  </div>

                  <Button
                    onClick={() => deleteFile({ id: file.id })}
                    className="flex items-center gap-2 w-full "
                    size={"sm"}
                    variant={"destructive"}
                  >
                    {currentlyDeletingFile === file.id ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      ) : isLoading ? (
        <div className="mt-16 flex flex-col items-center justify-center">
          <Loader className="w-8 h-8 text-zinc-800 animate-spin" />
          <h3>Loading up your PDFs...</h3>
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center justify-center">
          <Ghost className="w-8 h-8 text-zinc-800" />
          <h3 className="font-semibold text-xl">Pretty empty around here</h3>
          <p>Let&apos; upload my first PDF file...</p>
        </div>
      )}
    </main>
  );
};
export default Dashboard;
