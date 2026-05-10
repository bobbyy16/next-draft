"use client";

import type React from "react";

interface TemplateProps {
  parsedText: string;
}

/**
 * Labels that appear above the actual name in some resumes.
 * We skip these so the real name is displayed.
 */
const NAME_LABELS = new Set([
  "your name",
  "name",
  "full name",
  "resume",
  "curriculum vitae",
  "cv",
]);

export function parseResumeSections(text: string) {
  const lines = text.split("\n").map((line) => line.trim());

  // Skip label lines like "YOUR NAME" at the very top
  let nameIndex = 0;
  while (nameIndex < Math.min(3, lines.length)) {
    if (NAME_LABELS.has(lines[nameIndex].toLowerCase().replace(/[:\-–]/g, "").trim())) {
      nameIndex += 1;
    } else {
      break;
    }
  }

  const name = lines[nameIndex] ?? "";

  const isHeader = (line: string) => {
    if (!line || line.length > 42) return false;
    if (line === line.toUpperCase() && /[A-Z]/.test(line)) return true;
    return line.endsWith(":") && line.length < 32;
  };

  // Find contact info lines (right after the name)
  let contactEnd = nameIndex + 1;
  for (let i = nameIndex + 1; i < Math.min(nameIndex + 7, lines.length); i += 1) {
    if (isHeader(lines[i])) break;
    if (!lines[i] && i > nameIndex + 2) break;
    if (lines[i]) contactEnd = i + 1;
  }

  const contactLines = lines.slice(nameIndex + 1, contactEnd).filter(Boolean);
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

/**
 * Detect if a line looks like a bullet point.
 * Matches:  - text, * text, • text, ‣ text, ▸ text,
 * or lines that start with a sentence (uppercase letter + verb pattern)
 * appearing under Experience/Projects sections.
 */
const isBulletLine = (line: string): boolean => {
  return /^[-*•‣▸►]\s/.test(line);
};

const cleanBullet = (line: string): string => {
  return line.replace(/^[-*•‣▸►]\s*/, "");
};

/**
 * Detect if a line is a role/entry heading (contains dates or pipes)
 */
const isEntryLine = (line: string): boolean => {
  return (
    line.includes(" — ") ||
    line.includes(" - ") ||
    /\b(20\d{2}|19\d{2}|Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(line)
  );
};

export function BasicResumeTemplate({ parsedText }: TemplateProps) {
  const { name, contactLines, sections } = parseResumeSections(parsedText);

  return (
    <article
      className="mx-auto h-[1056px] w-full max-w-[816px] overflow-hidden bg-white px-10 py-8 text-[#1a1a1a]"
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        fontSize: "10px",
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <header className="border-b-2 border-[#1a1a1a] pb-3">
        <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#0f172a]">
          {name || "Your Name"}
        </h1>
        {contactLines.length > 0 && (
          <p className="mt-1 text-[9.5px] tracking-wide text-[#555]">
            {contactLines.join("  \u00b7  ")}
          </p>
        )}
      </header>

      {/* Sections */}
      <div className="mt-3 space-y-2.5">
        {sections.map((section, index) => {
          const body = section.body.filter(Boolean);
          if (!section.title && body.length === 0) return null;

          const elements: React.ReactNode[] = [];
          let bulletBuffer: string[] = [];

          const flushBullets = () => {
            if (bulletBuffer.length === 0) return;
            elements.push(
              <ul
                key={`bullets-${elements.length}`}
                className="m-0 list-none space-y-0.5 pl-3"
                style={{ listStyle: "none" }}
              >
                {bulletBuffer.map((text, bi) => (
                  <li
                    key={bi}
                    className="relative m-0 pl-3 text-[10px] leading-[1.5] text-[#333]"
                  >
                    <span className="absolute left-0 top-0 text-[#888]">•</span>
                    {text}
                  </li>
                ))}
              </ul>
            );
            bulletBuffer = [];
          };

          body.forEach((line, lineIndex) => {
            if (isBulletLine(line)) {
              bulletBuffer.push(cleanBullet(line));
            } else {
              flushBullets();

              if (isEntryLine(line)) {
                // Role / entry heading
                elements.push(
                  <p
                    key={`entry-${lineIndex}`}
                    className="m-0 mt-1 text-[10px] font-semibold leading-[1.5] text-[#111]"
                  >
                    {line}
                  </p>
                );
              } else {
                // Regular body text — check if it looks like a descriptive sentence
                // (starts with uppercase, > 40 chars) under experience/projects
                const sectionType = section.title.toLowerCase();
                const isDescriptive =
                  (sectionType.includes("experience") ||
                    sectionType.includes("project") ||
                    sectionType.includes("work")) &&
                  line.length > 30 &&
                  /^[A-Z]/.test(line);

                if (isDescriptive) {
                  // Treat as bullet even without marker
                  bulletBuffer.push(line);
                } else {
                  elements.push(
                    <p
                      key={`line-${lineIndex}`}
                      className="m-0 text-[10px] leading-[1.5] text-[#333]"
                    >
                      {line}
                    </p>
                  );
                }
              }
            }
          });
          flushBullets();

          return (
            <section key={`${section.title}-${index}`}>
              {section.title && (
                <h2 className="mb-1 border-b border-[#ccc] pb-0.5 text-[10.5px] font-bold uppercase tracking-widest text-[#0f172a]">
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
