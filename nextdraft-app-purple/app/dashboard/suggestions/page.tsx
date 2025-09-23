"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  FileText,
  Briefcase,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface Resume {
  _id: string;
  fileName: string;
  parsedText: string;
}

interface JobDescription {
  _id: string;
  roleTitle: string;
  companyName: string;
  parsedText: string;
}

interface Suggestion {
  type: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  priority: "high" | "medium" | "low";
}

interface SuggestionData {
  _id: string;
  resumeId: string;
  jobId: string;
  suggestions: Suggestion[];
  overallScore: number;
  createdAt: string;
}

export default function SuggestionsPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getFileType = (fileName: string, fileUrl: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "pdf" || fileUrl?.includes(".pdf")) {
      return "pdf";
    }
    return "document";
  };
  useEffect(() => {
    fetchResumes();
    fetchJobDescriptions();
  }, []);

  const fetchResumes = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch("http://localhost:5000/api/resumes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    }
  };

  const fetchJobDescriptions = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        "http://localhost:5000/api/job-descriptions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setJobDescriptions(data);
      }
    } catch (error) {
      console.error("Failed to fetch job descriptions:", error);
    }
  };

  const generateSuggestions = async () => {
    if (!selectedResumeId || !selectedJobId) {
      setError("Please select both a resume and job description");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");
    setSuggestions(null);

    try {
      const token = getAuthToken();
      const response = await fetch(
        "http://localhost:5000/api/suggestions/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resumeId: selectedResumeId,
            jobId: selectedJobId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuggestions(data.suggestion);
        setSuccess("AI suggestions generated successfully!");
      } else {
        setError(data.message || "Failed to generate suggestions");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="w-4 h-4" />;
      case "medium":
        return <Clock className="w-4 h-4" />;
      case "low":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const selectedResume = resumes.find((r) => r._id === selectedResumeId);
  const selectedJob = jobDescriptions.find((j) => j._id === selectedJobId);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
          Resume Optimizer
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Get AI-powered suggestions to optimize your resume for specific job
          descriptions.
        </p>
      </div>

      {/* Step 1: Select Resume & Job */}
      <Card className="border-border bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span>Generate AI Suggestions</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Select a resume and job description to get targeted optimization
            suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription className="text-sm">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2 w-full max-w-full">
              <label className="text-sm font-medium">Select Resume</label>
              <Select
                value={selectedResumeId}
                onValueChange={setSelectedResumeId}
              >
                <SelectTrigger className="bg-input border-border h-10 sm:h-11 w-full max-w-full">
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent className="w-full max-w-full">
                  {resumes.map((resume) => (
                    <SelectItem key={resume._id} value={resume._id}>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span className="truncate">{resume.fileName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 w-full max-w-full">
              <label className="text-sm font-medium">
                Select Job Description
              </label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="bg-input border-border h-10 sm:h-11 w-full max-w-full">
                  <SelectValue placeholder="Choose a job description" />
                </SelectTrigger>
                <SelectContent className="w-full max-w-full">
                  {jobDescriptions.map((job) => (
                    <SelectItem key={job._id} value={job._id}>
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="truncate">
                          {job.roleTitle} at {job.companyName}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateSuggestions}
            disabled={!selectedResumeId || !selectedJobId || generating}
            className="w-full h-10 sm:h-11"
            size="lg"
          >
            {generating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">
                  Generating AI Suggestions...
                </span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">
                  Generate AI Suggestions
                </span>
                <span className="sm:hidden">Generate</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {suggestions && selectedResume && selectedJob && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resume Display */}
          <div className="lg:col-span-1">
            <Card className="border-border bg-card h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <span>Resume</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">
                  {selectedResume.fileName}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {/* Display PDF or fallback for other formats */}
                {selectedResume.fileUrl &&
                getFileType(selectedResume.fileName, selectedResume.fileUrl) ===
                  "pdf" ? (
                  <div className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] border rounded-lg overflow-hidden">
                    <iframe
                      src={selectedResume.fileUrl}
                      className="w-full h-full"
                      title={`Resume: ${selectedResume.fileName}`}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        This document format cannot be previewed inline. Open or
                        download the file from your resume list.
                      </AlertDescription>
                    </Alert>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Parsed Content:</h4>
                      <div className="text-sm text-foreground whitespace-pre-wrap max-h-[40vh] sm:max-h-[60vh] overflow-y-auto">
                        {selectedResume.parsedText || "No content available"}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Job Description Display */}
          <div className="lg:col-span-1">
            <Card className="border-border bg-card h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <span>Job Description</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  <div className="truncate">{selectedJob.roleTitle}</div>
                  <div className="truncate text-muted-foreground">
                    at {selectedJob.companyName}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="bg-muted/30 p-3 sm:p-4 rounded-lg max-h-[500px] overflow-y-auto">
                  <div className="text-xs sm:text-sm text-foreground whitespace-pre-wrap break-words">
                    {selectedJob.parsedText}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions Display */}
          <div className="lg:col-span-1">
            <Card className="border-border bg-card h-full">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                    AI Suggestions
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Score: {suggestions.overallScore}%
                  </Badge>
                </div>
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <span>Optimization</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {suggestions.suggestions.length} suggestions generated
                </CardDescription>
                <Progress
                  value={suggestions.overallScore}
                  className="w-full h-2"
                />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto">
                  {suggestions.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 border-border"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Badge
                          className={`${getPriorityColor(
                            suggestion.priority
                          )} text-xs`}
                        >
                          {getPriorityIcon(suggestion.priority)}
                          <span className="ml-1 capitalize">
                            {suggestion.priority}
                          </span>
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs truncate max-w-[120px]"
                        >
                          {suggestion.type}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Original:
                          </p>
                          <p className="text-xs sm:text-sm bg-red-500/10 p-2 rounded border border-red-500/20 break-words">
                            {suggestion.originalText}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Suggested:
                          </p>
                          <p className="text-xs sm:text-sm bg-green-500/10 p-2 rounded border border-green-500/20 break-words">
                            {suggestion.suggestedText}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {suggestion.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!suggestions && !generating && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 text-center">
              Ready to optimize your resume?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-md">
              Select a resume and job description above to get AI-powered
              suggestions for better job matching.
            </p>
            {resumes.length === 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                You need to upload at least one resume to get started.
              </p>
            )}
            {jobDescriptions.length === 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                You need to add at least one job description to get started.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
