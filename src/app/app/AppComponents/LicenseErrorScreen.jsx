'use client';
import { AlertTriangle, WifiOff, RefreshCcw } from "lucide-react";


import { useRouter } from "next/navigation";
import Logo from "@/app/site-components/Logo";
import { supabase } from "@/app/lib/createClient";


export default function LicenseErrorScreen({
  message,
  onRetry,
  offline = false
}) {
    const router = useRouter();
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-2xl px-8 py-10 flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Logo height={72} width={72} />
          <span className="text-sm tracking-wide text-zinc-400">
            FitOps Central
          </span>
        </div>

        {/* Icon */}
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full
            ${offline
              ? "bg-amber-500/10 text-amber-400"
              : "bg-red-500/10 text-red-400"}
          `}
        >
          {offline ? (
            <WifiOff className="h-7 w-7" />
          ) : (
            <AlertTriangle className="h-7 w-7" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-center">
          {offline ? "Offline Mode Unavailable" : "Verification Failed"}
        </h1>

        {/* Message */}
        <p className="text-center text-sm text-zinc-400 leading-relaxed">
          {message ||
            (offline
              ? "We could not verify your license while offline. Please connect to the internet to continue."
              : "Your license could not be verified. Please check your subscription or contact support.")}
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black font-medium py-2.5 hover:bg-zinc-200 transition"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </button>
          )}

          {
            message?.includes('Startup error') ?
            <button
            onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
            }}
            className="w-full rounded-xl border border-zinc-700 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition"
          >
            Signout
          </button>:null
          }
        </div>

        {/* Footer */}
        <div className="pt-4 text-xs text-zinc-500 text-center">
          Need help? Contact{" "}
          <span className="text-zinc-300">+923328266209</span>
        </div>
      </div>
    </div>
  );
}
