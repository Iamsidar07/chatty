"use client";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronDown,
  ChevronUp,
  Loader,
  RotateCcw,
  Search,
} from "lucide-react";
import { useToast } from "./ui/use-toast";
import { useResizeDetector } from "react-resize-detector";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "./ui/dropdown-menu";
import Simplebar from "simplebar-react";
import Pdffullscreen from "./Pdffullscreen";
import { cn } from "@/lib/utils";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
const PDFRenderer = ({ url }: { url: string }) => {
  const { toast } = useToast();
  const { width, ref } = useResizeDetector();
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [renderedScale, setRenderedScale] = useState<number | null>(null);

  const handleIncreasePageNum = () => {
    setCurrentPageNum((prevCurrentPageNum) => {
      if (prevCurrentPageNum >= totalPages!) {
        return prevCurrentPageNum;
      }
      return prevCurrentPageNum + 1;
    });
  };
  const handleDecreasePageNum = () => {
    setCurrentPageNum((prevCurrentPageNum) => {
      if (prevCurrentPageNum <= 1) {
        return prevCurrentPageNum;
      }
      return prevCurrentPageNum - 1;
    });
  };
  return (
    <div className="w-full bg-white flex flex-col items-center shadow rounded-2xl p-2">
      <div className="h-14 w-full border shadow-t-sm rounded-md flex items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-1.5">
          {" "}
          <div className="flex items-center gap-1.5">
            <Button
              variant={"ghost"}
              aria-label="previous-page"
              onClick={handleDecreasePageNum}
              disabled={currentPageNum === 1}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              placeholder="1"
              className="w-14 h-8"
              value={currentPageNum}
              min={1}
              max={totalPages ?? 1}
              onChange={(e) => setCurrentPageNum(Number(e.target.value))}
            />
            <p className="flex items-center gap-1 pl-2">
              <span>{currentPageNum}</span>
              <span>/</span>
              <span>{totalPages ?? "0"}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant={"ghost"}
              aria-label="next-page"
              onClick={handleIncreasePageNum}
              disabled={currentPageNum === totalPages}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {" "}
          <div className="space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="zoom">
                  <span>{scale * 100}%</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setScale(1)}>
                  100%
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setScale(1.5)}>
                  150%
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setScale(1.75)}>
                  175%
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setScale(2)}>
                  200%
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid place-items-center">
            <Button
              variant={"ghost"}
              aria-label="rotate pdf"
              onClick={() => setRotation((prevRotation) => prevRotation + 90)}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          <Pdffullscreen url={url} />
        </div>
      </div>

      <div
        className="flex-1 w-full max-h-screen overflow-y-scroll no-scrollbar "
        ref={ref}
      >
        <Simplebar autoHide={false} className="max-h-[calc(100vh-10rem)]">
          <Document
            file={url}
            className=""
            loading={
              <div className="w-full grid place-items-center h-24">
                <div className="flex items-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <p className="text-zinc-500">Preparing your pdf...</p>
                </div>
              </div>
            }
            onLoadError={() => {
              toast({
                title: "Unable to load your pdf",
                description: "Please try again later",
                variant: "destructive",
              });
            }}
            onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
          >
            {renderedScale !== scale && renderedScale ? (
              <Page
                width={width ? width : 1}
                scale={scale}
                pageNumber={currentPageNum == 0 ? 1 : currentPageNum}
                rotate={rotation}
                key={`@${scale}`}
              />
            ) : null}

            <Page
              className={cn(renderedScale !== scale ? "hidden" : "")}
              width={width ? width : 1}
              scale={scale}
              pageNumber={currentPageNum == 0 ? 1 : currentPageNum}
              rotate={rotation}
              key={`@${renderedScale}`}
              loading={
                <div className="grid place-items-center">
                  <Loader className="w-5 h-5 animate-spin my-24" />
                </div>
              }
              onRenderSuccess={() => setRenderedScale(scale)}
            />
          </Document>
        </Simplebar>
      </div>
    </div>
  );
};

export default PDFRenderer;
