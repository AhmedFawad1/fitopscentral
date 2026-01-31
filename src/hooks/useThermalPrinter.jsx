"use client";

import { useCallback } from "react";

export function useThermalPrinter() {
    const isTauri =
        typeof window !== "undefined" &&
        "__TAURI_IPC__" in window; // reliable Tauri detection

    // -----------------------------------
    // WEB PRINT (NO POPUPS)
    // -----------------------------------
    const printInWeb = useCallback((htmlContent, width) => {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        const styles = `
            <style>
                @page { size: ${width}px auto; margin: 0; }
                body { margin: 0; width: ${width}px; font-family: monospace; }
            </style>
        `;

        iframe.contentDocument.open();
        iframe.contentDocument.write(`
            <html>
            <head>
            ${styles}
            <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body>${htmlContent}</body></html>
        `);
        iframe.contentDocument.close();

        iframe.onload = () => {
            iframe.contentWindow.print();
            setTimeout(() => iframe.remove(), 500);
        };
    }, []);

    // -----------------------------------
    // TAURI PRINT (DATA URL METHOD)
    // -----------------------------------
    const printInTauri = useCallback(async (htmlContent, width) => {

        const styles = `
            <style>
                @page { size: ${width}px auto; margin: 0; }
                body { margin: 0; width: ${width}px; font-family: monospace; }
            </style>
        `;

        const html = `
            <html>
            <head>
            ${styles}
            <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body onload="window.print()">${htmlContent}</body></html>
        `;

        // Convert to data URL (100% browser + tauri compatible)
        const dataUrl =
            "data:text/html;charset=utf-8," + encodeURIComponent(html);

    }, []);

    // -----------------------------------
    // UNIFIED PRINT FUNCTION
    // -----------------------------------
    const printReceipt = useCallback(
        (htmlContent, { width = 230 } = {}) => {
            if (isTauri) return printInTauri(htmlContent, width);
            return printInWeb(htmlContent, width);
        },
        [isTauri, printInWeb, printInTauri]
    );

    return { printReceipt, isTauri };
}
