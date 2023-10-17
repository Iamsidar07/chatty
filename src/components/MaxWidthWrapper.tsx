import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const MaxWidthWrapper = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div
      className={cn("w-full max-w-[1440px] mx-auto px-2.5 md:px-20", className)}
    >
      {children}
    </div>
  );
};
export default MaxWidthWrapper;
