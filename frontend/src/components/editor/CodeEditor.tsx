"use client";

import { useCallback } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  onChange: (value: string) => void;
  onLanguageChange?: (language: string) => void;
  value?: string;
  language?: string;
  readOnly?: boolean;
}

const languages = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
];

export default function CodeEditor({ 
  onChange, 
  onLanguageChange, 
  value = "", 
  language = "python", 
  readOnly = false 
}: CodeEditorProps) {
  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(val || "");
    },
    [onChange]
  );

  // Block paste and log it
  const handleMount = useCallback((editor: { onKeyDown: (handler: (e: { browserEvent: KeyboardEvent }) => void) => void }) => {
    editor.onKeyDown((e: { browserEvent: KeyboardEvent }) => {
      if ((e.browserEvent.ctrlKey || e.browserEvent.metaKey) && e.browserEvent.key === "v") {
        // Paste is allowed but will be captured as telemetry by the keystroke handler
        // This event propagates to the window-level keydown handler
      }
    });
  }, []);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-800">
      <div className="bg-gray-900 px-4 py-2 text-xs text-gray-400 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-4">
          <span>{language.toUpperCase()} Editor</span>
          {onLanguageChange && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-orange-500"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          )}
        </div>
        {readOnly && <span className="text-yellow-500">READ ONLY</span>}
      </div>
      <Editor
        height="60vh"
        language={language}
        theme="vs-dark"
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          readOnly,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 16 },
        }}
      />
    </div>
  );
}
