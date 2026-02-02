import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { SupportProvider } from "./contexts/SupportContext";
import "./index.css";

const queryClient = new QueryClient();

// Keywords that indicate credit/resource issues
const CREDIT_ERROR_KEYWORDS = [
  "credit",
  "credits", 
  "quota",
  "limit exceeded",
  "rate limit",
  "insufficient",
  "exhausted",
  "capacity",
  "throttle",
  "too many requests",
];

// Check if error is credit-related
const isCreditError = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return CREDIT_ERROR_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
};

// Custom event for credit errors
const dispatchCreditError = (message: string) => {
  window.dispatchEvent(new CustomEvent('credit-error', { 
    detail: { message } 
  }));
};

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

const handleApiError = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  
  const message = error.message || "";
  
  // Check for credit-related errors
  if (isCreditError(message)) {
    dispatchCreditError(message);
    return;
  }
  
  // Check for unauthorized
  redirectToLoginIfUnauthorized(error);
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    handleApiError(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    handleApiError(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <SupportProvider>
        <App />
      </SupportProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
