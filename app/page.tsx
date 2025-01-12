
"use client";
import React, { useState, useEffect } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";

// Radix UI Label
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

// Basic Input
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    className={`flex h-10 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

// Basic Button
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={`inline-flex items-center justify-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

// Main component
export default function Home() {
  const [fragments, setFragments] = useState<
    { filename: string; content: string; raw_length?: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalCharacters, setTotalCharacters] = useState<number | null>(null);
  const [maxLen, setMaxLen] = useState(4096);
  const [file, setFile] = useState<File | null>(null);
  const [sourceHtml, setSourceHtml] = useState<string | null>(null);

  // 1) Optionally fetch default source.html from /public/source.html (if that’s your design)
  useEffect(() => {
    async function fetchHtml() {
      try {
        const response = await fetch("/source.html");
        if (!response.ok) {
          throw new Error(`Failed to fetch source.html: ${response.statusText}`);
        }
        const htmlText = await response.text();
        setSourceHtml(htmlText);
      } catch (err: unknown) {
        console.error(err);
        setError("Failed to load default HTML source.");
      }
    }
    fetchHtml();
  }, []);

  // 2) Auto-submit after default source is fetched (optional)
  useEffect(() => {
    if (sourceHtml) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceHtml]);

  // 3) Submit the form to the backend
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!file && !sourceHtml) {
      setError("Default HTML source is not loaded yet.");
      return;
    }

    setLoading(true);
    setError(null);
    setFragments([]);
    setTotalCharacters(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else {
        const defaultFile = new File([sourceHtml!], "source.html", {
          type: "text/html",
        });
        formData.append("file", defaultFile);
      }

      formData.append("max_len", maxLen.toString());

      // POST to your Flask backend
      const response = await fetch("http://localhost:8002/api/split", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Unknown error occurred");
      }

      // JSON structure: { fragments: [...], totalCharacters: N }
      const json = await response.json();
      setFragments(json.fragments ?? []);
      setTotalCharacters(json.totalCharacters ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col p-4 max-w-7xl mx-auto gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Фрагментация HTML</h1>
        <h1 className="text-xl font-semibold text-red-700">Касымхан Болат</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 w-fit">
          <Label htmlFor="file" className="font-semibold">Файл HTML</Label>
          <Input
            id="file"
            type="file"
            accept=".html,text/html"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />
          <div className="text-sm text-gray-500">
            Оставьте пустым, чтобы использовать source.html по умолчанию
          </div>
        </div>

        <div className="space-y-2 w-fit">
          <Label htmlFor="maxLen" className="font-semibold">
            Маскимальная длина символов (max_len)
          </Label>
          <Input
            id="maxLen"
            type="number"
            value={maxLen}
            onChange={(e) => setMaxLen(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "В процессе..." : "Разделить HTML"}
        </Button>
      </form>

      {totalCharacters !== null && (
        <div className="text-sm text-gray-600">
          Общее количество символов в изначальном HTML: {totalCharacters}
        </div>
      )}

      {error && (
        <div className="text-red-600 font-semibold">
          Error: {error}
        </div>
      )}

      {/* Display each fragment */}
      {fragments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Фрагменты</h2>
          {/* Example: 2 columns */}
          <div className="grid grid-cols-2 gap-4">
          {fragments.map((fragment, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-white shadow w-full">
              <div className="text-sm text-gray-600 mb-2">
                <strong>{fragment.filename}</strong>
                <br />
                Raw length: {fragment.raw_length} chars
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {/* Show prettified HTML from backend */}
                  {fragment.content}
                </pre>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
