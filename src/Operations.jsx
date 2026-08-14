import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";

const emptyCrew = () => ({ role: "", name: "", contact: "" });

export default function Operations() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [crewList, setCrewList] = useState([emptyCrew()]);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const eventId = location.state?.eventId || sessionStorage.getItem("currentEventId");

  useEffect(() => {
    if (!eventId) {
      navigate("/events", { replace: true });
      return;
    }

    // Re-entering the step should show what was already saved.
    let cancelled = false;
    api.get(`/events/${eventId}`)
      .then((res) => {
        if (cancelled || !res.data.success) return;
        const ops = res.data.event.operations || {};
        if (ops.crew_list?.length) setCrewList(ops.crew_list);
        if (ops.notes) setNotes(ops.notes);
      })
      .catch(() => { /* first visit — nothing saved yet */ });

    return () => { cancelled = true; };
  }, [eventId, navigate]);

  const handleCrewChange = (index, field, value) => {
    setCrewList((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeCrewMember = (index) => {
    setCrewList((rows) => {
      const next = rows.filter((_, i) => i !== index);
      return next.length ? next : [emptyCrew()];
    });
  };

  const handleNext = async () => {
    setLoading(true);

    try {
      await api.put(`/events/${eventId}/operations`, {
        crew_list: crewList.filter((c) => c.role?.trim() || c.name?.trim()),
        notes
      });

      if (images.length > 0) {
        const formData = new FormData();
        formData.append("section", "operations");
        formData.append("subtype", "location");
        images.forEach((img) => formData.append("images", img));

        await api.post(`/events/${eventId}/images`, formData);
      }

      navigate("/decor", { state: { ...location.state, eventId } });
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the operations details"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sc-page">
      <Stepper current={4} eventId={eventId} />

      <div className="sc-shell sc-fade-in">
        <div className="sc-page-head">
          <h1>Operations</h1>
          <p>Assign the crew and attach any location references.</p>
        </div>

        <section className="sc-card">
          <h2 className="sc-section-title">Crew list</h2>

          {crewList.map((crew, index) => (
            <div key={index} className="sc-row ops-row">
              <div className="sc-field">
                <label>Role</label>
                <input
                  type="text"
                  placeholder="e.g. Event Manager"
                  value={crew.role}
                  onChange={(e) => handleCrewChange(index, "role", e.target.value)}
                />
              </div>

              <div className="sc-field">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={crew.name}
                  onChange={(e) => handleCrewChange(index, "name", e.target.value)}
                />
              </div>

              <div className="sc-field">
                <label>Contact</label>
                <input
                  type="text"
                  placeholder="Phone or email"
                  value={crew.contact}
                  onChange={(e) => handleCrewChange(index, "contact", e.target.value)}
                />
              </div>

              <button
                type="button"
                className="sc-row__remove"
                onClick={() => removeCrewMember(index)}
                aria-label={`Remove crew member ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="sc-btn sc-btn--ghost sc-btn--sm"
            onClick={() => setCrewList((rows) => [...rows, emptyCrew()])}
          >
            + Add crew member
          </button>
        </section>

        <section className="sc-card">
          <h2 className="sc-section-title">Notes &amp; references</h2>

          <div className="sc-field">
            <label htmlFor="ops-notes">Operation notes</label>
            <textarea
              id="ops-notes"
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Load-in times, access, kitchen setup…"
            />
          </div>

          <div className="sc-field" style={{ marginTop: "var(--sc-gap)" }}>
            <label htmlFor="ops-images">Location images</label>
            <input
              id="ops-images"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(Array.from(e.target.files))}
            />
            <span className="sc-hint">
              {images.length > 0
                ? `${images.length} image${images.length > 1 ? "s" : ""} ready to upload`
                : "Optional — helps the crew prepare"}
            </span>
          </div>

          <div className="sc-actions">
            <button className="sc-btn sc-btn--ghost" onClick={() => navigate(-1)} disabled={loading}>
              ← Back
            </button>
            <button className="sc-btn" onClick={handleNext} disabled={loading}>
              {loading ? "Saving…" : "Next: Decor →"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
