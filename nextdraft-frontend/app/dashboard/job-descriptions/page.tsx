"use client";

import type React from "react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Eye, Trash2, Building } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/utils";

interface JobDescription {
  _id: string;
  parsedText: string;
  roleTitle: string;
  companyName: string;
  keywords: string[];
  createdAt: string;
}

export default function JobDescriptionsPage() {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewingJob, setViewingJob] = useState<JobDescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    text: "",
    roleTitle: "",
    companyName: "",
    keywords: "",
  });

  useEffect(() => {
    fetchJobDescriptions();
  }, []);

  const fetchJobDescriptions = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/job-descriptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobDescriptions(data);
      }
    } catch (error) {
      console.error("Failed to fetch job descriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const keywordsArray = formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const payload = {
        text: formData.text,
        roleTitle: formData.roleTitle,
        companyName: formData.companyName,
        keywords: keywordsArray,
      };

      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/job-descriptions/upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Job description added successfully!");
        setFormData({ text: "", roleTitle: "", companyName: "", keywords: "" });
        fetchJobDescriptions();
        setIsDialogOpen(false);
      } else {
        setError(data.message || "Failed to add job description");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job description?"))
      return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/job-descriptions/${jobId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSuccess("Job description deleted successfully!");
        fetchJobDescriptions();
      } else {
        setError("Failed to delete job description");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Job Descriptions
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage target job positions for resume optimization
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="w-full h-4 bg-muted rounded"></div>
                <div className="w-2/3 h-3 bg-muted rounded"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Job Descriptions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage target job positions for resume optimization
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="sm:inline">Add Job Description</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader className="space-y-2 sm:space-y-3">
                <DialogTitle className="text-lg sm:text-xl">
                  Add Job Description
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Add a job description to compare against your resumes and get
                  targeted suggestions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleTitle" className="text-sm font-medium">
                      Job Title
                    </Label>
                    <Input
                      id="roleTitle"
                      placeholder="e.g., Senior Software Engineer"
                      value={formData.roleTitle}
                      onChange={(e) =>
                        handleInputChange("roleTitle", e.target.value)
                      }
                      required
                      className="bg-input border-border text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="companyName"
                      className="text-sm font-medium"
                    >
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., TechCorp Inc."
                      value={formData.companyName}
                      onChange={(e) =>
                        handleInputChange("companyName", e.target.value)
                      }
                      required
                      className="bg-input border-border text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-sm font-medium">
                    Keywords (comma-separated)
                  </Label>
                  <Input
                    id="keywords"
                    placeholder="e.g., JavaScript, React, Node.js, AWS"
                    value={formData.keywords}
                    onChange={(e) =>
                      handleInputChange("keywords", e.target.value)
                    }
                    className="bg-input border-border text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add key skills and technologies mentioned in the job posting
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text" className="text-sm font-medium">
                    Job Description
                  </Label>
                  <Textarea
                    id="text"
                    placeholder="Paste the full job description here..."
                    value={formData.text}
                    onChange={(e) => handleInputChange("text", e.target.value)}
                    required
                    rows={6}
                    className="bg-input border-border resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include the complete job posting for better AI analysis
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-1 text-sm"
                  >
                    {creating ? "Adding..." : "Add Job Description"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="sm:w-auto text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Job Descriptions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {jobDescriptions.map((job) => (
            <Card key={job._id} className="border-border bg-card h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm sm:text-base line-clamp-2 leading-tight">
                        {job.roleTitle}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1 text-xs sm:text-sm">
                        <Building className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate">{job.companyName}</span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {job.keywords && job.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.keywords
                        .slice(0, window.innerWidth < 640 ? 2 : 3)
                        .map((keyword, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs py-1"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      {job.keywords.length >
                        (window.innerWidth < 640 ? 2 : 3) && (
                        <Badge variant="outline" className="text-xs py-1">
                          +
                          {job.keywords.length -
                            (window.innerWidth < 640 ? 2 : 3)}{" "}
                          more
                        </Badge>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Added: {new Date(job.createdAt).toLocaleDateString()}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingJob(job)}
                      className="flex-1 text-xs sm:text-sm"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(job._id)}
                      className="text-destructive hover:text-destructive sm:w-auto text-xs sm:text-sm"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="sm:inline hidden">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {jobDescriptions.length === 0 && (
          <Card className="border-border bg-card max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 text-center">
                No job descriptions added
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4 sm:mb-6 max-w-md">
                Add job descriptions to get targeted resume optimization
                suggestions.
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Job Description
                  </Button>
                </DialogTrigger>
                {/* Duplicate dialog content for empty state - keeping same responsive structure */}
                <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
                  <DialogHeader className="space-y-2 sm:space-y-3">
                    <DialogTitle className="text-lg sm:text-xl">
                      Add Job Description
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Add a job description to compare against your resumes and
                      get targeted suggestions.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="roleTitle-empty"
                          className="text-sm font-medium"
                        >
                          Job Title
                        </Label>
                        <Input
                          id="roleTitle-empty"
                          placeholder="e.g., Senior Software Engineer"
                          value={formData.roleTitle}
                          onChange={(e) =>
                            handleInputChange("roleTitle", e.target.value)
                          }
                          required
                          className="bg-input border-border text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="companyName-empty"
                          className="text-sm font-medium"
                        >
                          Company Name
                        </Label>
                        <Input
                          id="companyName-empty"
                          placeholder="e.g., TechCorp Inc."
                          value={formData.companyName}
                          onChange={(e) =>
                            handleInputChange("companyName", e.target.value)
                          }
                          required
                          className="bg-input border-border text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="keywords-empty"
                        className="text-sm font-medium"
                      >
                        Keywords (comma-separated)
                      </Label>
                      <Input
                        id="keywords-empty"
                        placeholder="e.g., JavaScript, React, Node.js, AWS"
                        value={formData.keywords}
                        onChange={(e) =>
                          handleInputChange("keywords", e.target.value)
                        }
                        className="bg-input border-border text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Add key skills and technologies mentioned in the job
                        posting
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="text-empty"
                        className="text-sm font-medium"
                      >
                        Job Description
                      </Label>
                      <Textarea
                        id="text-empty"
                        placeholder="Paste the full job description here..."
                        value={formData.text}
                        onChange={(e) =>
                          handleInputChange("text", e.target.value)
                        }
                        required
                        rows={6}
                        className="bg-input border-border resize-none text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Include the complete job posting for better AI analysis
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        type="submit"
                        disabled={creating}
                        className="flex-1 text-sm"
                      >
                        {creating ? "Adding..." : "Add Job Description"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="sm:w-auto text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Job Description Viewer Dialog */}
        {viewingJob && (
          <Dialog open={!!viewingJob} onOpenChange={() => setViewingJob(null)}>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader className="space-y-2 sm:space-y-3 pb-4">
                <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Briefcase className="w-5 h-5 text-primary shrink-0" />
                  <span className="truncate">{viewingJob.roleTitle}</span>
                </DialogTitle>
                <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span className="truncate">{viewingJob.companyName}</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <span>
                    Added {new Date(viewingJob.createdAt).toLocaleDateString()}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 sm:space-y-6">
                {viewingJob.keywords && viewingJob.keywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Keywords:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingJob.keywords.map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs sm:text-sm"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-muted/30 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                    Job Description:
                  </h4>
                  <div className="text-xs sm:text-sm text-foreground whitespace-pre-wrap max-h-64 sm:max-h-96 overflow-y-auto border border-border/20 rounded p-2 sm:p-3 bg-background/50">
                    {viewingJob.parsedText || "No content available"}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
