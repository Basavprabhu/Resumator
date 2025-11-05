// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "../lib/authContext";
import NotificationContainer from "../components/NotificationContainer";
import Footer from "../components/Footer";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
      <NotificationContainer />
    </AuthProvider>
  );
}
