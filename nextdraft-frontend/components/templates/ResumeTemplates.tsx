"use client";

import type React from "react";

export interface ResumeSection {
  id: string;
  title: string;
  lines: string[];
}

export interface ResumeDraft {
  name: string;
  contactLines: string[];
  sections: ResumeSection[];
}

interface TemplateProps {
  draft: ResumeDraft;
  editable?: boolean;
  onChange?: (draft: ResumeDraft) => void;
  exportMode?: boolean;
}

const NAME_LABELS = new Set(["your name", "name", "full name", "resume", "curriculum vitae", "cv"]);

let idCounter = 0;
const makeId = (prefix: string) => `${prefix}-${++idCounter}`;

const isHeader = (line: string) => {
  if (!line || line.length > 42) return false;
  if (line === line.toUpperCase() && /[A-Z]/.test(line)) return true;
  return line.endsWith(":") && line.length < 32;
};

const normalizeBullet = (line: string) => line.replace(/^[-*•▪▸►]\s*/, "");
const isBulletLine = (line: string) => /^[-*•▪▸►]\s/.test(line);
const isEntryLine = (line: string) =>
  line.includes(" | ") ||
  line.includes(" - ") ||
  line.includes(" — ") ||
  /\b(20\d{2}|19\d{2}|Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(line);

export function parseResumeDraft(text: string): ResumeDraft {
  const lines = text.split("\n").map((line) => line.trim());
  let nameIndex = 0;

  while (nameIndex < Math.min(3, lines.length)) {
    const normalized = lines[nameIndex].toLowerCase().replace(/[:\-–]/g, "").trim();
    if (NAME_LABELS.has(normalized)) nameIndex += 1;
    else break;
  }

  const name = lines[nameIndex] ?? "";
  let contactEnd = nameIndex + 1;

  for (let index = nameIndex + 1; index < Math.min(nameIndex + 7, lines.length); index += 1) {
    if (isHeader(lines[index])) break;
    if (!lines[index] && index > nameIndex + 2) break;
    if (lines[index]) contactEnd = index + 1;
  }

  const contactLines = lines.slice(nameIndex + 1, contactEnd).filter(Boolean);
  const sections: ResumeSection[] = [];
  let title = "";
  let body: string[] = [];

  lines.slice(contactEnd).forEach((line) => {
    if (isHeader(line)) {
      if (title || body.some(Boolean)) {
        sections.push({
          id: makeId("section"),
          title,
          lines: body.filter(Boolean),
        });
      }
      title = line.replace(/:$/, "");
      body = [];
      return;
    }
    body.push(line);
  });

  if (title || body.some(Boolean)) {
    sections.push({
      id: makeId("section"),
      title,
      lines: body.filter(Boolean),
    });
  }

  return { name, contactLines, sections };
}

export function serializeResumeDraft(draft: ResumeDraft): string {
  const output: string[] = [];
  output.push(draft.name.trim());
  draft.contactLines.map((line) => line.trim()).filter(Boolean).forEach((line) => output.push(line));
  output.push("");

  draft.sections.forEach((section) => {
    if (section.title.trim()) output.push(section.title.trim().toUpperCase());
    section.lines.map((line) => line.trimEnd()).filter(Boolean).forEach((line) => output.push(line));
    output.push("");
  });

  return output.join("\n").trim();
}

function commitContent(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\r/g, "").trimEnd();
}

function EditableText({
  value,
  className,
  placeholder,
  onCommit,
}: {
  value: string;
  className: string;
  placeholder?: string;
  onCommit: (value: string) => void;
}) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(event) => onCommit(commitContent(event.currentTarget.innerText))}
      className={className}
      data-placeholder={placeholder || ""}
    >
      {value}
    </div>
  );
}

export function BasicResumeTemplate({
  draft,
  editable = false,
  onChange,
  exportMode = false,
}: TemplateProps) {
  const totalLines =
    draft.contactLines.length +
    draft.sections.reduce((count, section) => count + Math.max(section.lines.length, 1), 0);
  const totalCharacters =
    draft.name.length +
    draft.contactLines.join("").length +
    draft.sections.reduce(
      (count, section) => count + section.title.length + section.lines.join("").length,
      0
    );
  const compactLevel =
    totalCharacters > 4200 || totalLines > 42 ? 2 : totalCharacters > 3000 || totalLines > 32 ? 1 : 0;
  const articlePadding = compactLevel === 2 ? "28px 32px" : compactLevel === 1 ? "30px 36px" : "32px 40px";
  const articleFontSize = compactLevel === 2 ? "9.2px" : compactLevel === 1 ? "9.6px" : "10px";
  const articleLineHeight = compactLevel === 2 ? 1.3 : compactLevel === 1 ? 1.38 : 1.5;
  const showEditorControls = editable && !exportMode;
  const updateDraft = (next: ResumeDraft) => {
    if (onChange) onChange(next);
  };

  const updateSection = (sectionId: string, updater: (section: ResumeSection) => ResumeSection) => {
    updateDraft({
      ...draft,
      sections: draft.sections.map((section) =>
        section.id === sectionId ? updater(section) : section
      ),
    });
  };

  const addLine = (sectionId: string) => {
    updateSection(sectionId, (section) => ({
      ...section,
      lines: [...section.lines, "- New bullet"],
    }));
  };

  const removeLine = (sectionId: string, lineIndex: number) => {
    updateSection(sectionId, (section) => ({
      ...section,
      lines: section.lines.filter((_, index) => index !== lineIndex),
    }));
  };

  const addSection = () => {
    updateDraft({
      ...draft,
      sections: [
        ...draft.sections,
        { id: makeId("section"), title: "NEW SECTION", lines: ["- New bullet"] },
      ],
    });
  };

  const removeSection = (sectionId: string) => {
    updateDraft({
      ...draft,
      sections: draft.sections.filter((section) => section.id !== sectionId),
    });
  };

  return (
    <article
      className="mx-auto min-h-[1056px] w-full max-w-[816px] bg-white px-10 py-8 text-[#1a1a1a]"
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        fontSize: articleFontSize,
        lineHeight: articleLineHeight,
        padding: articlePadding,
      }}
    >
      <header className="border-b border-[#ccc] pb-3">
        {editable ? (
          <EditableText
            value={draft.name}
            placeholder="Your Name"
            className={`${compactLevel === 2 ? "text-[20px]" : "text-[22px]"} min-h-[28px] font-bold tracking-tight text-[#0f172a] outline-none`}
            onCommit={(value) => updateDraft({ ...draft, name: value || "Your Name" })}
          />
        ) : (
          <h1 className={`m-0 ${compactLevel === 2 ? "text-[20px]" : "text-[22px]"} font-bold tracking-tight text-[#0f172a]`}>
            {draft.name || "Your Name"}
          </h1>
        )}

        <div className="mt-1 space-y-1">
          {draft.contactLines.map((line, index) =>
            editable ? (
              <EditableText
                key={`contact-${index}-${line}`}
                value={line}
                placeholder="Email | Phone | City | Portfolio"
                className="min-h-[18px] text-[9.5px] tracking-wide text-[#555] outline-none"
                onCommit={(value) => {
                  const next = [...draft.contactLines];
                  next[index] = value;
                  updateDraft({ ...draft, contactLines: next.filter((item) => item.trim() || next.length === 1) });
                }}
              />
            ) : (
              <p key={`contact-${index}`} className="text-[9.5px] tracking-wide text-[#555]">
                {line}
              </p>
            )
          )}
          {showEditorControls && (
            <button
              type="button"
              onClick={() => updateDraft({ ...draft, contactLines: [...draft.contactLines, ""] })}
              className="editor-only text-[10px] font-semibold text-teal-700"
            >
              Add contact line
            </button>
          )}
        </div>
      </header>

      <div className="mt-3 space-y-3">
        {draft.sections.map((section) => (
          <section key={section.id}>
            <div className="mb-1 flex items-center justify-between gap-3 border-b border-[#ccc] pb-0.5">
              {editable ? (
                <EditableText
                  value={section.title}
                  placeholder="SECTION TITLE"
                  className="min-h-[18px] flex-1 text-[10.5px] font-bold uppercase tracking-widest text-[#0f172a] outline-none"
                  onCommit={(value) => updateSection(section.id, (current) => ({ ...current, title: value }))}
                />
              ) : (
                <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-[#0f172a]">{section.title}</h2>
              )}
              {showEditorControls && (
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="editor-only text-[10px] font-semibold text-rose-600"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-1">
              {section.lines.map((line, lineIndex) => {
                const bullet = isBulletLine(line);
                const display = bullet ? normalizeBullet(line) : line;
                const lineClass = isEntryLine(line)
                  ? "min-h-[18px] text-[10px] font-semibold text-[#111] outline-none"
                  : "min-h-[18px] text-[10px] text-[#333] outline-none";

                if (!editable) {
                  return (
                    <div key={`${section.id}-${lineIndex}`} className={bullet ? "flex gap-1.5 pl-3" : ""}>
                      {bullet && <span className="text-[#888]">•</span>}
                      <p className={lineClass}>{display}</p>
                    </div>
                  );
                }

                return (
                  <div key={`${section.id}-${lineIndex}`} className="group flex items-start gap-2">
                    {bullet && <span className="pt-[1px] text-[#888]">•</span>}
                    <EditableText
                      value={display}
                      placeholder={bullet ? "Bullet text" : "Line text"}
                      className={`${lineClass} flex-1`}
                      onCommit={(value) =>
                        updateSection(section.id, (current) => ({
                          ...current,
                          lines: current.lines.map((currentLine, currentIndex) =>
                            currentIndex === lineIndex
                              ? bullet
                                ? `- ${value}`
                                : value
                              : currentLine
                          ),
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(section.id, lineIndex)}
                      className="editor-only opacity-0 text-[10px] font-semibold text-rose-600 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}

              {showEditorControls && (
                <button
                  type="button"
                  onClick={() => addLine(section.id)}
                  className="editor-only pt-1 text-[10px] font-semibold text-teal-700"
                >
                  Add line
                </button>
              )}
            </div>
          </section>
        ))}

        {showEditorControls && (
          <button
            type="button"
            onClick={addSection}
            className="editor-only pt-1 text-[11px] font-semibold text-teal-700"
          >
            Add section
          </button>
        )}
      </div>
    </article>
  );
}
