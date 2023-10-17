import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import z from "zod";
import { INFINITE_QUERY_LIMIT } from "@/config/infiniteQuery";
import { absoluteUrl } from "@/lib/utils";
import { getUserSubscriptionPlan, stripe } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";
export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const { id, email } = getUser();
    if (!id || !email) throw new TRPCError({ code: "UNAUTHORIZED" });
    const dbUser = await db.user.findFirst({
      where: {
        id,
      },
    });
    if (!dbUser) {
      // create a new user in database
      await db.user.create({
        data: {
          id,
          email,
        },
      });
    }
    return { success: true };
  }),

  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    return await db.file.findMany({
      where: {
        userId,
      },
    });
  }),

  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId: ctx.userId,
        },
      });
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });
      return file;
    }),

  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { id } = input;
      const file = await db.file.findFirst({
        where: {
          id,
          userId,
        },
      });
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });
      await db.file.delete({
        where: {
          id,
        },
      });
      return file;
    }),

  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId,
        },
      });
      if (!file) return { status: "PENDING" as const };
      return { status: file.uploadStatus };
    }),

  getFileMessages: privateProcedure
    .input(
      z.object({
        fileId: z.string(),
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(100).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { fileId, cursor } = input;
      const limit = input.limit ?? INFINITE_QUERY_LIMIT;
      // cursor is the id of last message of result
      // cursor is unique input from where the query will start and take elements -> used for infinite scrolling, highly scalable
      // offset is used when less datas are there coz every it retriew from the begining and skip and take items. Its not scalable
      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      });
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = await db.message.findMany({
        where: {
          fileId,
          userId,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          createdAt: true,
          isUserMessage: true,
          text: true,
        },
      });
      let nextCursor: string | undefined = undefined;
      if (messages?.length > limit) {
        const lastMessage = messages[messages.length - 1];
        nextCursor = lastMessage.id;
      }
      return {
        messages,
        nextCursor,
      };
    }),
  createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;

    const bilingUrl = absoluteUrl("/dashboard/billing");
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
    const dbUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });
    const subscriptionPlan = await getUserSubscriptionPlan();

    if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: bilingUrl,
      });
      return { url: stripeSession.url };
    }
    const stripeSessionForUserNotSubscribed =
      await stripe.checkout.sessions.create({
        success_url: bilingUrl,
        cancel_url: bilingUrl,
        payment_method_types: ["card", "paypal", "paynow"],
        mode: "subscription",
        line_items: [
          {
            price: PLANS.find((plan) => plan.name === "Pro")?.price.priceId
              .test,
            quantity: 1,
          },
        ],
        metadata: {
          userId,
        },
      });
    return { url: stripeSessionForUserNotSubscribed.url };
  }),
});
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
