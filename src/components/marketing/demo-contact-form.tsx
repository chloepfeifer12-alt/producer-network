"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";

const TOPICS = [
  { value: "account", label: "My member account or profile" },
  { value: "privacy", label: "Privacy, consent or data requests" },
  { value: "organization", label: "Organization listing or recruiting" },
  { value: "report", label: "Report a listing or conduct concern" },
  { value: "billing", label: "Plans and billing" },
  { value: "other", label: "Something else" },
];

type Errors = Partial<Record<"name" | "email" | "topic" | "message", string>>;

/** Demo-only contact form: validates inline and shows a confirmation. Nothing is transmitted. */
export function DemoContactForm() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (!form.topic) next.topic = "Choose a topic.";
    if (form.message.trim().length < 10) next.message = "Add a few more details (at least 10 characters).";
    setErrors(next);
    if (Object.keys(next).length) return;
    toast("Message received (demo)", { body: "Nothing was sent — this prototype has no support inbox. Your message was not stored.", tone: "info" });
    setForm({ name: "", email: "", topic: "", message: "" });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" id="c-name" error={errors.name}>
          <Input id="c-name" value={form.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} />
        </Field>
        <Field label="Email" id="c-email" error={errors.email}>
          <Input id="c-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" aria-invalid={!!errors.email} />
        </Field>
      </div>
      <Field label="Topic" id="c-topic" error={errors.topic}>
        <Select id="c-topic" value={form.topic} onChange={set("topic")} aria-invalid={!!errors.topic}>
          <option value="">Choose a topic…</option>
          {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </Field>
      <Field label="How can we help?" id="c-msg" error={errors.message} hint="Please don’t include client names, policy numbers or other confidential information.">
        <Textarea id="c-msg" rows={5} value={form.message} onChange={set("message")} aria-invalid={!!errors.message} />
      </Field>
      <Notice tone="demo">Prototype form — submitting shows a confirmation only. Nothing is sent or stored.</Notice>
      <Button type="submit" size="lg">
        <Send className="h-4 w-4" /> Send message
      </Button>
    </form>
  );
}
