import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";
import { formatCurrency } from "./format";

export default function Decor() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [images, setImages] = useState([]);
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
        const price = res.data.event.decor?.estimated_price;
        if (price) setEstimatedPrice(String(price));
      })
      .catch(() => { /* first visit — nothing saved yet */ });

    return () => { cancelled = true; };
  }, [eventId, navigate]);

  const handleNext = async () => {
    setLoading(true);

    try {
      await api.put(`/events/${eventId}/decor`, {
        estimated_price: Number(estimatedPrice) || 0
      });

      if (images.length > 0) {
        const formData = new FormData();
        formData.append("section", "decor");
        formData.append("subtype", "decor");
        images.forEach((img) => formData.append("images", img));

        await api.post(`/events/${eventId}/images`, formData);
      }

      navigate("/summary", { state: { ...location.state, eventId } });
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the decor details"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sc-page">
      <Stepper current={5} eventId={eventId} />

      <div className="sc-shell sc-shell--narrow sc-fade-in">
        <div className="sc-page-head">
          <h1>Decor</h1>
          <p>Estimate the decor package and attach mood references.</p>
        </div>

        <section className="sc-card">
          <div className="sc-field">
            <label htmlFor="decor-price">Estimated price</label>
            <input
              id="decor-price"
              type="number"
              min="0"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
              placeholder="0"
            />
            <span className="sc-hint">
              {Number(estimatedPrice) > 0
                ? `Shown to the client as ${formatCurrency(estimatedPrice)}`
                : "Leave blank if decor is not chargeable"}
            </span>
          </div>

          <div className="sc-field" style={{ marginTop: "var(--sc-gap)" }}>
            <label htmlFor="decor-images">Decor images</label>
            <input
              id="decor-images"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(Array.from(e.target.files))}
            />
            <span className="sc-hint">
              {images.length > 0
                ? `${images.length} image${images.length > 1 ? "s" : ""} ready to upload`
                : "These appear in the client proposal"}
            </span>
          </div>

          <div className="sc-actions">
            <button className="sc-btn sc-btn--ghost" onClick={() => navigate(-1)} disabled={loading}>
              ← Back
            </button>
            <button className="sc-btn" onClick={handleNext} disabled={loading}>
              {loading ? "Saving…" : "Next: Summary →"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
