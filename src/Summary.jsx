import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api, { errorMessage, isAdmin, imageUrl } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";
import { formatCurrency, formatDate } from "./format";
import "./Summary.css";

export default function Summary() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const cardRef = useRef(null);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const eventId = location.state?.eventId || sessionStorage.getItem("currentEventId");

  useEffect(() => {
    if (!eventId) {
      navigate("/events", { replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        // GET /summary also marks step 7 as reached on the server
        const res = await api.get(`/events/${eventId}/summary`);
        if (!cancelled && res.data.success) setEvent(res.data.event);
      } catch (err) {
        if (!cancelled) toast.error(errorMessage(err, "Could not load the summary"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const downloadPDF = async () => {
    if (!cardRef.current) return;
    setDownloading(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#164764"
      });

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      let remaining = imgH;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
      remaining -= pageH;

      while (remaining > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
        remaining -= pageH;
      }

      pdf.save("Event_Summary.pdf");
      toast.success("Summary downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate the PDF.");
    } finally {
      setDownloading(false);
    }
  };

  // Step 7 — hand the event over to the proposal builder.
  const goToProposal = () => {
    setSubmitting(true);
    navigate(`/proposal/${eventId}`);
  };

  if (loading) {
    return (
      <div className="sc-page">
        <div className="sc-shell">
          <div className="sc-loading">
            <div className="sc-spinner" />
            <p>Loading the summary…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="sc-page">
        <div className="sc-shell">
          <div className="sc-empty">
            <h3>Nothing to show</h3>
            <p>We couldn't find this event.</p>
            <button className="sc-btn" onClick={() => navigate("/events")}>Back to events</button>
          </div>
        </div>
      </div>
    );
  }

  const details = event.details || {};
  const menusByCategory = groupMenus(event.menu_selection?.menus);
  const opsImages = (event.images || []).filter((i) => i.section === "operations");
  const decorImages = (event.images || []).filter((i) => i.section === "decor");
  const template = event.menu_template?.template_id;

  return (
    <div className="sc-page">
      <Stepper current={6} eventId={eventId} />

      <div className="sc-shell sc-fade-in">
        <div className="sc-page-head">
          <h1>Event Summary</h1>
          <p>Check everything reads correctly, then build the client proposal.</p>
        </div>

        <div ref={cardRef} className="summary-doc">

          <section className="sc-card">
            <h2 className="sc-section-title">Event details</h2>
            <dl className="sc-datalist">
              <Fact label="Client" value={details.contact_info?.name} />
              <Fact label="Mobile" value={details.contact_info?.phone} />
              <Fact label="Event" value={details.event_type} />
              <Fact label="Date" value={formatDate(details.event_date)} />
              <Fact label="Start time" value={details.start_time} />
              <Fact label="End time" value={details.end_time} />
              <Fact label="Guests" value={details.guest_count} />
              <Fact label="Venue / requirements" value={details.venue} />
              <Fact label="Created by" value={event.user_id?.name} />
            </dl>
          </section>

          <section className="sc-card">
            <h2 className="sc-section-title">Selected menu</h2>

            {Object.keys(menusByCategory).length === 0 ? (
              <p className="sc-hint">No menu items were selected.</p>
            ) : (
              <div className="summary-menu">
                {Object.entries(menusByCategory).map(([category, dishes]) => (
                  <div className="summary-menu__cat" key={category}>
                    <h3>{category}</h3>
                    <ul>
                      {dishes.map((dish, i) => (
                        <li key={i}>
                          <span className={dish.isVeg ? "summary-veg" : "summary-nonveg"} />
                          {dish.dishName}
                          {dish.notes && <em className="summary-note">{dish.notes}</em>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {event.menu_selection?.beverage_notes && (
              <p className="sc-hint" style={{ marginTop: "1rem" }}>
                <strong>Beverages:</strong> {event.menu_selection.beverage_notes}
              </p>
            )}
          </section>

          {template && (
            <section className="sc-card">
              <h2 className="sc-section-title">Menu card template</h2>
              <div className="summary-template">
                {template.previewImage && (
                  <img src={imageUrl(template.previewImage)} alt={template.templateName} />
                )}
                <div>
                  <h3>{template.templateName}</h3>
                  <p className="sc-hint">This design will be used for the printed menu cards.</p>
                </div>
              </div>
            </section>
          )}

          <section className="sc-card">
            <h2 className="sc-section-title">Operations</h2>

            {event.operations?.crew_list?.length > 0 ? (
              <div className="sc-table-wrap">
                <table className="sc-table">
                  <thead>
                    <tr><th>Role</th><th>Name</th><th>Contact</th></tr>
                  </thead>
                  <tbody>
                    {event.operations.crew_list.map((crew, i) => (
                      <tr key={i}>
                        <td>{crew.role || "—"}</td>
                        <td>{crew.name || "—"}</td>
                        <td>{crew.contact || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sc-hint">No crew assigned yet.</p>
            )}

            {event.operations?.notes && (
              <p className="summary-notes">{event.operations.notes}</p>
            )}

            {opsImages.length > 0 && (
              <div className="summary-gallery">
                {opsImages.map((img, i) => (
                  <img key={i} src={imageUrl(img.original_url)} alt="Operations reference" />
                ))}
              </div>
            )}
          </section>

          <section className="sc-card">
            <h2 className="sc-section-title">Decor</h2>
            <p className="summary-price">{formatCurrency(event.decor?.estimated_price)}</p>

            {decorImages.length > 0 && (
              <div className="summary-gallery">
                {decorImages.map((img, i) => (
                  <img key={i} src={imageUrl(img.original_url)} alt="Decor reference" />
                ))}
              </div>
            )}
          </section>

        </div>

        <div className="sc-actions">
          <button
            className="sc-btn sc-btn--ghost"
            onClick={() => navigate("/decor", { state: { ...location.state, eventId } })}
            disabled={submitting}
          >
            ← Back
          </button>

          <div className="sc-actions__group">
            <button className="sc-btn sc-btn--ghost" onClick={downloadPDF} disabled={downloading}>
              {downloading ? "Preparing…" : "Download PDF"}
            </button>

            <button
              className="sc-btn sc-btn--ghost"
              onClick={() => navigate(isAdmin() ? "/allEvents" : "/events")}
              disabled={submitting}
            >
              Save &amp; exit
            </button>

            <button className="sc-btn sc-btn--accent" onClick={goToProposal} disabled={submitting}>
              Continue to proposal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="sc-datalist__item">
      <dt>{label}</dt>
      <dd>{value === 0 || value ? value : "—"}</dd>
    </div>
  );
}

/** Flatten the populated menu entries into { category: [dish, …] }. */
function groupMenus(menus = []) {
  return menus.reduce((acc, entry) => {
    const dish = entry.menu_id;
    if (!dish) return acc;

    const category = dish.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push({ ...dish, notes: entry.notes });
    return acc;
  }, {});
}
