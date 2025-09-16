const Suggestion = require("../models/Suggestion_model");
const Resume = require("../models/Resume_model");
const JobDescription = require("../models/JobDescription_model");

// Install: npm install @google/generative-ai
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generateResumeSuggestions = async (resumeId, jobId) => {
  try {
    // Fetch resume and job description
    const resume = await Resume.findById(resumeId);
    const job = await JobDescription.findById(jobId);

    if (!resume || !job) throw new Error("Resume or Job Description not found");

    const prompt = `
You are an expert career advisor. Analyze this resume against the job description and provide actionable suggestions.

RESUME TEXT:
${resume.parsedText}

JOB DESCRIPTION:
${job.parsedText}

Return ONLY a valid JSON array with specific suggestions. No additional text or formatting:

[
  {
    "type": "keyword",
    "originalText": "specific text from resume",
    "suggestedText": "improved version with job keywords",
    "explanation": "why this improvement helps",
    "priority": "high"
  },
  {
    "type": "phrasing",
    "originalText": "another text from resume",
    "suggestedText": "better professional phrasing",
    "explanation": "explanation for the change",
    "priority": "medium"
  }
]

Focus on:
- Missing keywords from job description
- Better action verbs and quantified achievements  
- Professional phrasing improvements
- Technical skills alignment
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let suggestionsData;
    try {
      // Clean the response - remove any markdown formatting
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      suggestionsData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      // Fallback suggestions
      suggestionsData = [
        {
          type: "keyword",
          originalText: "Unable to parse suggestions",
          suggestedText: "Please try again - response format issue",
          explanation: "AI response was not in expected JSON format",
          priority: "low",
        },
      ];
    }

    // Ensure it's an array
    if (!Array.isArray(suggestionsData)) {
      suggestionsData = [suggestionsData];
    }

    // Calculate overall score based on suggestions
    const overallScore = Math.max(50, 100 - suggestionsData.length * 10);

    const suggestion = await Suggestion.create({
      resumeId,
      jobId,
      suggestions: suggestionsData,
      overallScore,
    });

    return suggestion;
  } catch (error) {
    console.error("Error in generateResumeSuggestions:", error);
    throw error;
  }
};

module.exports = { generateResumeSuggestions };
