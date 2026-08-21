import { useRef, useState } from "react";
import { uploadImage } from "../../lib/api/uploads";
import { resolveAssetUrl, ApiError } from "../../lib/api/client";
import "./GalleryUploadField.css";

interface GalleryUploadFieldProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onError: (message: string) => void;
  maxImages?: number;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

export function GalleryUploadField({
  value,
  onChange,
  onError,
  maxImages = 12,
}: GalleryUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (value.length >= maxImages) {
      onError(`Gallery can have at most ${maxImages} images.`);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file);
      onChange([...value, result.url]);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="gallery-upload">
      <div className="gallery-upload__grid">
        {value.map((url, index) => {
          const preview = resolveAssetUrl(url);
          return (
            <div key={url} className="gallery-upload__item">
              {preview && <img src={preview} alt="" />}
              <button
                type="button"
                className="gallery-upload__remove"
                aria-label="Remove image"
                onClick={() => removeAt(index)}
              >
                ×
              </button>
            </div>
          );
        })}

        {value.length < maxImages && (
          <button
            type="button"
            className="gallery-upload__add"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "+ Add image"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="gallery-upload__input"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <p className="gallery-upload__hint">
        JPG, PNG, or WEBP. Up to 5MB each, {maxImages} images max.
      </p>
    </div>
  );
}
