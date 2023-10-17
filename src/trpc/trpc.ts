import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";
const t = initTRPC.create();
const middleware = t.middleware;
const isAuth = middleware((options) => {
  const { getUser } = getKindeServerSession();
  const { id } = getUser();
  if (!id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return options.next({
    ctx: {
      userId: id,
    },
  });
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isAuth);
