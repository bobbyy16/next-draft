const Suggestion = require("../models/Suggestion_model");
const Resume = require("../models/Resume_model");
const JobDescription = require("../models/JobDescription_model");
const User = require("../models/User_model");

require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const POINTS_PER_EDIT = 50;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const buildPrompt = (resumeText, jobText) => `
You are an ATS resume keyword optimizer. Suggest minimal wording improvements to EXISTING text in the resume to better match the job description keywords.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobText}

Return ONLY valid JSON, no markdown fences, no extra text:
{
  "suggestions": [
    {
      "type": "missing_keyword",
      "originalText": "exact verbatim phrase from the resume",
      "suggestedText": "same phrase with improved keywords",
      "explanation": "Single sentence, max 15 words, why this helps ATS.",
      "priority": "high",
      "section": "skills"
    }
  ]
}

RULES - every rule is mandatory:
1. "originalText" must be copied character-for-character from the RESUME above. No paraphrasing. No summarizing. If you cannot find the exact text, skip that suggestion entirely.
2. "suggestedText" is a minimal rewrite of "originalText" only. Do NOT add new sentences, new claims, or information that is not already in the resume.
3. Do NOT fabricate experience, certifications, metrics, or qualifications.
4. Do NOT add multi-sentence explanations, advisory notes, or conditional language. One factual sentence only.
5. Do NOT suggest information the candidate would need to invent or verify independently.
6. Return 5-7 suggestions maximum. Quality over quantity.
7. "type": missing_keyword | weak_action_verb | quantify_achievement | skills_gap | phrasing | summary_improvement
8. "section": summary | experience | education | skills | general
9. "priority": high | medium | low
`;

const parseAiSuggestions = async (resumeText, jobText) => {
  let parsed;
  try {
    const result = await model.generateContent(buildPrompt(resumeText, jobText));
    const response = await result.response;
    const text = response.text();
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error("[Gemini] parse error:", e.message);
    parsed = { suggestions: [] };
  }

  const suggestionsData = Array.isArray(parsed.suggestions)
    ? parsed.suggestions.filter((item) => item.originalText && item.suggestedText)
    : [];

  return { suggestionsData };
};

const applySuggestionText = (resumeText, suggestions = []) => {
  let updatedText = resumeText;
  const applied = [];

  suggestions.forEach((item) => {
    if (!item.originalText || !item.suggestedText) return;
    if (!updatedText.includes(item.originalText)) return;
    updatedText = updatedText.replace(item.originalText, item.suggestedText);
    applied.push({ ...item, applied: true });
  });

  return { updatedText, applied };
};

const generateResumeSuggestions = async (resumeId, jobId) => {
  const resume = await Resume.findById(resumeId);
  const job = await JobDescription.findById(jobId);
  if (!resume || !job) throw new Error("Resume or Job Description not found");

  const { suggestionsData } = await parseAiSuggestions(resume.parsedText, job.parsedText);

  return await Suggestion.create({
    resumeId,
    jobId,
    suggestions: suggestionsData,
  });
};

const generateAndApplySuggestions = async ({
  resumeId,
  jobText,
  roleTitle,
  companyName,
  userId,
}) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error("Resume not found");
  if (String(resume.userId) !== String(userId)) throw new Error("Not authorized");

  // Atomic conditional debit — only succeeds if enough points
  const debited = await User.findOneAndUpdate(
    { _id: userId, pointsBalance: { $gte: POINTS_PER_EDIT } },
    {
      $inc: { pointsBalance: -POINTS_PER_EDIT },
      $push: {
        pointsLedger: {
          type: "debit",
          points: POINTS_PER_EDIT,
          rupees: 0,
          reason: `AI resume edit: ${resume.fileName}`,
        },
      },
    },
    { new: true }
  );

  if (!debited) {
    throw new Error(`Not enough points. ${POINTS_PER_EDIT} points are required per AI edit.`);
  }

  let suggestion;
  try {
    const job = await JobDescription.create({
      userId,
      parsedText: jobText.trim(),
      roleTitle: roleTitle || "Target role",
      companyName: companyName || "",
      keywords: [],
    });

    const { suggestionsData } = await parseAiSuggestions(resume.parsedText, job.parsedText);
    const { updatedText, applied } = applySuggestionText(resume.parsedText, suggestionsData);

    suggestion = await Suggestion.create({
      resumeId,
      jobId: job._id,
      suggestions: applied.length > 0 ? applied : suggestionsData,
      appliedCount: applied.length,
      pointsSpent: POINTS_PER_EDIT,
      jobTitle: roleTitle || "Target role",
    });

    resume.parsedText = updatedText;
    resume.version += 1;
    resume.isEdited = true;
    await resume.save();

    return {
      suggestion,
      resume,
      pointsBalance: debited.pointsBalance,
      optimizedText: updatedText,
      appliedCount: applied.length,
      totalSuggestions: suggestionsData.length,
    };
  } catch (err) {
    // Refund on failure — atomic credit
    await User.findByIdAndUpdate(userId, {
      $inc: { pointsBalance: POINTS_PER_EDIT },
      $push: {
        pointsLedger: {
          type: "credit",
          points: POINTS_PER_EDIT,
          rupees: 0,
          reason: "Refund — AI edit failed",
        },
      },
    });
    throw err;
  }
};

const applySuggestionsToPdf = async (suggestionId) => {
  if (!suggestionId) throw new Error("suggestionId required");

  const suggestion = await Suggestion.findById(suggestionId);
  if (!suggestion) throw new Error("Suggestion not found");

  const resume = await Resume.findById(suggestion.resumeId);
  if (!resume) throw new Error("Linked resume not found");

  const { updatedText, applied } = applySuggestionText(resume.parsedText, suggestion.suggestions);

  resume.parsedText = updatedText;
  if (applied.length > 0) {
    resume.version += 1;
    resume.isEdited = true;
  }
  await resume.save();

  return resume.fileUrl;
};

module.exports = {
  generateResumeSuggestions,
  generateAndApplySuggestions,
  applySuggestionsToPdf,
  POINTS_PER_EDIT,
};
