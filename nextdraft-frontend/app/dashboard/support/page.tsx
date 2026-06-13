"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

interface FeedbackItem {
  _id: string;
  type: "bug" | "feature" | "support" | "other";
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  adminNotes?: string;
  createdAt: string;
}

const statusStyles: Record<FeedbackItem["status"], string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-700",
};

export default function SupportPage() {
  const [type, setType] = useState<FeedbackItem["type"]>("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<FeedbackItem[]>("/api/feedback/me")
      .then(setItems)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (subject.trim().length < 3 || message.trim().length < 10) {
      toast.error("Add a clear subject and at least 10 characters in the message.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.post<{ feedback: FeedbackItem }>("/api/feedback", {
        type,
        subject: subject.trim(),
        message: message.trim(),
      });
      setItems((current) => [result.feedback, ...current]);
      setSubject("");
      setMessage("");
      toast.success("Thanks — we received your message.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <header>
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <LifeBuoy className="h-4 w-4" />
            Help & support
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">We're here to help</h1>
          <p className="mt-1 text-sm text-slate-600">
            Missing points after a payment? Found a bug? Tell us — we'll get back to you over email.
          </p>
        </header>

        <form
          onSubmit={submit}
          className="rounded-lg border border-slate-200 bg-white p-5"
          aria-label="Submit feedback"
        >
          <h2 className="text-sm font-semibold">Send a message</h2>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Topic
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackItem["type"])}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="support">Missing points / payment issue</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature request</option>
                  <option value="other">Something else</option>
                </select>
              </div>
              <div>
                <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Subject
                </label>
                <input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  placeholder="e.g. Paid 50 rupees, no points credited"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-teal-700"
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-700">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={4000}
                placeholder="Include any payment ID, screenshots referenced, and the time of the issue."
                className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-5 focus:border-teal-700"
              />
              <div className="mt-1 text-xs text-slate-400">{message.length}/4000</div>
            </div>
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send message
              </button>
            </div>
          </div>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold">Your previous tickets</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              <MessageSquare className="mx-auto mb-3 h-6 w-6 text-slate-300" />
              You haven't sent us anything yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item._id} className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[item.status]}`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">{item.type}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold">{item.subject}</div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.message}</p>
                  <div className="mt-2 text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
