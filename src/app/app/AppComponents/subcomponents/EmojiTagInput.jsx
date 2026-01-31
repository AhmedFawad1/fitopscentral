"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmilePlus, Tags } from "lucide-react";

const EMOJIS = [
  "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😍","😘","😎","🤩","😇",
  "🥳","🤔","🤨","😐","😶","🙄","😏","😴","🤯","😭","😡","😤","👍","👎","🙏",
  "🔥","💯","✨","🎉","❤️","💪","📅","📌","📝","🏋️","💵","🔔","⭐"
];

const TAGS = [
  { key: "{Name}", label: "Name" },
  { key: "{Gym ID}", label: "Member ID" },
  { key: "{Admission Date}", label: "Admission Date" },
  { key: "{Receipt Date}", label: "Receipt Date" },
  { key: "{Start Date}", label: "Start Date" },
  { key: "{Due Date}", label: "Due Date" },
  { key: "{Cancellation Date}", label: "Cancellation Date" },
  { key: "{Birthdate}", label: "Birthdate" },
  { key: "{Package}", label: "Package" },
  { key: "{Trainer}", label: "Trainer" },
  { key: "{Trainer Expiry}", label: "Trainer Expiry" },
  { key: "{Payment Method}", label: "Payment Method" },
  { key: "{Total Amount}", label: "Total Amount" },
  { key: "{Amount Paid}", label: "Amount Paid" },
  { key: "{Balance}", label: "Balance" },
  { key: "{Discount}", label: "Discount" },
  { key: "{Father Name}", label: "Father Name" },
  { key: "{Address}", label: "Address" },
  { key: "{Contact}", label: "Contact" }
];

export default function EmojiTagInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("emoji"); // emoji | tags
  const textareaRef = useRef(null);
  const divRef = useRef(null);
  const insertAtCursor = (insertText) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const updated =
      value.substring(0, start) +
      insertText +
      value.substring(end);

    onChange(updated);
    setOpen(false);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd =
        start + insertText.length;
    }, 0);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (divRef.current && !divRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    }, []);
  return (
    <div className="relative w-full space-y-2">

      {/* Toolbar Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 border rounded-lg shadow-sm 
         transition text-sm"
      >
        <SmilePlus size={18} />
        Add Emoji / Tag
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={divRef}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 top-12 left-10 w-72 bg-[var(--background)] shadow-xl border rounded-xl p-3"
          >
            {/* Tabs */}
            <div className="flex  items-center mb-3 border-b pb-2">
              <button
                className={`flex-1 text-sm py-1 ${
                  tab === "emoji"
                    ? "font-semibold border-b-2 border-black"
                    : "text-gray-500"
                }`}
                onClick={() => setTab("emoji")}
              >
                Emojis
              </button>
              <button
                className={`flex-1 text-sm py-1 ${
                  tab === "tags"
                    ? "font-semibold border-b-2 border-black"
                    : "text-gray-500"
                }`}
                onClick={() => setTab("tags")}
              >
                Tags
              </button>
            </div>

            {/* Emoji Grid */}
            {tab === "emoji" && (
              <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
                {EMOJIS.map((e, idx) => (
                  <button
                    key={idx}
                    onClick={() => insertAtCursor(e)}
                    className="text-xl hover:scale-125 transition"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {/* Tag Chips */}
            {tab === "tags" && (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {TAGS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => insertAtCursor(t.key)}
                    className="flex items-center gap-2 px-3 py-2 
                    text-sm hover:bg-[var(--background-hover)] rounded-lg"
                  >
                    <Tags size={14} /> {t.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Textarea */}
      <textarea
        aria-label={"Template Content"}
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-40 p-3 border rounded-lg shadow-sm 
        focus:ring-2 focus:ring-black/20 outline-none text-sm"
        placeholder="Write your receipt template..."
      />
    </div>
  );
}
