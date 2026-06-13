import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ResumeDraft } from "./ResumeTemplates";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingRight: 38,
    paddingBottom: 32,
    paddingLeft: 38,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    lineHeight: 1.4,
    color: "#333333",
  },
  compactPage: {
    paddingTop: 28,
    paddingRight: 34,
    paddingBottom: 28,
    paddingLeft: 34,
    fontSize: 9,
    lineHeight: 1.3,
  },
  header: {
    paddingBottom: 8,
    marginBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  name: {
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    lineHeight: 1.1,
    color: "#0f172a",
  },
  compactName: {
    fontSize: 18,
  },
  contact: {
    marginTop: 1,
    fontSize: 8.5,
    letterSpacing: 0.2,
    color: "#475569",
  },
  section: {
    marginBottom: 9,
  },
  compactSection: {
    marginBottom: 7,
  },
  sectionTitle: {
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 0.7,
    borderBottomColor: "#cbd5e1",
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    letterSpacing: 1.1,
    color: "#0f172a",
  },
  line: {
    marginBottom: 2,
  },
  entryLine: {
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  bulletRow: {
    flexDirection: "row",
    paddingLeft: 8,
    marginBottom: 2,
  },
  bullet: {
    width: 9,
    color: "#64748b",
  },
  bulletText: {
    flex: 1,
  },
});

const normalizeBullet = (line: string) => line.replace(/^[-*\u2022\u25aa\u25b8\u25ba]\s*/, "");
const isBulletLine = (line: string) => /^[-*\u2022\u25aa\u25b8\u25ba]\s/.test(line);
const isEntryLine = (line: string) =>
  line.includes(" | ") ||
  line.includes(" - ") ||
  line.includes(" \u2014 ") ||
  /\b(20\d{2}|19\d{2}|Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(
    line
  );

export function ResumePdfDocument({ draft }: { draft: ResumeDraft }) {
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
  const compact = totalCharacters > 3000 || totalLines > 32;

  return (
    <Document title={`${draft.name || "Resume"} - Resume`}>
      <Page size="LETTER" style={[styles.page, compact ? styles.compactPage : {}]}>
        <View style={styles.header}>
          <Text style={[styles.name, compact ? styles.compactName : {}]}>
            {draft.name || "Your Name"}
          </Text>
          {draft.contactLines.filter(Boolean).map((line, index) => (
            <Text key={`contact-${index}`} style={styles.contact}>
              {line}
            </Text>
          ))}
        </View>

        {draft.sections.map((section) => (
          <View
            key={section.id}
            style={[styles.section, compact ? styles.compactSection : {}]}
          >
            {section.title && (
              <Text style={styles.sectionTitle} minPresenceAhead={24}>
                {section.title.toUpperCase()}
              </Text>
            )}
            {section.lines.filter(Boolean).map((line, index) => {
              if (isBulletLine(line)) {
                return (
                  <View key={`${section.id}-${index}`} style={styles.bulletRow}>
                    <Text style={styles.bullet}>{"\u2022"}</Text>
                    <Text style={styles.bulletText}>{normalizeBullet(line)}</Text>
                  </View>
                );
              }

              return (
                <Text
                  key={`${section.id}-${index}`}
                  style={isEntryLine(line) ? styles.entryLine : styles.line}
                >
                  {line}
                </Text>
              );
            })}
          </View>
        ))}
      </Page>
    </Document>
  );
}
