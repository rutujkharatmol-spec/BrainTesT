"use client";

export default function ExportButton() {
  const handleExport = () => {
    window.location.href = "/api/admin/export-data";
  };

  return (
    <button className="btn" onClick={handleExport} style={{ maxWidth: 300, margin: "auto" }}>
      Download Excel Export
    </button>
  );
}
