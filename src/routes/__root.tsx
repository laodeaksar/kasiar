import type { ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import type { RouterContext } from "~/types/router";

import { ConfirmProvider } from "~/components/confirm";
import { ErrorState } from "~/components/feedback";
import { ToastProvider } from "~/components/toast";

import "~/styles/app.css";

const loadTheme = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  const theme = getCookie("tema");
  return theme === "terang" || theme === "gelap" ? theme : null;
});
const loadSession = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const { readUserSession } = await import("~/lib/auth");
  const cookie = getRequestHeader("cookie") ?? "";
  const sessionCookiePresent =
    /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s]+/.test(cookie);
  return {
    session: await readUserSession(cookie),
    sessionCookiePresent,
  };
});

function RootDocument({
  children,
  theme,
}: {
  children: ReactNode;
  theme: "terang" | "gelap" | null;
}) {
  const dataTheme =
    theme === "terang" ? "light" : theme === "gelap" ? "dark" : undefined;
  const colorScheme =
    theme === "terang" ? "light" : theme === "gelap" ? "dark" : "light dark";
  return (
    <html
      lang="id"
      data-theme={dataTheme}
      style={{ colorScheme }}
    >
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <meta
          name="robots"
          content="noindex,nofollow"
        />
        <meta
          name="theme-color"
          content="light dark"
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootProviders({
  queryClient,
  children,
}: {
  queryClient: RouterContext["queryClient"];
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => loadSession(),
  loader: async () => ({ theme: await loadTheme() }),
  head: () => ({
    meta: [{ title: "Kasiar — Catatan Stok Sembako" }],
  }),
  headers: () => ({
    "Cache-Control": "private, no-store",
  }),
  component: RootRouteComponent,
  errorComponent: ({ reset }) => <RootErrorPage reset={reset} />,
  notFoundComponent: () => <RootNotFoundPage />,
});

function RootRouteComponent() {
  const { theme } = Route.useLoaderData();
  const queryClient = Route.useRouteContext({
    select: (context) => context.queryClient,
  });
  return (
    <RootDocument theme={theme}>
      <RootProviders queryClient={queryClient}>
        <Outlet />
      </RootProviders>
    </RootDocument>
  );
}

function RootErrorPage({ reset }: { reset: () => void }) {
  const queryClient = Route.useRouteContext({
    select: (context) => context.queryClient,
  });
  return (
    <RootDocument theme={null}>
      <RootProviders queryClient={queryClient}>
        <main className="mx-auto max-w-2xl p-6">
          <ErrorState onRetry={reset} />
        </main>
      </RootProviders>
    </RootDocument>
  );
}

function RootNotFoundPage() {
  const queryClient = Route.useRouteContext({
    select: (context) => context.queryClient,
  });
  return (
    <RootDocument theme={null}>
      <RootProviders queryClient={queryClient}>
        <main className="mx-auto max-w-2xl p-6">
          <h1 className="text-2xl font-bold">Halaman tidak ditemukan.</h1>
        </main>
      </RootProviders>
    </RootDocument>
  );
}
