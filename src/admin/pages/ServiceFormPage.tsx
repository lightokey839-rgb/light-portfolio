import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { LoadingBlock, ErrorState } from "../components/AsyncStates";
import { useToast } from "../components/ToastProvider";
import { createService, getService, updateService, type ServiceInput } from "../../lib/api/services";
import { ApiError } from "../../lib/api/client";
import "../components/AdminForm.css";

interface FormState {
  title: string;
  description: string;
  icon: string;
  featured: boolean;
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  icon: "",
  featured: false,
  sortOrder: "0",
};

function toInput(form: FormState): ServiceInput {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    icon: form.icon.trim() || null,
    featured: form.featured,
    sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
  };
}

export default function ServiceFormPage() {
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

    getService(id)
      .then(({ service }) => {
        if (cancelled) return;
        setForm({
          title: service.title,
          description: service.description,
          icon: service.icon ?? "",
          featured: service.featured,
          sortOrder: String(service.sortOrder),
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "Unable to load this service.");
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
        await updateService(id, input);
        showToast("success", "Service updated successfully.");
      } else {
        await createService(input);
        showToast("success", "Service created successfully.");
      }
      navigate("/admin/services");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save the service.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <AdminPageHeader eyebrow="Services" title="Edit service" />
        <LoadingBlock label="Loading service…" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <AdminPageHeader eyebrow="Services" title="Edit service" />
        <ErrorState message={loadError} />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Services"
        title={isEditing ? "Edit service" : "New service"}
        description="Shown in the portfolio's “What I Build” section."
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
            <span>Icon</span>
            <input
              type="text"
              placeholder="e.g. 🌐 (optional)"
              value={form.icon}
              onChange={(e) => updateField("icon", e.target.value)}
            />
          </label>
        </div>

        <label className="admin-form__field">
          <span>Description</span>
          <textarea
            required
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </label>

        <div className="admin-form__grid admin-form__grid--2col">
          <label className="admin-form__field">
            <span>Sort order</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => updateField("sortOrder", e.target.value)}
            />
          </label>

          <label className="admin-form__checkbox" style={{ alignSelf: "end", marginBottom: "0.6rem" }}>
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
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create service"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/admin/services")}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
