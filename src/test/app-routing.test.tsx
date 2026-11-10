import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
const makeRouter = () => createRouter({ routeTree, context: { queryClient: new QueryClient() } });
const parentsOf = (path: string) => makeRouter().matchRoutes(path).map((m) => m.routeId);

describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    expect(makeRouter().matchRoutes("/").at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("opens the Dashboard by default and has Skills and Settings screens", () => {
    const router = makeRouter();
    expect(router.matchRoutes("/").at(-1)?.routeId).toBe("/_authenticated/");
    expect(router.matchRoutes("/skills").at(-1)?.routeId).toBe("/_authenticated/skills/");
    expect(router.matchRoutes("/skills/typescript").at(-1)?.routeId).toBe("/_authenticated/skills/$skillId");
    expect(router.matchRoutes("/settings").at(-1)?.routeId).toBe("/_authenticated/settings");
  });

  it("puts Dashboard, Skills and Settings behind sign-in", () => {
    for (const path of ["/", "/skills", "/skills/typescript", "/settings"]) {
      expect(parentsOf(path)).toContain("/_authenticated");
    }
  });

  it("keeps Login, Registration and Password Reset outside sign-in", () => {
    for (const path of ["/auth", "/register", "/forgot-password", "/reset-password"]) {
      const ids = parentsOf(path);
      expect(ids.at(-1)).toBe(path);
      expect(ids).not.toContain("/_authenticated");
    }
  });
});
