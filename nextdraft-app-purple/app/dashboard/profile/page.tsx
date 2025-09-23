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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Upload, Save, Trash2 } from "lucide-react";
import { getAuthToken, getUser, logout } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/utils";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  industry: string;
  experienceLevel: string;
  profileImage?: {
    url: string;
    public_id: string;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    experienceLevel: "",
  });

  useEffect(() => {
    const user = getUser();
    if (user) {
      setProfile(user);
      setFormData({
        name: user.name,
        industry: user.industry,
        experienceLevel: user.experienceLevel,
      });
    }
    setLoading(false);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];

      if (!validTypes.includes(file.type)) {
        setError("Only JPEG, JPG, or PNG images are allowed.");
        setSelectedFile(null);
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
      setError("");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      if (selectedFile) {
        formDataToSend.append("profileImage", selectedFile);
      }

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/users/${profile._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        // Update localStorage
        const updatedUser = { ...data, token };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSuccess("Profile updated successfully!");
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          "profile-image"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setError(data.message || "Update failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    )
      return;

    setDeleting(true);
    setError("");

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/users/${profile._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        logout();
      } else {
        const data = await response.json();
        setError(data.message || "Delete failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Profile
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your account settings
            </p>
          </div>

          <Card className="border-border bg-card animate-pulse">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-full h-4 bg-muted rounded"></div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Profile
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your account settings
            </p>
          </div>
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-muted-foreground">
                Unable to load profile
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Profile
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        {/* Success/Error Messages */}
        <div className="space-y-3">
          {success && (
            <Alert className="max-w-2xl">
              <AlertDescription className="text-sm">{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="max-w-2xl">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Overview */}
          <Card className="border-border bg-card lg:order-1 order-2">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span>Profile Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
                  <AvatarImage
                    src={profile.profileImage?.url || "/placeholder.svg"}
                    alt={profile.name}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg sm:text-xl lg:text-2xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center space-y-1">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    {profile.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground break-all">
                    {profile.email}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    Industry
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {profile.industry}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    Experience Level
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {profile.experienceLevel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card className="border-border bg-card lg:col-span-2 lg:order-2 order-1">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">
                Edit Profile
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-xs sm:text-sm font-medium"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      required
                      className="bg-input border-border text-sm h-9 sm:h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-xs sm:text-sm font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted border-border text-muted-foreground text-sm h-9 sm:h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="industry"
                      className="text-xs sm:text-sm font-medium"
                    >
                      Industry
                    </Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) =>
                        handleInputChange("industry", value)
                      }
                    >
                      <SelectTrigger className="bg-input border-border h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="experience"
                      className="text-xs sm:text-sm font-medium"
                    >
                      Experience Level
                    </Label>
                    <Select
                      value={formData.experienceLevel}
                      onValueChange={(value) =>
                        handleInputChange("experienceLevel", value)
                      }
                    >
                      <SelectTrigger className="bg-input border-border h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entry">Entry Level</SelectItem>
                        <SelectItem value="Junior">
                          Junior (1-3 years)
                        </SelectItem>
                        <SelectItem value="Mid">
                          Mid Level (3-7 years)
                        </SelectItem>
                        <SelectItem value="Senior">
                          Senior (7+ years)
                        </SelectItem>
                        <SelectItem value="Executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="profile-image"
                    className="text-xs sm:text-sm font-medium"
                  >
                    Profile Image
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="profile-image"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="bg-input border-border text-sm h-9 sm:h-10 file:text-xs file:mr-2"
                    />
                    <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: JPEG, JPG, PNG
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full mt-6 h-9 sm:h-10 text-sm"
                >
                  {updating ? (
                    "Updating..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="border-destructive bg-card">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-destructive text-base sm:text-lg">
              Danger Zone
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1 sm:space-y-2 flex-1">
                <h4 className="font-medium text-foreground text-sm sm:text-base">
                  Delete Account
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm shrink-0"
              >
                {deleting ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span className="sm:inline">Delete Account</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
