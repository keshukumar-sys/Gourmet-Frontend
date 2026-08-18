import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";
import { formatCurrency } from "./format";
import {
  useEntryList,
  EntryImages,
  EntryCard,
  AddEntryButton
} from "./EntryFields";

const emptyDecorEntry = () => ({ name: "", price: "", notes: "", images: [] });

/**
 * Step 4 of the flow.
 *
 * Decor is quoted per location and per element, so both are repeatable lists
 * carrying their own price, images and notes. The estimate at the bottom adds
 * those up but stays editable — the number the client sees is often rounded or
 * negotiated away from the raw sum.
 */
export default function Decor() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const locations = useEntryList(emptyDecorEntry);
  const elements = useEntryList(emptyDecorEntry);

  // null means "follow the entries"; a string means the user set it by hand
  const [priceOverride, setPriceOverride] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const eventId = location.state?.eventId || sessionStorage.getItem("currentEventId");

  useEffect(() => {
    if (!eventId) {
      navigate("/events", { replace: true });
      return;
    }

    let cancelled = false;
    api.get(`/events/${eventId}`)
      .then((res) => {
        if (cancelled || !res.data.success) return;

        const decor = res.data.event.decor || {};
        locations.load(decor.locations);
        elements.load(decor.elements);
        setAdditionalInfo(decor.additional_info || "");

        if (decor.estimated_price) setPriceOverride(String(decor.estimated_price));
      })
      .catch(() => { /* first visit — nothing saved yet */ });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, navigate]);

  // What the entered line prices add up to
  const entriesTotal = useMemo(
    () => [...locations.entries, ...elements.entries]
      .reduce((sum, row) => sum + (Number(row.price) || 0), 0),
    [locations.entries, elements.entries]
  );

  // The field follows the running sum until the user types over it
  const estimatedPrice = priceOverride ?? (entriesTotal ? String(entriesTotal) : "");

  const handleNext = async () => {
    setLoading(true);

    try {
      await api.put(`/events/${eventId}/decor`, {
        locations: locations.entries,
        elements: elements.entries,
        estimated_price: Number(estimatedPrice) || 0,
        additional_info: additionalInfo
      });

      navigate("/templateSelection", { state: { ...location.state, eventId } });
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the decor details"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sc-page">
      <Stepper current={4} eventId={eventId} />

      <div className="sc-shell sc-fade-in">
        <div className="sc-page-head">
          <h1>Decor</h1>
          <p>Price the decor by location and by element, then set the estimate the client sees.</p>
        </div>

        {/* 1. Decor by location */}
        <section className="sc-card">
          <h2 className="sc-section-title">Decor locations</h2>

          {locations.entries.map((row, i) => (
            <EntryCard key={i} index={i} title="Location" onRemove={() => locations.remove(i)}>
              <div className="entry-grid-2">
                <div className="sc-field">
                  <label>Location of decor</label>
                  <input
                    type="text"
                    placeholder="e.g. Entrance arch, Stage backdrop"
                    value={row.name}
                    onChange={(e) => locations.update(i, "name", e.target.value)}
                  />
                </div>

                <div className="sc-field">
                  <label>Price</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={row.price}
                    onChange={(e) => locations.update(i, "price", e.target.value)}
                  />
                </div>
              </div>

              <EntryImages
                eventId={eventId}
                images={row.images}
                label="Images"
                onChange={(images) => locations.update(i, "images", images)}
              />

              <div className="sc-field">
                <label>Notes</label>
                <textarea
                  rows="2"
                  placeholder="Setup time, dimensions, anything the crew should know…"
                  value={row.notes}
                  onChange={(e) => locations.update(i, "notes", e.target.value)}
                />
              </div>
            </EntryCard>
          ))}

          <AddEntryButton onClick={locations.add}>Add decor location</AddEntryButton>
        </section>

        {/* 2. Flowers and elements */}
        <section className="sc-card">
          <h2 className="sc-section-title">Flowers &amp; elements</h2>

          {elements.entries.map((row, i) => (
            <EntryCard key={i} index={i} title="Element" onRemove={() => elements.remove(i)}>
              <div className="entry-grid-2">
                <div className="sc-field">
                  <label>Flower / element</label>
                  <input
                    type="text"
                    placeholder="e.g. White orchids, Fairy lights"
                    value={row.name}
                    onChange={(e) => elements.update(i, "name", e.target.value)}
                  />
                </div>

                <div className="sc-field">
                  <label>Price</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={row.price}
                    onChange={(e) => elements.update(i, "price", e.target.value)}
                  />
                </div>
              </div>

              <EntryImages
                eventId={eventId}
                images={row.images}
                label="Images"
                onChange={(images) => elements.update(i, "images", images)}
              />

              <div className="sc-field">
                <label>Notes</label>
                <textarea
                  rows="2"
                  placeholder="Sourcing, seasonality, substitutions…"
                  value={row.notes}
                  onChange={(e) => elements.update(i, "notes", e.target.value)}
                />
              </div>
            </EntryCard>
          ))}

          <AddEntryButton onClick={elements.add}>Add flower / element</AddEntryButton>
        </section>

        {/* 3. Estimated price */}
        <section className="sc-card">
          <h2 className="sc-section-title">Estimated price</h2>

          <div className="sc-field">
            <label htmlFor="decor-price">Decor estimate</label>
            <input
              id="decor-price"
              type="number"
              min="0"
              value={estimatedPrice}
              onChange={(e) => setPriceOverride(e.target.value)}
              placeholder="0"
            />
            <span className="sc-hint">
              {entriesTotal > 0
                ? `Entries above add up to ${formatCurrency(entriesTotal)}. Adjust if the quoted figure differs.`
                : "Leave blank if decor is not chargeable."}
            </span>
          </div>

          {Number(estimatedPrice) > 0 && (
            <p className="sc-hint">
              Shown to the client as <strong>{formatCurrency(estimatedPrice)}</strong>.
            </p>
          )}
        </section>

        {/* 4. Additional information */}
        <section className="sc-card">
          <h2 className="sc-section-title">Additional information</h2>

          <div className="sc-field">
            <label htmlFor="decor-info">Anything else about the decor</label>
            <textarea
              id="decor-info"
              rows="4"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Colour palette, client preferences, restrictions at the venue…"
            />
          </div>

          <div className="sc-actions">
            <button className="sc-btn sc-btn--ghost" onClick={() => navigate(-1)} disabled={loading}>
              ← Back
            </button>
            <button className="sc-btn" onClick={handleNext} disabled={loading}>
              {loading ? "Saving…" : "Next: Template →"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
