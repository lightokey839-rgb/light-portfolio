import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { LoadingBlock, ErrorState } from "../components/AsyncStates";
import { ImageUploadField } from "../components/ImageUploadField";
import { TagInput } from "../components/TagInput";
import { useToast } from "../components/ToastProvider";
import { createProject, getProject, updateProject, type ProjectInput } from "../../lib/api/projects";
import { ApiError } from "../../lib/api/client";
import "../components/AdminForm.css";

interface FormState {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  imageUrl: string | null;
  videoUrl: string;
  liveUrl: string;
  githubUrl: string;
  featured: boolean;
  published: boolean;
  sortOrder: string;
  technologies: string[];
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  shortDescription: "",
  category: "",
  imageUrl: null,
  videoUrl: "",
  liveUrl: "",
  githubUrl: "",
  featured: false,
  published: true,
  sortOrder: "0",
  technologies: [],
};

function toInput(form: FormState): ProjectInput {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    shortDescription: form.shortDescription.trim() || null,
    category: form.category.trim(),
    imageUrl: form.imageUrl,
    videoUrl: form.videoUrl.trim() || null,
    liveUrl: form.liveUrl.trim() || null,
    githubUrl: form.githubUrl.trim() || null,
    featured: form.featured,
    published: form.published,
    sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
    technologies: form.technologies,
  };
}

export default function ProjectFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    setLoadError(null);

    getProject(id)
      .then(({ project }) => {
        if (cancelled) return;
        setForm({
          title: project.title,
          description: project.description,
          shortDescription: project.shortDescription ?? "",
          category: project.category,
          imageUrl: project.imageUrl,
          videoUrl: project.videoUrl ?? "",
          liveUrl: project.liveUrl ?? "",
          githubUrl: project.githubUrl ?? "",
          featured: project.featured,
          published: project.published,
          sortOrder: String(project.sortOrder),
          technologies: project.technologies.map((t) => t.name),
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "Unable to load this project.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const input = toInput(form);
      if (isEditing && id) {
        await updateProject(id, input);
        showToast("success", "Project updated successfully.");
      } else {
        await createProject(input);
        showToast("success", "Project created successfully.");
      }
      navigate("/admin/projects");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save the project.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <AdminPageHeader eyebrow="Projects" title="Edit project" />
        <LoadingBlock label="Loading project…" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <AdminPageHeader eyebrow="Projects" title="Edit project" />
        <ErrorState message={loadError} />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Projects"
        title={isEditing ? "Edit project" : "New project"}
        description={
          isEditing
            ? "Changes go live on the portfolio as soon as you save."
            : "New projects are published by default — uncheck Published to save as a draft."
        }
      />

      <form className="admin-form" onSubmit={handleSubmit}>
        {formError && <div className="admin-form__error">{formError}</div>}

        <div className="admin-form__grid admin-form__grid--2col">
          <label className="admin-form__field">
            <span>Title</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </label>

          <label className="admin-form__field">
            <span>Category</span>
            <input
              type="text"
              required
              placeholder="e.g. Telegram Bot / Web3"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            />
          </label>
        </div>

        <label className="admin-form__field">
          <span>Short description</span>
          <input
            type="text"
            placeholder="One line shown in project cards (optional)"
            value={form.shortDescription}
            onChange={(e) => updateField("shortDescription", e.target.value)}
          />
        </label>

        <label className="admin-form__field">
          <span>Description</span>
          <textarea
            required
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </label>

        <label className="admin-form__field">
          <span>Image</span>
          <ImageUploadField
            value={form.imageUrl}
            onChange={(url) => updateField("imageUrl", url)}
            onError={(message) => setFormError(message)}
          />
        </label>

        <div className="admin-form__grid admin-form__grid--2col">
          <label className="admin-form__field">
            <span>Live URL</span>
            <input
              type="text"
              placeholder="https://…"
              value={form.liveUrl}
              onChange={(e) => updateField("liveUrl", e.target.value)}
            />
          </label>

          <label className="admin-form__field">
            <span>GitHub URL</span>
            <input
              type="text"
              placeholder="https://github.com/…"
              value={form.githubUrl}
              onChange={(e) => updateField("githubUrl", e.target.value)}
            />
          </label>

          <label className="admin-form__field">
            <span>Video URL</span>
            <input
              type="text"
              placeholder="https://… (optional)"
              value={form.videoUrl}
              onChange={(e) => updateField("videoUrl", e.target.value)}
            />
          </label>

          <label className="admin-form__field">
            <span>Sort order</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => updateField("sortOrder", e.target.value)}
            />
          </label>
        </div>

        <label className="admin-form__field">
          <span>Technologies</span>
          <TagInput
            value={form.technologies}
            onChange={(tags) => updateField("technologies", tags)}
            placeholder="Type a technology and press Enter…"
          />
          <p className="admin-form__hint">
            Matches existing technologies by name (case-insensitive) or creates a new one.
          </p>
        </label>

        <div className="admin-form__checkbox-row">
          <label className="admin-form__checkbox">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => updateField("published", e.target.checked)}
            />
            Published
          </label>
          <label className="admin-form__checkbox">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
            />
            Featured
          </label>
        </div>

        <div className="admin-form__actions">
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create project"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/admin/projects")}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
