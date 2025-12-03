import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { reportWebVitals } from "./lib/performance";
import { errorSink } from "./lib/errorSink";
import "./index.css";

// Global error handlers
window.onerror = (msg, url, line, col, error) => {
  errorSink.capture(error || msg, {
    severity: 'error',
    filePath: url,
    metadata: { line, col },
  });
};

window.onunhandledrejection = (event) => {
  errorSink.capture(event.reason, {
    severity: 'error',
    componentName: 'UnhandledPromiseRejection',
  });
};

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </BrowserRouter>
);

// Report web vitals in development
if (import.meta.env.DEV) {
  reportWebVitals();
}
