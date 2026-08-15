import { useEffect, useState, type FormEvent } from "react";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { LoadingBlock, ErrorState } from "../components/AsyncStates";
import { ImageUploadField } from "../components/ImageUploadField";
import { useToast } from "../components/ToastProvider";
import { getSettings, updateSettings, type SettingsInput } from "../../lib/api/settings";
import { ApiError } from "../../lib/api/client";
import "../components/AdminForm.css";

interface FormState {
  name: string;
  title: string;
  bio: string;
  profileImage: string | null;
  email: string;
  telegram: string;
  twitter: string;
  github: string;
  linkedin: string;
}

function toInput(form: FormState): SettingsInput {
  return {
    name: form.name.trim(),
    title: form.title.trim(),
    bio: form.bio.trim(),
    profileImage: form.profileImage,
    email: form.email.trim() || null,
    telegram: form.telegram.trim() || null,
    twitter: form.twitter.trim() || null,
    github: form.github.trim() || null,
    linkedin: form.linkedin.trim() || null,
  };
}

export default function SettingsPage() {
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSettings()
      .then(({ settings }) => {
        if (cancelled) return;
        setForm({
          name: settings.name,
          title: settings.title,
          bio: settings.bio,
          profileImage: settings.profileImage,
          email: settings.email ?? "",
          telegram: settings.telegram ?? "",
          twitter: settings.twitter ?? "",
          github: settings.github ?? "",
          linkedin: settings.linkedin ?? "",
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "Unable to load settings.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setFormError(null);
    setSaving(true);

    try {
      await updateSettings(toInput(form));
      showToast("success", "Settings updated successfully.");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <AdminPageHeader eyebrow="Settings" title="Site settings" />
        <LoadingBlock label="Loading settings…" />
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div>
        <AdminPageHeader eyebrow="Settings" title="Site settings" />
        <ErrorState message={loadError ?? "Unable to load settings."} />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Settings"
        title="Site settings"
        description="Name, bio, profile image, and social links shown on the live portfolio."
      />

      <form className="admin-form" onSubmit={handleSubmit}>
        {formError && <div className="admin-form__error">{formError}</div>}

        <div className="admin-form__grid admin-form__grid--2col">
          <label className="admin-form__field">
            <span>Name</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </label>

          <label className="admin-form__field">
            <span>Title</span>
            <input
              type="text"
              required
              placeholder="e.g. Web3 Developer & Builder"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </label>
        </div>

        <label className="admin-form__field">
          <span>Bio</span>
          <textarea
            required
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
          />
        </label>

        <label className="admin-form__field">
          <span>Profile image</span>
          <ImageUploadField
            value={form.profileImage}
            onChange={(url) => updateField("profileImage", url)}
            onError={(message) => setFormError(message)}
          />
        </label>

        <div className="admin-form__grid admin-form__grid--2col">
          <label className="admin-form__field">
            <span>Contact email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </label>

          <label className="admin-form__field">
            <span>Telegram</span>
            <input
              type="text"
              placeholder="https://t.me/…"
              value={form.telegram}
              onChange={(e) => updateField("telegram", e.target.value)}
            />
          </label>

          <label className="admin-form__field">
            <span>X / Twitter</span>
            <input
              type="text"
              placeholder="https://x.com/…"
              value={form.twitter}
              onChange={(e) => updateField("twitter", e.target.value)}
            />
          </label>

          <label className="admin-form__field">
            <span>GitHub</span>
            <input
              type="text"
              placeholder="https://github.com/…"
              value={form.github}
              onChange={(e) => updateField("github", e.target.value)}
            />
          </label>

          <label className="admin-form__field">
            <span>LinkedIn</span>
            <input
              type="text"
              placeholder="https://linkedin.com/in/…"
              value={form.linkedin}
              onChange={(e) => updateField("linkedin", e.target.value)}
            />
          </label>
        </div>

        <div className="admin-form__actions">
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
