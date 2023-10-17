"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { File, Loader, UploadCloud } from "lucide-react";
import Dropzone from "react-dropzone";
import { Progress } from "./ui/progress";
import { useUploadThing } from "@/lib/uploadthing";
import { useToast } from "./ui/use-toast";
import { trpc } from "@/app/_trpc/client";
import { useRouter } from "next/navigation";
const UploadDropzone = ({ isSubscribed }: { isSubscribed: boolean }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { startUpload } = useUploadThing(
    isSubscribed ? "proPlanUploader" : "freePlanUploader",
  );
  const { mutate: startPolling } = trpc.getFile.useMutation({
    onSuccess: (file) => {
      router.push(`/dashboard/${file.id}`);
    },
    retry: true,
    retryDelay: 500,
  });
  const startSimulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prevUploadProgress) => {
        if (prevUploadProgress >= 85) {
          clearInterval(interval);
          return prevUploadProgress;
        }
        return prevUploadProgress + 5;
      });
    }, 500);
    return interval;
  };
  return (
    <Dropzone
      onDrop={async (acceptedFiles) => {
        setIsUploading(true);
        const progressInterval = startSimulateProgress();
        // handle file uploading to the clound
        const res = await startUpload(acceptedFiles);
        if (!res) {
          return toast({
            title: "Something went wrong",
            description: "Please try again later",
            variant: "destructive",
          });
        }
        const [fileResponse] = res;
        const key = fileResponse.key;
        if (!key) {
          return toast({
            title: "Something went wrong",
            description: "Please try again later",
            variant: "destructive",
          });
        }
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(100);
        startPolling({ key });
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <section>
          <div
            {...getRootProps()}
            className="text-center border p-6 border-dashed border-gray-300 rounded-2xl h-64 m-4 bg-gray-50"
          >
            <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 ">
              <input {...getInputProps()} />
              <UploadCloud className="w-8 h-8 text-zinc-800" />
              <p>
                Drag and drop some PDF here, or{" "}
                <span className="font-semibold">click to upload</span>
              </p>
              <p className="text-zinc-500">
                PDF(up to {isSubscribed ? "16" : "4"}MB)
              </p>

              {acceptedFiles && acceptedFiles[0] ? (
                <div className="max-w-sm bg-white rounded-md shadow px-6 py-2 overflow-hidden flex items-center justify-center border border-gray-200">
                  <div className="px-2 py-1.5 grid place-items-center">
                    <File className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="truncate">{acceptedFiles[0]?.name}</div>
                </div>
              ) : null}

              {isUploading ? (
                <div className="w-full max-w-sm mt-6 mx-auto">
                  <Progress
                    value={uploadProgress}
                    className="h-1 bg-gray-200"
                  />
                </div>
              ) : null}

              {uploadProgress === 100 ? (
                <div className="w-full flex items-center justify-center gap-2 mt-2 max-w-sm mx-auto">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Redirecting...</span>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      )}
    </Dropzone>
  );
};
const UploadButton = ({ isSubscribed }: { isSubscribed: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(value) => {
        if (!value) {
          setIsOpen(value);
        }
      }}
    >
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        <Button>Upload PDF</Button>
      </DialogTrigger>
      <DialogContent>
        <UploadDropzone isSubscribed={isSubscribed} />
      </DialogContent>
    </Dialog>
  );
};

export default UploadButton;
