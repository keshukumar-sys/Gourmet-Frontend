import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";
import {
  useEntryList,
  EntryImages,
  EntryCard,
  AddEntryButton
} from "./EntryFields";

const emptyCrew = () => ({ role: "", name: "", contact: "", notes: "", images: [] });
const emptyLocation = () => ({ name: "", notes: "", images: [] });
const emptyCrockery = () => ({ name: "", notes: "", images: [] });
const emptyNote = () => ({ note: "", reference: "", images: [] });

/**
 * Step 3 of the flow.
 *
 * Each of the four sections is a list the user can grow, because a real event
 * has several crew members, several rooms and several sets of crockery — and
 * each of those needs its own photographs and notes rather than one shared
 * pile at the bottom of the page.
 */
export default function Operations() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const crew = useEntryList(emptyCrew);
  const locations = useEntryList(emptyLocation);
  const crockery = useEntryList(emptyCrockery);
  const notesRefs = useEntryList(emptyNote);

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
        crew.load(ops.crew_list);
        locations.load(ops.locations);
        crockery.load(ops.crockery);

        // Events saved before this step had repeatable notes carry a single
        // free-text field — surface it as the first reference entry.
        if (ops.notes_references?.length) {
          notesRefs.load(ops.notes_references);
        } else if (ops.notes) {
          notesRefs.load([{ note: ops.notes, reference: "", images: [] }]);
        }
      })
      .catch(() => { /* first visit — nothing saved yet */ });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, navigate]);

  const handleNext = async () => {
    setLoading(true);

    try {
      await api.put(`/events/${eventId}/operations`, {
        crew_list: crew.entries,
        locations: locations.entries,
        crockery: crockery.entries,
        notes_references: notesRefs.entries
      });

      navigate("/decor", { state: { ...location.state, eventId } });
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the operations details"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sc-page">
      <Stepper current={3} eventId={eventId} />

      <div className="sc-shell sc-fade-in">
        <div className="sc-page-head">
          <h1>Operations</h1>
          <p>Crew, locations, tableware and references — add as many entries as the event needs.</p>
        </div>

        {/* 1. Crew list */}
        <section className="sc-card">
          <h2 className="sc-section-title">Crew list</h2>

          {crew.entries.map((row, i) => (
            <EntryCard key={i} index={i} title="Crew member" onRemove={() => crew.remove(i)}>
              <div className="entry-grid-3">
                <div className="sc-field">
                  <label>Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Event Manager"
                    value={row.role}
                    onChange={(e) => crew.update(i, "role", e.target.value)}
                  />
                </div>

                <div className="sc-field">
                  <label>Name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={row.name}
                    onChange={(e) => crew.update(i, "name", e.target.value)}
                  />
                </div>

                <div className="sc-field">
                  <label>Contact</label>
                  <input
                    type="text"
                    placeholder="Phone or email"
                    value={row.contact}
                    onChange={(e) => crew.update(i, "contact", e.target.value)}
                  />
                </div>
              </div>

              <EntryImages
                eventId={eventId}
                images={row.images}
                label="Images"
                onChange={(images) => crew.update(i, "images", images)}
              />

              <div className="sc-field">
                <label>Extra notes</label>
                <textarea
                  rows="2"
                  placeholder="Shift timing, uniform, anything specific to this person…"
                  value={row.notes}
                  onChange={(e) => crew.update(i, "notes", e.target.value)}
                />
              </div>
            </EntryCard>
          ))}

          <AddEntryButton onClick={crew.add}>Add crew member</AddEntryButton>
        </section>

        {/* 2. Locations */}
        <section className="sc-card">
          <h2 className="sc-section-title">Locations</h2>

          {locations.entries.map((row, i) => (
            <EntryCard key={i} index={i} title="Location" onRemove={() => locations.remove(i)}>
              <div className="sc-field">
                <label>Location name</label>
                <input
                  type="text"
                  placeholder="e.g. Banquet Hall, Poolside Lawn"
                  value={row.name}
                  onChange={(e) => locations.update(i, "name", e.target.value)}
                />
              </div>

              <EntryImages
                eventId={eventId}
                images={row.images}
                label="Images of location"
                onChange={(images) => locations.update(i, "images", images)}
              />

              <div className="sc-field">
                <label>Notes</label>
                <textarea
                  rows="2"
                  placeholder="Access, power points, load-in route…"
                  value={row.notes}
                  onChange={(e) => locations.update(i, "notes", e.target.value)}
                />
              </div>
            </EntryCard>
          ))}

          <AddEntryButton onClick={locations.add}>Add location</AddEntryButton>
        </section>

        {/* 3. Crockery and cutlery */}
        <section className="sc-card">
          <h2 className="sc-section-title">Crockery &amp; cutlery</h2>

          {crockery.entries.map((row, i) => (
            <EntryCard key={i} index={i} title="Item" onRemove={() => crockery.remove(i)}>
              <div className="sc-field">
                <label>Crockery / cutlery</label>
                <input
                  type="text"
                  placeholder="e.g. Gold-rim dinner plates, 200 pcs"
                  value={row.name}
                  onChange={(e) => crockery.update(i, "name", e.target.value)}
                />
              </div>

              <EntryImages
                eventId={eventId}
                images={row.images}
                label="Images"
                onChange={(images) => crockery.update(i, "images", images)}
              />

              <div className="sc-field">
                <label>Notes</label>
                <textarea
                  rows="2"
                  placeholder="Supplier, hire cost, breakage policy…"
                  value={row.notes}
                  onChange={(e) => crockery.update(i, "notes", e.target.value)}
                />
              </div>
            </EntryCard>
          ))}

          <AddEntryButton onClick={crockery.add}>Add crockery / cutlery</AddEntryButton>
        </section>

        {/* 4. Notes and references */}
        <section className="sc-card">
          <h2 className="sc-section-title">Notes &amp; references</h2>

          {notesRefs.entries.map((row, i) => (
            <EntryCard key={i} index={i} title="Note" onRemove={() => notesRefs.remove(i)}>
              <div className="sc-field">
                <label>Note</label>
                <textarea
                  rows="3"
                  placeholder="Load-in times, kitchen setup, service flow…"
                  value={row.note}
                  onChange={(e) => notesRefs.update(i, "note", e.target.value)}
                />
              </div>

              <div className="sc-field">
                <label>Reference</label>
                <input
                  type="text"
                  placeholder="Link, document name or the person who asked for it"
                  value={row.reference}
                  onChange={(e) => notesRefs.update(i, "reference", e.target.value)}
                />
              </div>

              <EntryImages
                eventId={eventId}
                images={row.images}
                label="Reference images"
                onChange={(images) => notesRefs.update(i, "images", images)}
              />
            </EntryCard>
          ))}

          <AddEntryButton onClick={notesRefs.add}>Add note</AddEntryButton>

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
