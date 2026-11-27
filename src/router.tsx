import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import type { RouterContext } from "~/types/router";

import { toast } from "~/components/toast/toast-store";
import { ApiError, ApiNetworkError } from "~/lib/api";
import { routeTree } from "~/routeTree.gen";

function createQueryClient(onUnauthorized: () => void) {
  let unauthorizedHandled = false;
  const handleError = (error: unknown, formHandlesError = false) => {
    if (error instanceof ApiError && error.status === 401) {
      if (!unauthorizedHandled) {
        unauthorizedHandled = true;
        onUnauthorized();
      }
      return;
    }
    if (!formHandlesError && error instanceof ApiNetworkError) {
      toast.error("Koneksi internet terputus. Periksa jaringan Anda.");
    }
  };

  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => handleError(error),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        handleError(error, mutation.meta?.errorHandledByForm === true);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) =>
          failureCount < 1 &&
          (error instanceof ApiNetworkError ||
            (error instanceof ApiError &&
              error.status >= 500 &&
              error.status < 600)),
      },
      mutations: { retry: 0 },
    },
  });
}

export function getRouter() {
  let redirectToLogin = () => undefined;
  const queryClient = createQueryClient(() => {
    redirectToLogin();
  });
  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      session: null,
      sessionCookiePresent: false,
    } satisfies RouterContext,
    defaultPreload: "intent",
  });
  redirectToLogin = () => {
    if (typeof window === "undefined") return;
    void router.invalidate();
  };
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    wrapQueryClient: false,
  });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
