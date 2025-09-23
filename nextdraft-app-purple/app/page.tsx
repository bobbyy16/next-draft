"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, Zap, Target, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth";

export default function LandingPage() {
  const [user, setUser] = useState<import("@/lib/auth").User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">NextDraft</span>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-foreground focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              {user ? (
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 md:mb-6 bg-primary/10 text-primary border-primary/20 text-sm md:text-base">
            AI-Powered Resume Optimization
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 text-balance">
            Transform Your Resume with{" "}
            <span className="text-primary">AI Intelligence</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto text-pretty">
            Get personalized suggestions to optimize your resume for any job
            description. Increase your chances of landing interviews with
            AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-base md:text-lg px-6 md:px-8">
                Start Optimizing{" "}
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
            <Link
              href="https://www.loom.com/share/99479d7c172643309bb0ca9002058f7c"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="text-base md:text-lg px-6 md:px-8 bg-transparent"
              >
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Job Seekers
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create compelling resumes that get noticed
              by recruiters and ATS systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Advanced AI compares your resume against job descriptions to
                  identify optimization opportunities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Targeted Suggestions</CardTitle>
                <CardDescription>
                  Get specific recommendations for keywords, skills, and content
                  to match job requirements perfectly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Instant PDF Export</CardTitle>
                <CardDescription>
                  Apply suggestions with one click and download your optimized
                  resume as a professional PDF.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              How NextDraft Works
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple 3-step process to optimize your resume for any job
              opportunity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <span className="text-xl md:text-2xl font-bold text-primary-foreground">
                  1
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">
                Upload Your Resume
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Upload your current resume in PDF or Word format. Our AI will
                parse and analyze your content.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <span className="text-xl md:text-2xl font-bold text-primary-foreground">
                  2
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">
                Add Job Description
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Paste the job description you're targeting. Our AI will identify
                key requirements and keywords.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <span className="text-xl md:text-2xl font-bold text-primary-foreground">
                  3
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">
                Get AI Suggestions
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Receive personalized suggestions and apply them with one click
                to create your optimized resume.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
                10K+
              </div>
              <div className="text-muted-foreground text-sm md:text-base">
                Resumes Optimized
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
                85%
              </div>
              <div className="text-muted-foreground text-sm md:text-base">
                Interview Rate Increase
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
                500+
              </div>
              <div className="text-muted-foreground text-sm md:text-base">
                Companies Supported
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
                4.9/5
              </div>
              <div className="text-muted-foreground text-sm md:text-base">
                User Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have successfully optimized their
            resumes with NextDraft.
          </p>
          {getUser() ? (
            <Link href="/dashboard" className="mr-4">
              <Button size="lg" className="text-base md:text-lg px-6 md:px-8">
                Go to Dashboard{" "}
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/auth/register">
              <Button size="lg" className="text-base md:text-lg px-6 md:px-8">
                Get Started for Free{" "}
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 md:py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
              </div>
              <span className="text-lg md:text-xl font-bold text-foreground">
                NextDraft
              </span>
            </div>
            <div className="text-muted-foreground text-sm md:text-base">
              © {new Date().getFullYear()} NextDraft. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
