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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Briefcase,
  Upload,
  Plus,
  TrendingUp,
  Users,
  Eye,
  ArrowRight,
  Building,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { getAuthToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Resume {
  _id: string;
  fileName: string;
  fileUrl: string;
  parsedText: string;
  version: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

interface JobDescription {
  _id: string;
  roleTitle: string;
  companyName: string;
  keywords: string[];
  parsedText: string;
  createdAt: string;
}

interface DashboardStats {
  totalResumes: number;
  totalJobDescriptions: number;
  recentUploads: number;
  optimizationScore: number;
}

interface FormData {
  roleTitle: string;
  companyName: string;
  keywords: string;
  text: string;
}

export default function DashboardPage() {
  const [recentResumes, setRecentResumes] = useState<Resume[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobDescription[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalResumes: 0,
    totalJobDescriptions: 0,
    recentUploads: 0,
    optimizationScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);
  const [viewingJob, setViewingJob] = useState<JobDescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states for job description dialog
  const [formData, setFormData] = useState<FormData>({
    roleTitle: "",
    companyName: "",
    keywords: "",
    text: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = getAuthToken();

      // Fetch recent resumes (last 5)
      const resumesResponse = await fetch(
        `${API_BASE_URL}/api/resumes?limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch recent job descriptions (last 5)
      const jobsResponse = await fetch(
        `${API_BASE_URL}/api/job-descriptions?limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch all data for stats
      const allResumesResponse = await fetch(`${API_BASE_URL}/api/resumes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const allJobsResponse = await fetch(
        `${API_BASE_URL}/api/job-descriptions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (resumesResponse.ok) {
        const resumesData = await resumesResponse.json();
        setRecentResumes(resumesData);
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setRecentJobs(jobsData);
      }

      // Calculate stats
      if (allResumesResponse.ok && allJobsResponse.ok) {
        const allResumes = await allResumesResponse.json();
        const allJobs = await allJobsResponse.json();

        // Calculate recent uploads (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recentUploads = [
          ...allResumes.filter((r: Resume) => new Date(r.createdAt) > weekAgo),
          ...allJobs.filter(
            (j: JobDescription) => new Date(j.createdAt) > weekAgo
          ),
        ].length;

        // Simple optimization score calculation
        const optimizationScore = Math.min(
          Math.round(
            allResumes.length * 20 + allJobs.length * 15 + recentUploads * 10
          ),
          100
        );

        setStats({
          totalResumes: allResumes.length,
          totalJobDescriptions: allJobs.length,
          recentUploads,
          optimizationScore,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      const keywordsArray = formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const response = await fetch(`${API_BASE_URL}/api/job-descriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roleTitle: formData.roleTitle,
          companyName: formData.companyName,
          keywords: keywordsArray,
          text: formData.text,
        }),
      });

      if (response.ok) {
        setSuccess("Job description added successfully!");
        setFormData({
          roleTitle: "",
          companyName: "",
          keywords: "",
          text: "",
        });
        // Refresh dashboard data
        fetchDashboardData();
        // Close dialog after a short delay
        setTimeout(() => {
          setIsDialogOpen(false);
          setSuccess("");
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add job description");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Welcome back! Here's your resume optimization overview.
          </p>
        </div>

        {/* Loading Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardHeader className="pb-2">
                <div className="w-full h-3 sm:h-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="w-12 sm:w-16 h-6 sm:h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Recent Items */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardHeader>
                <div className="w-full h-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="w-full h-12 bg-muted rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function getFileType(fileName: string, fileUrl: string) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "doc" || ext === "docx") return "word";
    // Fallback: try to guess from URL if extension missing
    if (fileUrl.endsWith(".pdf")) return "pdf";
    if (fileUrl.endsWith(".doc") || fileUrl.endsWith(".docx")) return "word";
    return "unknown";
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Welcome back! Here's your resume optimization overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Resumes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.totalResumes}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalResumes > 0
                ? "Ready for optimization"
                : "Upload your first resume"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Job Targets
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.totalJobDescriptions}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalJobDescriptions > 0
                ? "Positions tracked"
                : "Add target jobs"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Recent Activity
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.recentUploads}
            </div>
            <p className="text-xs text-muted-foreground">
              Uploads in the last 7 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Optimization Score
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.optimizationScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              Profile completeness
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Resumes */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Recent Resumes
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Your latest uploaded resumes
              </CardDescription>
            </div>
            <Link href="/dashboard/resumes">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                View All
                <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentResumes.length > 0 ? (
              <div className="space-y-3">
                {recentResumes.map((resume) => (
                  <div
                    key={resume._id}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm truncate">
                          {resume.fileName}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-muted-foreground">
                            Version {resume.version}
                          </p>
                          {resume.isEdited && (
                            <Badge variant="secondary" className="text-xs">
                              Edited
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingResume(resume)}
                      className="text-xs px-2 sm:px-3 flex-shrink-0"
                    >
                      <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-xs sm:text-sm">
                  No resumes uploaded yet
                </p>
                <Link href="/dashboard/resumes">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs sm:text-sm"
                  >
                    Upload First Resume
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Job Descriptions */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Briefcase className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Target Jobs
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Recent job descriptions
              </CardDescription>
            </div>
            <Link href="/dashboard/job-descriptions">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                View All
                <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job._id}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm truncate">
                          {job.roleTitle}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center truncate">
                          <Building className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{job.companyName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      {job.keywords && job.keywords.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs hidden sm:inline-flex"
                        >
                          {job.keywords.length} keywords
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingJob(job)}
                        className="px-2"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Briefcase className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-xs sm:text-sm">
                  No job descriptions added yet
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs sm:text-sm"
                    >
                      Add First Job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto mx-auto">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">
                        Add Job Description
                      </DialogTitle>
                      <DialogDescription className="text-sm">
                        Add a job description to compare against your resumes
                        and get targeted suggestions.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription className="text-sm">
                            {error}
                          </AlertDescription>
                        </Alert>
                      )}
                      {success && (
                        <Alert>
                          <AlertDescription className="text-sm">
                            {success}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="roleTitle" className="text-sm">
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
                          <Label htmlFor="companyName" className="text-sm">
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
                        <Label htmlFor="keywords" className="text-sm">
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
                          Add key skills and technologies mentioned in the job
                          posting
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="text" className="text-sm">
                          Job Description
                        </Label>
                        <Textarea
                          id="text"
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
                          Include the complete job posting for better AI
                          analysis
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
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
                          className="text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      {stats.totalResumes === 0 && stats.totalJobDescriptions === 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Getting Started with NextDraft
            </CardTitle>
            <CardDescription className="text-sm">
              Follow these steps to optimize your resume with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-base sm:text-lg font-bold text-primary">
                    1
                  </span>
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  Upload Resume
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Upload your current resume in PDF or Word format
                </p>
                <Link href="/dashboard/resumes">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs sm:text-sm"
                  >
                    <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Upload Resume
                  </Button>
                </Link>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-base sm:text-lg font-bold text-primary">
                    2
                  </span>
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  Add Job Description
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Paste job descriptions you want to target
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs sm:text-sm"
                    >
                      <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Add Job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto mx-auto">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">
                        Add Job Description
                      </DialogTitle>
                      <DialogDescription className="text-sm">
                        Add a job description to compare against your resumes
                        and get targeted suggestions.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription className="text-sm">
                            {error}
                          </AlertDescription>
                        </Alert>
                      )}
                      {success && (
                        <Alert>
                          <AlertDescription className="text-sm">
                            {success}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="roleTitle-dialog" className="text-sm">
                            Job Title
                          </Label>
                          <Input
                            id="roleTitle-dialog"
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
                            htmlFor="companyName-dialog"
                            className="text-sm"
                          >
                            Company Name
                          </Label>
                          <Input
                            id="companyName-dialog"
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
                        <Label htmlFor="keywords-dialog" className="text-sm">
                          Keywords (comma-separated)
                        </Label>
                        <Input
                          id="keywords-dialog"
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
                        <Label htmlFor="text-dialog" className="text-sm">
                          Job Description
                        </Label>
                        <Textarea
                          id="text-dialog"
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
                          Include the complete job posting for better AI
                          analysis
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
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
                          className="text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-base sm:text-lg font-bold text-primary">
                    3
                  </span>
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  Get AI Suggestions
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Receive personalized optimization recommendations
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="text-xs sm:text-sm"
                >
                  <TrendingUp className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Coming Soon
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resume Viewing Dialog */}
      {viewingResume && (
        <Dialog
          open={!!viewingResume}
          onOpenChange={() => setViewingResume(null)}
        >
          <DialogContent className="w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl p-4 sm:p-6 overflow-hidden">
            <DialogHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <DialogTitle className="truncate max-w-[80vw] sm:max-w-sm">
                    {viewingResume.fileName}
                  </DialogTitle>
                  <DialogDescription>Resume preview</DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start sm:self-auto"
                  onClick={() => window.open(viewingResume.fileUrl, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0">
              {getFileType(viewingResume.fileName, viewingResume.fileUrl) ===
              "pdf" ? (
                <div className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] border rounded-lg overflow-hidden">
                  <iframe
                    src={viewingResume.fileUrl}
                    className="w-full h-full"
                    title={`Resume: ${viewingResume.fileName}`}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      This document format cannot be previewed inline. Click
                      "Open in new tab" to view or download the file.
                    </AlertDescription>
                  </Alert>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Parsed Content:</h4>
                    <div className="text-sm text-foreground whitespace-pre-wrap max-h-[40vh] sm:max-h-[60vh] overflow-y-auto">
                      {viewingResume.parsedText || "No content available"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Job Viewing Dialog */}
      {viewingJob && (
        <Dialog open={!!viewingJob} onOpenChange={() => setViewingJob(null)}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {viewingJob.roleTitle}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {viewingJob.companyName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {viewingJob.keywords && viewingJob.keywords.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Keywords:</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingJob.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm">Job Description:</h4>
                <div className="text-xs sm:text-sm text-foreground whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {viewingJob.parsedText || "No content available"}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
