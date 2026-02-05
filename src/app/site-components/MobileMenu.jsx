"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function MobileMenu({ navLinks }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="nav-mobile">
      <button onClick={() => setOpen(!open)} className="menu-btn">
        {open ? <X size={26} /> : <Menu size={26} />}
      </button>

      {open && (
        <div className="mobile-panel">
          {navLinks.map(link => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="mobile-link"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/login"
            className="mobile-login"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </div>
  );
}
