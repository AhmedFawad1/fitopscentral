import { useEffect, useState } from "react";

export function useCheckInternet() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
        const startTime = Date.now();
        const response = await fetch("https://1.1.1.1/cdn-cgi/trace", {
          cache: "no-cache",
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        if (response.ok && duration < 3000) { // consider fast if under 3 seconds
          setConnected(true);
        } else {
          setConnected(false);
        }
      } catch (error) {
        setConnected(false);
      }
    };
    // check every 10 seconds
    checkConnection(); // 👈 call once immediately
    const intervalId = setInterval(checkConnection, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return connected;
}
