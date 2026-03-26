"use client";

import { useState } from "react";

interface MCQ {
  question: string;
  options: string[];
}

interface Props {
  mcqs: MCQ[];
  onSubmit: (answers: number[]) => void;
}

export default function MCQView({ mcqs, onSubmit }: Props) {
  const [answers, setAnswers] = useState<number[]>(new Array(mcqs.length).fill(-1));

  const handleSelect = (qIdx: number, oIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = oIdx;
    setAnswers(newAnswers);
  };

  const isComplete = answers.every((a) => a !== -1);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8 border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-orange-500">Phase 1: Knowledge Assessment</h2>
        <p className="text-gray-400 mt-1">Please answer all multiple-choice questions to proceed to the coding phase.</p>
      </div>

      <div className="space-y-12">
        {mcqs.map((q, qIdx) => (
          <div key={qIdx} className="space-y-4">
            <h3 className="text-lg font-medium leading-relaxed">
              <span className="text-gray-500 mr-2">{qIdx + 1}.</span>
              {q.question}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {q.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => handleSelect(qIdx, oIdx)}
                  className={`p-4 text-left rounded-xl border transition-all duration-200 group ${
                    answers[qIdx] === oIdx
                      ? "bg-orange-600/10 border-orange-500 text-orange-400"
                      : "bg-gray-900 border-gray-800 hover:border-gray-600 text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      answers[qIdx] === oIdx ? "border-orange-500" : "border-gray-700 group-hover:border-gray-500"
                    }`}>
                      {answers[qIdx] === oIdx && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                    </div>
                    <span>{opt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-gray-800 flex justify-end">
        <button
          onClick={() => isComplete && onSubmit(answers)}
          disabled={!isComplete}
          className={`px-8 py-3 rounded-lg font-bold transition-all ${
            isComplete
              ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          Submit Answers & Start Coding →
        </button>
      </div>
    </div>
  );
}
