import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { LoadingBlock, ErrorState } from "../components/AsyncStates";
import { useToast } from "../components/ToastProvider";
import {
  createTechnology,
  getTechnology,
  updateTechnology,
  type TechnologyInput,
} from "../../lib/api/technologies";
import { ApiError } from "../../lib/api/client";
import "../components/AdminForm.css";

interface FormState {
  name: string;
  category: string;
  icon: string;
}

const EMPTY_FORM: FormState = { name: "", category: "", icon: "" };

function toInput(form: FormState): TechnologyInput {
  return {
    name: form.name.trim(),
    category: form.category.trim(),
    icon: form.icon.trim() || null,
  };
}

export default function TechnologyFormPage() {
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

    getTechnology(id)
      .then(({ technology }) => {
        if (cancelled) return;
        setForm({
          name: technology.name,
          category: technology.category,
          icon: technology.icon ?? "",
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "Unable to load this technology.");
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
        await updateTechnology(id, input);
        showToast("success", "Technology updated successfully.");
      } else {
        await createTechnology(input);
        showToast("success", "Technology created successfully.");
      }
      navigate("/admin/technologies");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save the technology.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <AdminPageHeader eyebrow="Technologies" title="Edit technology" />
        <LoadingBlock label="Loading technology…" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <AdminPageHeader eyebrow="Technologies" title="Edit technology" />
        <ErrorState message={loadError} />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Technologies"
        title={isEditing ? "Edit technology" : "New technology"}
        description="Shown in the portfolio's tech-stack section, grouped by category."
      />

      <form className="admin-form" onSubmit={handleSubmit}>
        {formError && <div className="admin-form__error">{formError}</div>}

        <div className="admin-form__grid admin-form__grid--2col">
          <label className="admin-form__field">
            <span>Name</span>
            <input
              type="text"
              required
              placeholder="e.g. React"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </label>

          <label className="admin-form__field">
            <span>Category</span>
            <input
              type="text"
              required
              placeholder="e.g. Frontend"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            />
          </label>
        </div>

        <label className="admin-form__field">
          <span>Icon</span>
          <input
            type="text"
            placeholder="Optional — not shown on the public site yet"
            value={form.icon}
            onChange={(e) => updateField("icon", e.target.value)}
          />
          <p className="admin-form__hint">
            The public tech-stack section currently shows initials computed from the name.
          </p>
        </label>

        <div className="admin-form__actions">
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create technology"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/admin/technologies")}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
