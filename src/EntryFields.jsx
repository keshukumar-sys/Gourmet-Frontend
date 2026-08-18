import { useState } from "react";
import api, { errorMessage, imageUrl } from "./api";
import { useToast } from "./Toast";
import "./EntryFields.css";

/**
 * Shared plumbing for the "add entry" sections on Operations and Decor.
 *
 * Every one of those sections is the same shape: a list the user can grow,
 * where each row carries its own images and notes. Keeping the add/update/
 * remove logic and the uploader here means each page only describes the
 * fields that are actually specific to it.
 */

/** Manage one repeatable list. Always keeps at least one blank row on screen. */
export function useEntryList(factory) {
  const [entries, setEntries] = useState([factory()]);

  const add = () => setEntries((rows) => [...rows, factory()]);

  const update = (index, field, value) =>
    setEntries((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const remove = (index) =>
    setEntries((rows) => {
      const next = rows.filter((_, i) => i !== index);
      return next.length ? next : [factory()];
    });

  /** Replace the whole list when loading a saved event back in. */
  const load = (rows) => setEntries(rows?.length ? rows.map((r) => ({ ...factory(), ...r })) : [factory()]);

  return { entries, setEntries, add, update, remove, load };
}

/**
 * Upload control for a single entry.
 *
 * Files go to S3 straight away and the returned URLs are handed back to the
 * caller, so an entry that is later removed never leaves a half-attached
 * upload behind on the event.
 */
export function EntryImages({ eventId, images = [], onChange, label = "Images" }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // let the same file be picked again after a removal
    if (!files.length) return;

    setBusy(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));

      const res = await api.post(`/events/${eventId}/images`, formData);
      const urls = res.data?.urls || [];

      onChange([...images, ...urls]);
      toast.success(`${urls.length} image${urls.length === 1 ? "" : "s"} uploaded.`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not upload the images"));
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (index) => onChange(images.filter((_, i) => i !== index));

  return (
    <div className="entry-images">
      <label className="entry-images__label">{label}</label>

      <input
        type="file"
        multiple
        accept="image/*"
        disabled={busy || !eventId}
        onChange={handleFiles}
      />

      {busy && <span className="sc-hint">Uploading…</span>}

      {images.length > 0 && (
        <ul className="entry-images__grid">
          {images.map((url, i) => (
            <li key={`${url}-${i}`}>
              <img src={imageUrl(url)} alt={`${label} ${i + 1}`} />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove image ${i + 1}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One row in a repeatable section, with its numbering and remove control. */
export function EntryCard({ index, title, onRemove, children }) {
  return (
    <div className="entry-card">
      <div className="entry-card__head">
        <span className="entry-card__index">{title} {index + 1}</span>
        <button
          type="button"
          className="sc-row__remove"
          onClick={onRemove}
          aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
        >
          Remove
        </button>
      </div>

      <div className="entry-card__body">{children}</div>
    </div>
  );
}

/** The "+ Add …" button every section ends with. */
export function AddEntryButton({ onClick, children }) {
  return (
    <button type="button" className="sc-btn sc-btn--ghost sc-btn--sm entry-add" onClick={onClick}>
      + {children}
    </button>
  );
}

/** Collect every image URL attached to the repeatable entries of a section. */
export function collectEntryImages(...lists) {
  return lists
    .flat()
    .filter(Boolean)
    .flatMap((entry) => entry?.images || [])
    .filter(Boolean);
}
