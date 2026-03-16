"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
  language?: string;
}

export default function CodeEditor({
  value,
  onChange,
  readOnly = false,
  language = "javascript",
}: CodeEditorProps) {
  return (
    <Editor
      height="480px"
      language={language}
      theme="vs-dark"
      value={value}
      onChange={onChange}
      options={{
        readOnly,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        lineNumbers: "on",
        bracketPairColorization: { enabled: true },
        automaticLayout: true,
        wordWrap: "on",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        renderLineHighlight: "gutter",
      }}
    />
  );
}
