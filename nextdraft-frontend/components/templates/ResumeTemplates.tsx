"use client";

import type React from "react";

interface TemplateProps {
  parsedText: string;
}

export function parseResumeSections(text: string) {
  const lines = text.split("\n").map((line) => line.trim());
  const name = lines[0] ?? "";

  const isHeader = (line: string) => {
    if (!line || line.length > 42) return false;
    if (line === line.toUpperCase() && /[A-Z]/.test(line)) return true;
    return line.endsWith(":") && line.length < 32;
  };

  let contactEnd = 1;
  for (let i = 1; i < Math.min(7, lines.length); i += 1) {
    if (isHeader(lines[i])) break;
    if (!lines[i] && i > 2) break;
    if (lines[i]) contactEnd = i + 1;
  }

  const contactLines = lines.slice(1, contactEnd).filter(Boolean);
  const sections: { title: string; body: string[] }[] = [];
  let title = "";
  let body: string[] = [];

  lines.slice(contactEnd).forEach((line) => {
    if (isHeader(line)) {
      if (title || body.some(Boolean)) sections.push({ title, body });
      title = line.replace(/:$/, "");
      body = [];
    } else {
      body.push(line);
    }
  });

  if (title || body.some(Boolean)) sections.push({ title, body });
  return { name, contactLines, sections };
}

export function BasicResumeTemplate({ parsedText }: TemplateProps) {
  const { name, contactLines, sections } = parseResumeSections(parsedText);

  return (
    <article
      className="mx-auto h-[1056px] w-full max-w-[816px] overflow-hidden bg-white px-10 py-9 text-[#111]"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        lineHeight: 1.42,
      }}
    >
      <header className="border-b border-black pb-2 text-center">
        <h1 className="m-0 text-[21px] font-bold uppercase tracking-normal">
          {name || "Your Name"}
        </h1>
        {contactLines.length > 0 && (
          <p className="mt-1 text-[9.5px] text-[#333]">
            {contactLines.join(" | ")}
          </p>
        )}
      </header>

      <div className="mt-3 space-y-3">
        {sections.map((section, index) => {
          const body = section.body.filter(Boolean);
          if (!section.title && body.length === 0) return null;

          // Group consecutive bullets into lists
          const elements: React.ReactNode[] = [];
          let bulletBuffer: string[] = [];

          const flushBullets = () => {
            if (bulletBuffer.length === 0) return;
            elements.push(
              <ul key={`bullets-${elements.length}`} className="m-0 list-disc space-y-0.5 pl-5">
                {bulletBuffer.map((text, bi) => (
                  <li key={bi} className="m-0 text-[10px] font-normal text-[#222]">
                    {text}
                  </li>
                ))}
              </ul>
            );
            bulletBuffer = [];
          };

          body.forEach((line, lineIndex) => {
            const isBullet = /^[-*•]\s/.test(line);
            if (isBullet) {
              bulletBuffer.push(line.replace(/^[-*•]\s*/, ""));
            } else {
              flushBullets();
              const isEntry =
                line.includes("|") ||
                /\b(20\d{2}|19\d{2}|Present|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(line);

              elements.push(
                <p
                  key={`${line}-${lineIndex}`}
                  className={`m-0 text-[10px] ${isEntry ? "font-semibold text-black" : "font-normal text-[#222]"}`}
                >
                  {line}
                </p>
              );
            }
          });
          flushBullets();

          return (
            <section key={`${section.title}-${index}`}>
              {section.title && (
                <h2 className="mb-1 border-b border-black pb-0.5 text-[10px] font-bold uppercase tracking-normal">
                  {section.title}
                </h2>
              )}
              <div className="space-y-0.5">{elements}</div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
