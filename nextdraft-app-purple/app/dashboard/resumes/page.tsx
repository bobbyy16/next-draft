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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Eye, Trash2, ExternalLink } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface Resume {
  _id: string;
  fileName: string;
  fileUrl: string;
  parsedText: string;
  originalText: string;
  version: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch("http://localhost:5000/api/resumes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      } else if (response.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to fetch resumes");
      }
    } catch (error) {
      console.error("Fetch resumes error:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // More comprehensive file type validation
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      const allowedExtensions = ["pdf", "doc", "docx"];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (
        allowedTypes.includes(file.type) ||
        (fileExtension && allowedExtensions.includes(fileExtension))
      ) {
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError("File size must be less than 10MB");
          setSelectedFile(null);
          return;
        }

        setSelectedFile(file);
        setError("");
        console.log("File selected:", file.name, file.type, file.size);
      } else {
        setError("Please select a PDF or Word document (.pdf, .doc, .docx)");
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setUploading(false);
        return;
      }

      console.log("Starting upload for file:", selectedFile.name);

      const formData = new FormData();
      formData.append("resume", selectedFile);

      // Log FormData contents (for debugging)
      for (let [key, value] of formData.entries()) {
        console.log("FormData entry:", key, value);
      }

      const response = await fetch("http://localhost:5000/api/resumes/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Note: Do NOT set Content-Type header for FormData
        },
        body: formData,
      });

      console.log("Upload response status:", response.status);

      let data;
      try {
        data = await response.json();
        console.log("Upload response data:", data);
      } catch (parseError) {
        console.error("Failed to parse response JSON:", parseError);
        throw new Error("Invalid response from server");
      }

      if (response.ok) {
        setSelectedFile(null);
        setUploadDialogOpen(false);

        // Clear the file input
        const fileInput = document.getElementById(
          "resume-file"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        // Refresh the resumes list
        await fetchResumes();
      } else {
        console.error("Upload failed:", response.status, data);
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError(
            data.message || data.error || `Upload failed (${response.status})`
          );
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;

    try {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/resumes/${resumeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchResumes();
      } else if (response.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to delete resume");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setError("Network error. Please try again.");
    }
  };

  const getFileType = (fileName: string, fileUrl: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "pdf" || fileUrl.includes(".pdf")) {
      return "pdf";
    }
    return "document";
  };

  // Upload Dialog Component
  const UploadDialog = ({
    triggerButton,
  }: {
    triggerButton: React.ReactNode;
  }) => (
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Upload Resume
          </DialogTitle>
          <DialogDescription className="text-sm">
            Upload a PDF or Word document to get started with optimization.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume-file" className="text-sm">
              Resume File
            </Label>
            <Input
              id="resume-file"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="bg-input border-border text-sm"
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX (Max size: 10MB)
            </p>
          </div>

          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 text-sm"
            >
              {uploading ? "Uploading..." : "Upload Resume"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
              className="text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Resumes
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage your uploaded resumes
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardHeader className="pb-3">
                <div className="w-full h-4 bg-muted rounded"></div>
                <div className="w-2/3 h-3 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-muted rounded"></div>
                  <div className="flex space-x-2">
                    <div className="flex-1 h-8 bg-muted rounded"></div>
                    <div className="w-8 h-8 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Resumes
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage your uploaded resumes
          </p>
        </div>
        <UploadDialog
          triggerButton={
            <Button className="w-full sm:w-auto text-sm sm:text-base">
              <Upload className="mr-2 h-4 w-4" />
              Upload Resume
            </Button>
          }
        />
      </div>

      {/* Resumes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {resumes.map((resume) => (
          <Card key={resume._id} className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base truncate">
                      {resume.fileName}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Version {resume.version}
                    </CardDescription>
                  </div>
                </div>
                {resume.isEdited && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Edited
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => setViewingResume(resume)}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">View</span>
                    <span className="sm:hidden">View</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(resume._id)}
                    className="text-destructive hover:text-destructive px-2 sm:px-3"
                    title="Delete resume"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {resumes.length === 0 && (
        <Card className="border-border bg-card w-full">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 text-center">
              No resumes uploaded
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-md">
              Upload your first resume to start optimizing it with AI
              suggestions.
            </p>
            <UploadDialog
              triggerButton={
                <Button className="text-sm sm:text-base">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First Resume
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Resume Viewer Dialog */}
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
    </div>
  );
}
