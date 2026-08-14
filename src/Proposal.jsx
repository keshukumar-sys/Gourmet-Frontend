import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";
import { formatCurrency, formatDate } from "./format";
import "./Proposal.css";

const emptyCommercial = () => ({ item: "", qty: 1, cost: "" });
const emptyExtra = () => ({ name: "", description: "", price: "" });

export default function Proposal() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [prefill, setPrefill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [overview, setOverview] = useState("");
  const [commercials, setCommercials] = useState([emptyCommercial()]);
  const [chargeableExtras, setChargeableExtras] = useState([emptyExtra()]);
  const [paymentTerms, setPaymentTerms] = useState(
    "50% advance to confirm the booking, 50% on the day of the event."
  );
  const [taxPercent, setTaxPercent] = useState(0);
  const [validUntil, setValidUntil] = useState("");
  const [termsNotes, setTermsNotes] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get(`/events/${eventId}/proposal/prefill`);
        if (cancelled || !res.data.success) return;

        const p = res.data.prefill;
        setPrefill(p);

        const saved = p.existing_proposal;
        const hasSaved = saved && (saved.overview || saved.commercials?.length);

        if (hasSaved) {
          // Re-opening an existing proposal: keep what was written before.
          setOverview(saved.overview || "");
          setCommercials(saved.commercials?.length ? saved.commercials : [emptyCommercial()]);
          setChargeableExtras(saved.chargeable_extras?.length ? saved.chargeable_extras : [emptyExtra()]);
          setPaymentTerms(saved.payment_terms || "");
          setTaxPercent(saved.tax_percent || 0);
          setTermsNotes(saved.terms_notes || "");
          if (saved.valid_until) {
            setValidUntil(new Date(saved.valid_until).toISOString().split("T")[0]);
          }
        } else {
          setOverview(buildOverview(p));
          setCommercials(
            p.suggested_commercials?.length ? p.suggested_commercials : [emptyCommercial()]
          );
          // Default the quote validity to two weeks out.
          const twoWeeks = new Date();
          twoWeeks.setDate(twoWeeks.getDate() + 14);
          setValidUntil(twoWeeks.toISOString().split("T")[0]);
        }
      } catch (err) {
        if (!cancelled) toast.error(errorMessage(err, "Could not load the event details"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const totals = useMemo(() => {
    const commercialsTotal = commercials.reduce(
      (sum, c) => sum + (Number(c.cost) || 0) * (Number(c.qty) || 1),
      0
    );
    const extrasTotal = chargeableExtras.reduce(
      (sum, e) => sum + (Number(e.price) || 0),
      0
    );
    const subtotal = commercialsTotal + extrasTotal;
    const tax = subtotal * (Number(taxPercent) || 0) / 100;
    return { subtotal, tax, total: subtotal + tax };
  }, [commercials, chargeableExtras, taxPercent]);

  const updateRow = (setter, index, field, value) => {
    setter((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const removeRow = (setter, index, factory) => {
    setter((rows) => {
      const next = rows.filter((_, i) => i !== index);
      return next.length ? next : [factory()];
    });
  };

  const handleSubmit = async () => {
    const filledCommercials = commercials.filter((c) => c.item?.trim());

    if (!overview.trim()) {
      toast.error("Add an overview so the client knows what they are looking at.");
      return;
    }

    if (!filledCommercials.length) {
      toast.error("Add at least one commercial line item.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/events/${eventId}/proposal`, {
        overview,
        commercials: filledCommercials.map((c) => ({
          item: c.item.trim(),
          qty: Number(c.qty) || 1,
          cost: Number(c.cost) || 0
        })),
        payment_terms: paymentTerms,
        chargeable_extras: chargeableExtras
          .filter((e) => e.name?.trim())
          .map((e) => ({
            name: e.name.trim(),
            description: e.description || "",
            price: Number(e.price) || 0
          })),
        tax_percent: Number(taxPercent) || 0,
        valid_until: validUntil || undefined,
        terms_notes: termsNotes
      });

      if (res.data.success) {
        toast.success("Proposal generated. Showing the client view.");
        navigate(`/proposal/${eventId}/view`);
      }
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save the proposal"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sc-page">
        <div className="sc-shell">
          <div className="sc-loading">
            <div className="sc-spinner" />
            <p>Pulling the event details together…</p>
          </div>
        </div>
      </div>
    );
  }

  const menuCategories = prefill?.menu_categories || {};
  const dishCount = Object.values(menuCategories).flat().length;

  return (
    <div className="sc-page">
      <Stepper current={7} eventId={eventId} />

      <div className="sc-shell sc-fade-in">
        <div className="sc-page-head">
          <h1>Build the Proposal</h1>
          <p>Everything below is drawn from this event. Adjust the numbers, then generate the client document.</p>
        </div>

        {/* What the event actually is — read-only context */}
        <section className="sc-card">
          <h2 className="sc-section-title">Event at a glance</h2>

          <dl className="sc-datalist">
            <div className="sc-datalist__item">
              <dt>Client</dt>
              <dd>{prefill?.client_name || "—"}</dd>
            </div>
            <div className="sc-datalist__item">
              <dt>Event</dt>
              <dd>{prefill?.event_type || "—"}</dd>
            </div>
            <div className="sc-datalist__item">
              <dt>Date</dt>
              <dd>{formatDate(prefill?.event_date)}</dd>
            </div>
            <div className="sc-datalist__item">
              <dt>Timing</dt>
              <dd>
                {prefill?.start_time || "—"}
                {prefill?.end_time ? ` – ${prefill.end_time}` : ""}
              </dd>
            </div>
            <div className="sc-datalist__item">
              <dt>Venue</dt>
              <dd>{prefill?.venue || "—"}</dd>
            </div>
            <div className="sc-datalist__item">
              <dt>Guests</dt>
              <dd>{prefill?.guest_count || 0}</dd>
            </div>
            <div className="sc-datalist__item">
              <dt>Dishes selected</dt>
              <dd>{dishCount}</dd>
            </div>
            <div className="sc-datalist__item">
              <dt>Menu value / plate</dt>
              <dd>{formatCurrency(prefill?.per_plate_price)}</dd>
            </div>
          </dl>
        </section>

        {/* Overview */}
        <section className="sc-card">
          <h2 className="sc-section-title">Overview</h2>
          <div className="sc-field">
            <label htmlFor="overview">Opening note to the client</label>
            <textarea
              id="overview"
              rows="6"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Introduce the proposal in a sentence or two…"
            />
            <span className="sc-hint">Prefilled from the event details — edit freely.</span>
          </div>
        </section>

        {/* Commercials */}
        <section className="sc-card">
          <h2 className="sc-section-title">Commercials</h2>

          {commercials.map((c, i) => (
            <div key={i} className="sc-row prop-row prop-row--commercial">
              <div className="sc-field">
                <label>Line item</label>
                <input
                  type="text"
                  value={c.item}
                  placeholder="e.g. Catering (per plate)"
                  onChange={(e) => updateRow(setCommercials, i, "item", e.target.value)}
                />
              </div>

              <div className="sc-field">
                <label>Qty</label>
                <input
                  type="number"
                  min="1"
                  value={c.qty}
                  onChange={(e) => updateRow(setCommercials, i, "qty", e.target.value)}
                />
              </div>

              <div className="sc-field">
                <label>Rate</label>
                <input
                  type="number"
                  min="0"
                  value={c.cost}
                  placeholder="0"
                  onChange={(e) => updateRow(setCommercials, i, "cost", e.target.value)}
                />
              </div>

              <div className="sc-field">
                <label>Amount</label>
                <output className="prop-amount">
                  {formatCurrency((Number(c.cost) || 0) * (Number(c.qty) || 1))}
                </output>
              </div>

              <button
                type="button"
                className="sc-row__remove"
                onClick={() => removeRow(setCommercials, i, emptyCommercial)}
                aria-label={`Remove line item ${i + 1}`}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="sc-btn sc-btn--ghost sc-btn--sm"
            onClick={() => setCommercials((rows) => [...rows, emptyCommercial()])}
          >
            + Add line item
          </button>
        </section>

        {/* Chargeable extras */}
        <section className="sc-card">
          <h2 className="sc-section-title">Chargeable extras</h2>

          {chargeableExtras.map((ex, i) => (
            <div key={i} className="sc-row prop-row prop-row--extra">
              <div className="sc-field">
                <label>Name</label>
                <input
                  type="text"
                  value={ex.name}
                  placeholder="e.g. Live counter"
                  onChange={(e) => updateRow(setChargeableExtras, i, "name", e.target.value)}
                />
              </div>

              <div className="sc-field">
                <label>Description</label>
                <input
                  type="text"
                  value={ex.description}
                  placeholder="What the client gets"
                  onChange={(e) => updateRow(setChargeableExtras, i, "description", e.target.value)}
                />
              </div>

              <div className="sc-field">
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  value={ex.price}
                  placeholder="0"
                  onChange={(e) => updateRow(setChargeableExtras, i, "price", e.target.value)}
                />
              </div>

              <button
                type="button"
                className="sc-row__remove"
                onClick={() => removeRow(setChargeableExtras, i, emptyExtra)}
                aria-label={`Remove extra ${i + 1}`}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="sc-btn sc-btn--ghost sc-btn--sm"
            onClick={() => setChargeableExtras((rows) => [...rows, emptyExtra()])}
          >
            + Add extra
          </button>
        </section>

        {/* Terms + running total */}
        <section className="sc-card">
          <h2 className="sc-section-title">Terms &amp; total</h2>

          <div className="prop-terms">
            <div className="prop-terms__fields">
              <div className="sc-field">
                <label htmlFor="payment-terms">Payment terms</label>
                <textarea
                  id="payment-terms"
                  rows="3"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. 50% advance, 50% on the day of the event"
                />
              </div>

              <div className="sc-grid">
                <div className="sc-field">
                  <label htmlFor="tax">Tax %</label>
                  <input
                    id="tax"
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                  />
                </div>

                <div className="sc-field">
                  <label htmlFor="valid-until">Quote valid until</label>
                  <input
                    id="valid-until"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>

              <div className="sc-field">
                <label htmlFor="terms-notes">Additional notes</label>
                <textarea
                  id="terms-notes"
                  rows="3"
                  value={termsNotes}
                  onChange={(e) => setTermsNotes(e.target.value)}
                  placeholder="Cancellation policy, inclusions, anything else the client should know"
                />
              </div>
            </div>

            <aside className="prop-total" aria-live="polite">
              <h3>Running total</h3>

              <div className="prop-total__row">
                <span>Subtotal</span>
                <strong>{formatCurrency(totals.subtotal)}</strong>
              </div>

              <div className="prop-total__row">
                <span>Tax ({Number(taxPercent) || 0}%)</span>
                <strong>{formatCurrency(totals.tax)}</strong>
              </div>

              <div className="prop-total__row prop-total__row--grand">
                <span>Total</span>
                <strong>{formatCurrency(totals.total)}</strong>
              </div>

              {prefill?.guest_count > 0 && (
                <p className="prop-total__per-head">
                  {formatCurrency(totals.total / prefill.guest_count)} per guest
                </p>
              )}
            </aside>
          </div>

          <div className="sc-actions">
            <button
              type="button"
              className="sc-btn sc-btn--ghost"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              ← Back
            </button>

            <div className="sc-actions__group">
              <button
                type="button"
                className="sc-btn sc-btn--accent"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Generating…" : "Generate client proposal →"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Default opening paragraph, assembled from the facts already captured. */
function buildOverview(p) {
  const parts = [
    `Thank you for considering Social Catering for ${p.event_type || "your event"}.`,
    p.event_date
      ? `We are delighted to put forward the following proposal for ${formatDate(p.event_date)}${
          p.venue ? ` at ${p.venue}` : ""
        }, catering for ${p.guest_count || 0} guests.`
      : `We are delighted to put forward the following proposal for ${p.guest_count || 0} guests.`,
    "The menu, service and decor outlined here have been curated specifically around your brief."
  ];

  return parts.join("\n\n");
}
