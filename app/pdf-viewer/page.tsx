"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, DownloadIcon } from "lucide-react";

export default function PDFViewer() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const response = await fetch("/api/generate-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: localStorage.getItem("studentInfo"),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        } else {
          setError("Failed to generate PDF");
        }
      } catch (error) {
        setError("Error fetching PDF");
      }
    };

    fetchPdf();
  }, []);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = "student_practical_info.pdf";
      link.click();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generated PDF</h1>
      {error ? (
        <p>Error: {error}</p>
      ) : pdfUrl ? (
        <>
          <div className="mb-4 flex gap-3 items-center">
            <Button onClick={handleDownload}>
              <DownloadIcon />
              Download PDF
            </Button>
            <Link href={"/"}>
              <Button variant={"outline"}>
                <ArrowLeft />
                Go Back
              </Button>
            </Link>
          </div>
          <iframe src={pdfUrl} className="w-full h-screen" />
        </>
      ) : (
        <p>Loading PDF...</p>
      )}
    </div>
  );
}
