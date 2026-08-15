import { useRef, useState } from "react";
import { uploadImage } from "../../lib/api/uploads";
import { resolveAssetUrl, ApiError } from "../../lib/api/client";
import "./ImageUploadField.css";

interface ImageUploadFieldProps {
  value: string | null;
  onChange: (url: string | null) => void;
  onError: (message: string) => void;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

export function ImageUploadField({ value, onChange, onError }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file);
      onChange(result.url);
    } catch (err) {
      if (err instanceof ApiError) {
        onError(err.message);
      } else {
        onError("Failed to upload image.");
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const previewUrl = resolveAssetUrl(value);

  return (
    <div className="image-upload">
      <div className="image-upload__preview">
        {previewUrl ? (
          <img src={previewUrl} alt="" />
        ) : (
          <span className="image-upload__placeholder" aria-hidden="true" />
        )}
      </div>

      <div className="image-upload__actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onChange(null)}
            disabled={uploading}
          >
            Remove
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="image-upload__input"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <p className="image-upload__hint">JPG, PNG, or WEBP. Up to 5MB.</p>
    </div>
  );
}
