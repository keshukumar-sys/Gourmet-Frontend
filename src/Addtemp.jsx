import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage, imageUrl } from "./api";
import { useToast } from "./Toast";
import "./Addtemp.css";

export default function Addtemp() {
  const navigate = useNavigate();
  const toast = useToast();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [templateName, setTemplateName] = useState("");
  const [templateImage, setTemplateImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [defaultTextColor, setDefaultTextColor] = useState("#d4af37");

  const loadTemplates = async () => {
    try {
      const res = await api.get("/templates");
      if (res.data.success) setTemplates(res.data.templates || []);
    } catch (err) {
      toast.error(errorMessage(err, "Could not load templates"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke the object URL when the preview changes, so blobs aren't leaked.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setTemplateImage(file || null);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!templateName.trim()) {
      toast.error("Give the template a name.");
      return;
    }
    if (!templateImage) {
      toast.error("Choose a preview image.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("templateName", templateName.trim());
      formData.append("defaultTextColor", defaultTextColor);
      // The backend's multer field is `image` (upload.single("image"))
      formData.append("image", templateImage);

      const res = await api.post("/templates", formData);

      if (res.data.success) {
        toast.success("Template added.");
        setTemplateName("");
        setTemplateImage(null);
        setPreviewUrl(null);
        loadTemplates();
      }
    } catch (err) {
      toast.error(errorMessage(err, "Could not add the template"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tpl) => {
    if (!window.confirm(`Delete "${tpl.templateName}"?`)) return;

    setDeletingId(tpl._id);
    try {
      await api.delete(`/templates/${tpl._id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== tpl._id));
      toast.success("Template deleted.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the template"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="sc-page">
      <div className="sc-shell sc-fade-in">
        <div className="sc-page-head">
          <h1>Menu Card Templates</h1>
          <p>These designs appear in step 3 of the event flow.</p>
        </div>

        <section className="sc-card">
          <h2 className="sc-section-title">Add a template</h2>

          <form onSubmit={handleSubmit}>
            <div className="sc-grid">
              <div className="sc-field">
                <label htmlFor="tpl-name">Template name</label>
                <input
                  id="tpl-name"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Classic Gold"
                />
              </div>

              <div className="sc-field">
                <label htmlFor="tpl-color">Default text colour</label>
                <div className="tpl-color-row">
                  <input
                    id="tpl-color"
                    type="color"
                    value={defaultTextColor}
                    onChange={(e) => setDefaultTextColor(e.target.value)}
                  />
                  <span>{defaultTextColor}</span>
                </div>
              </div>

              <div className="sc-field sc-span-2">
                <label htmlFor="tpl-image">Preview image</label>
                <input id="tpl-image" type="file" accept="image/*" onChange={handleImageChange} />
              </div>

              {previewUrl && (
                <div className="sc-field sc-span-2">
                  <span className="sc-label">Preview</span>
                  <img src={previewUrl} alt="Template preview" className="tpl-upload-preview" />
                </div>
              )}
            </div>

            <div className="sc-actions">
              <button
                type="button"
                className="sc-btn sc-btn--ghost"
                onClick={() => navigate("/allEvents")}
              >
                ← Back
              </button>
              <button type="submit" className="sc-btn" disabled={saving}>
                {saving ? "Uploading…" : "Add template"}
              </button>
            </div>
          </form>
        </section>

        <section className="sc-card">
          <h2 className="sc-section-title">Existing templates</h2>

          {loading ? (
            <div className="sc-loading"><div className="sc-spinner" /><p>Loading…</p></div>
          ) : templates.length === 0 ? (
            <p className="sc-hint">No templates yet — add the first one above.</p>
          ) : (
            <div className="tpl-list">
              {templates.map((tpl) => (
                <div key={tpl._id} className="tpl-list__item">
                  {tpl.previewImage && <img src={imageUrl(tpl.previewImage)} alt={tpl.templateName} />}
                  <div className="tpl-list__meta">
                    <h3>{tpl.templateName}</h3>
                    <span className="tpl-swatch" style={{ background: tpl.defaultTextColor }} />
                    <span className="sc-hint">{tpl.defaultTextColor}</span>
                  </div>
                  <button
                    className="sc-btn sc-btn--danger sc-btn--sm"
                    onClick={() => handleDelete(tpl)}
                    disabled={deletingId === tpl._id}
                  >
                    {deletingId === tpl._id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
