import { db } from "@/lib/db";

type Where = unknown;
interface Op { args: { where?: Where }; query: (args: never) => Promise<unknown> }

/** The "this row is demo" test for each model, so a real admin's screens can leave demo rows out. */
const REAL_ONLY: Record<string, Where> = {
  user: { isDemo: false },
  mentorProfile: { user: { isDemo: false } },
  session: { NOT: { student: { isDemo: true } } },
  order: { NOT: { user: { isDemo: true } } },
  review: { NOT: { student: { isDemo: true } } },
  payoutAccrual: { NOT: { mentor: { user: { isDemo: true } } } },
  mentorApplication: { NOT: { email: { endsWith: ".test" } } },
  studentProfile: { user: { isDemo: false } },
  sessionRating: { student: { isDemo: false } },
  feedback: { mentor: { user: { isDemo: false } } },
  callTracker: { student: { isDemo: false } },
  slot: { mentor: { user: { isDemo: false } } },
  payment: { order: { NOT: { user: { isDemo: true } } } },
  refund: { payment: { order: { NOT: { user: { isDemo: true } } } } },
};

const narrow = (frag: Where | undefined) => async ({ args, query }: Op) => {
  if (frag) args.where = args.where ? { AND: [args.where, frag] } : frag;
  return query(args as never);
};
const ops = (frag: Where | undefined) => ({ findMany: narrow(frag), findFirst: narrow(frag), count: narrow(frag), aggregate: narrow(frag), groupBy: narrow(frag) });

export function scopedClient(realOnly: boolean) {
  const f = (k: string) => (realOnly ? REAL_ONLY[k] : undefined);
  return db.$extends({
    query: {
      user: ops(f("user")), mentorProfile: ops(f("mentorProfile")), session: ops(f("session")), order: ops(f("order")),
      review: ops(f("review")), payoutAccrual: ops(f("payoutAccrual")), mentorApplication: ops(f("mentorApplication")),
      studentProfile: ops(f("studentProfile")), sessionRating: ops(f("sessionRating")), feedback: ops(f("feedback")),
      callTracker: ops(f("callTracker")), slot: ops(f("slot")), payment: ops(f("payment")), refund: ops(f("refund")),
    },
  } as never);
}

