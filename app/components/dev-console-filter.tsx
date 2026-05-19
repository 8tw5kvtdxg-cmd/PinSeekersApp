import Script from "next/script";

export function DevConsoleFilter() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Script
      id="pin2win-dev-console-filter"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (() => {
            const originalError = console.error;
            console.error = (...args) => {
              const message = args.map((arg) => String(arg)).join(" ");
              const isInjectedAttributeHydrationWarning =
                message.includes("A tree hydrated but some attributes") &&
                (message.includes("__gcr") || message.includes("server rendered HTML"));

              if (isInjectedAttributeHydrationWarning) {
                return;
              }

              originalError(...args);
            };
          })();
        `,
      }}
    />
  );
}
