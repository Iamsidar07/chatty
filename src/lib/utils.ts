import { type ClassValue, clsx } from "clsx";
import { Metadata } from "next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  if (typeof window !== undefined) return path;
  if (process.env.VERCEL_URL) return `${process.env.VERCEL_URL}${path}`;
  return `https://localhost:${process.env.PORT ?? 3000}${path}`;
}

export function constructMetadata({
  title = "Chatty-Chat with your pdf",
  description = "Chatty is a software to make chatting with any pdf",
  image = "./thumbnail.png",
  icons = "/favicon.ico",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@iamsidar07",
    },
    icons,
    metadataBase: new URL("https://chatty-five-mocha.vercel.app"),
    themeColor: "#fff",
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
