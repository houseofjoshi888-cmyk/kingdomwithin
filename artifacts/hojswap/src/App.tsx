import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { Switch, Route, Router as WouterRouter } from "wouter";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/wagmi";
import { ToastProvider } from "@/components/Toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SwapCard } from "@/components/SwapCard";
import About from "@/pages/About";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      retry: 2,
    },
  },
});

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="hoj-display text-3xl text-[rgba(212,175,55,0.7)]">404</p>
      <p className="text-white/60">Page not found.</p>
      <a href="/" className="rounded-xl border border-[rgba(212,175,55,0.3)] px-5 py-2 text-sm text-[rgba(212,175,55,0.9)] hover:bg-[rgba(212,175,55,0.08)] transition">
        Back to Swap
      </a>
    </div>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={SwapCard} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "rgba(212,175,55,0.95)",
            accentColorForeground: "black",
            borderRadius: "large",
            fontStack: "rounded",
            overlayBlur: "small",
          })}
          locale="en-US"
        >
          <ToastProvider>
            <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") ?? ""}>
              <div className="flex min-h-dvh flex-col bg-[#0b0b0d]">
                <Header />
                <main className="flex-1">
                  <AppRoutes />
                </main>
                <Footer />
              </div>
            </WouterRouter>
          </ToastProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
