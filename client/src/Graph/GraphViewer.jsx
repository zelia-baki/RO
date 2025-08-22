import React from "react";

export default function GraphViewer({ containerRef }) {
  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "500px" }}
      className="border rounded-lg shadow-sm"
    />
  );
}
