// src/app/components/ParseSvgIcon.jsx
"use client";

import React, { useState, useEffect } from "react";

// Utility: convert raw SVG string into a JSX element
function parseSvgString(svgString) {
  // Check that DOMParser is available (i.e., we are on the client)
  if (typeof window === 'undefined') {
    return null;
  }
  
  // 1. Parse the raw SVG string into a DOM object
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svg = doc.querySelector("svg");

  if (!svg) return null;

  // 2. Recursively convert DOM nodes into React elements
  function convert(node, key) {
    if (node.nodeType === 3) return node.nodeValue; // text node

    const props = {};
    for (const attr of node.attributes || []) {
      let name = attr.name;
      if (name === "class") name = "className";
      else if (name.includes("-")) {
        name = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      }
      props[name] = attr.value;
    }

    const children = [];
    node.childNodes.forEach((child, idx) => {
      children.push(convert(child, idx));
    });

    return React.createElement(node.nodeName, { ...props, key }, children);
  }

  return convert(svg, 0);
}

export default function ParseSvgIcon({ svg,stroke, className = "", fill, opacity = 1,parseFill = false, ...rest }) {
  const [parsedElement, setParsedElement] = useState(null);

  useEffect(() => {
    if (!svg) {
      setParsedElement(null);
      return;
    }

    // Apply fill and stroke replacements
    let modifiedSvg = svg;
    if (fill && parseFill) {
      modifiedSvg = modifiedSvg.replace(/fill=".*?"/g, `fill="${fill}"`);
    }
    modifiedSvg = modifiedSvg.replace(/stroke=".*?"/g, `stroke="${stroke || 'currentColor'}"`);
    // replace xmlns:xlink with xmlnsXlink
    modifiedSvg = modifiedSvg.replace(/xmlns:xlink=/g, 'xmlnsXlink=');
    // Parse the SVG string and set the state
    // Replace xml:space with xml:Space to avoid React warnings
    modifiedSvg = modifiedSvg.replace(/xml:space=/g, 'xmlSpace=');
    const element = parseSvgString(modifiedSvg);
    setParsedElement(element);
  }, [svg, fill]); // Re-run effect if svg or fill changes

  if (!parsedElement) {
    return null;
  }

  // Clone the element and add the wrapper props
  return React.cloneElement(parsedElement, {
    className,
    opacity: opacity !== undefined ? opacity : parsedElement.props.opacity,
    ...rest,
  });
}
