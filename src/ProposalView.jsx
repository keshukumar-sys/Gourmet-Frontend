import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api, { errorMessage, isAdmin, imageUrl } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";
import { formatCurrency, formatDate } from "./format";
import "./Proposal.css";

/**
 * The client-facing proposal document.
 *
 * This is the end of the flow: everything captured across the seven steps —
 * contact, timing, venue, the selected menu, crew, decor and commercials —
 * is rendered as one document the client can be sent.
 */
export default function ProposalView() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const docRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get(`/events/${eventId}/proposal`);
        if (!cancelled && res.data.success) setData(res.data);
      } catch (err) {
        if (!cancelled) toast.error(errorMessage(err, "Could not load the proposal"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const event = data?.event;
  const proposal = data?.proposal || {};
  const details = event?.details || {};
  const menuCategories = data?.menu_categories || {};

  const commercials = proposal.commercials || [];
  const extras = proposal.chargeable_extras || [];

  const proposalRef = useMemo(
    () => (eventId ? `SC-${String(eventId).slice(-6).toUpperCase()}` : ""),
    [eventId]
  );

  const opsImages = (event?.images || []).filter((i) => i.section === "operations");
  const decorImages = (event?.images || []).filter((i) => i.section === "decor");

  const downloadPDF = async () => {
    if (!docRef.current) return;
    setDownloading(true);

    try {
      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: docRef.current.scrollWidth
      });

      // Paginate the capture across A4 pages instead of squashing it onto one.
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;

      let remaining = imgH;
      let position = 0;
      const imgData = canvas.toDataURL("image/png");

      pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
      remaining -= pageH;

      while (remaining > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
        remaining -= pageH;
      }

      const client = (details.contact_info?.name || "Client").replace(/\s+/g, "_");
      pdf.save(`Proposal_${client}_${proposalRef}.pdf`);
      toast.success("Proposal downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate the PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const finishFlow = () => {
    setFinishing(true);
    [
      "bookingData", "selectedMenus", "menuNotes", "templateSettings",
      "templateHTML", "bookingInProgress", "eventFlowId", "currentEventId", "editMode"
    ].forEach((k) => sessionStorage.removeItem(k));

    toast.success("Event and proposal saved.");
    navigate(isAdmin() ? "/allEvents" : "/events", { replace: true });
  };

  if (loading) {
    return (
      <div className="sc-page">
        <div className="sc-shell">
          <div className="sc-loading">
            <div className="sc-spinner" />
            <p>Preparing the proposal…</p>
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
            <h3>Proposal not found</h3>
            <p>This event may have been removed.</p>
            <button className="sc-btn" onClick={() => navigate("/events")}>
              Back to events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-page">
      <Stepper current={7} eventId={eventId} />

      <div className="propview-toolbar">
        <button
          className="sc-btn sc-btn--ghost"
          onClick={() => navigate(`/proposal/${eventId}`)}
        >
          ← Edit proposal
        </button>

        <div className="propview-toolbar__group">
          <button className="sc-btn sc-btn--ghost" onClick={() => window.print()}>
            Print
          </button>
          <button className="sc-btn" onClick={downloadPDF} disabled={downloading}>
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
          <button className="sc-btn sc-btn--accent" onClick={finishFlow} disabled={finishing}>
            Done
          </button>
        </div>
      </div>

      <article className="propdoc sc-fade-in" ref={docRef}>

        <header className="propdoc__header">
          <div className="propdoc__brand">
            <h1>Social Catering</h1>
            <p>Event Proposal</p>
          </div>

          <div className="propdoc__meta">
            <div>Ref <strong>{proposalRef}</strong></div>
            <div>Issued <strong>{formatDate(proposal.generated_at || event.updatedAt)}</strong></div>
            {proposal.valid_until && (
              <div>Valid until <strong>{formatDate(proposal.valid_until)}</strong></div>
            )}
          </div>
        </header>

        <div className="propdoc__body">

          {/* Who it is for */}
          <section className="propdoc__section">
            <h2>Prepared for</h2>
            <dl className="propdoc__facts">
              <div className="propdoc__fact">
                <dt>Client</dt>
                <dd>{details.contact_info?.name || "—"}</dd>
              </div>
              {details.contact_info?.company && (
                <div className="propdoc__fact">
                  <dt>Company</dt>
                  <dd>{details.contact_info.company}</dd>
                </div>
              )}
              <div className="propdoc__fact">
                <dt>Phone</dt>
                <dd>{details.contact_info?.phone || "—"}</dd>
              </div>
              {details.contact_info?.email && (
                <div className="propdoc__fact">
                  <dt>Email</dt>
                  <dd>{details.contact_info.email}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Overview */}
          {proposal.overview && (
            <section className="propdoc__section">
              <h2>Overview</h2>
              <p className="propdoc__lead">{proposal.overview}</p>
            </section>
          )}

          {/* The event */}
          <section className="propdoc__section">
            <h2>Your event</h2>
            <dl className="propdoc__facts">
              <div className="propdoc__fact">
                <dt>Occasion</dt>
                <dd>{details.event_type || "—"}</dd>
              </div>
              <div className="propdoc__fact">
                <dt>Date</dt>
                <dd>{formatDate(details.event_date)}</dd>
              </div>
              <div className="propdoc__fact">
                <dt>Timing</dt>
                <dd>
                  {details.start_time || "—"}
                  {details.end_time ? ` – ${details.end_time}` : ""}
                </dd>
              </div>
              <div className="propdoc__fact">
                <dt>Venue</dt>
                <dd>{details.venue || "—"}</dd>
              </div>
              <div className="propdoc__fact">
                <dt>Guests</dt>
                <dd>{details.guest_count || 0}</dd>
              </div>
              {event.menu_template?.template_id?.templateName && (
                <div className="propdoc__fact">
                  <dt>Menu card design</dt>
                  <dd>{event.menu_template.template_id.templateName}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Menu */}
          {Object.keys(menuCategories).length > 0 && (
            <section className="propdoc__section">
              <h2>Your menu</h2>
              <div className="propdoc__menu">
                {Object.entries(menuCategories).map(([category, dishes]) => (
                  <div className="propdoc__menu-cat" key={category}>
                    <h3>{category}</h3>
                    <ul>
                      {dishes.map((dish, i) => (
                        <li key={i}>
                          <span
                            className={dish.is_veg ? "propdoc__veg" : "propdoc__nonveg"}
                            aria-label={dish.is_veg ? "Vegetarian" : "Non-vegetarian"}
                          />
                          {dish.name}
                          {dish.notes && (
                            <span className="propdoc__dish-note">{dish.notes}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Service & crew */}
          {(event.operations?.crew_list?.length > 0 || event.operations?.notes || opsImages.length > 0) && (
            <section className="propdoc__section">
              <h2>Service &amp; crew</h2>

              {event.operations?.crew_list?.length > 0 && (
                <div className="sc-table-wrap">
                  <table className="propdoc__table">
                    <thead>
                      <tr>
                        <th>Role</th>
                        <th>Name</th>
                        <th>Contact</th>
                      </tr>
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
              )}

              {event.operations?.notes && (
                <div className="propdoc__terms" style={{ marginTop: "1rem" }}>
                  <h3>Notes</h3>
                  <p>{event.operations.notes}</p>
                </div>
              )}

              {opsImages.length > 0 && (
                <div className="propdoc__gallery" style={{ marginTop: "1rem" }}>
                  {opsImages.map((img, i) => (
                    <img key={i} src={imageUrl(img.original_url)} alt="Venue and setup reference" />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Decor */}
          {(decorImages.length > 0 || event.decor?.estimated_price > 0) && (
            <section className="propdoc__section">
              <h2>Decor</h2>
              {event.decor?.estimated_price > 0 && (
                <p className="propdoc__lead" style={{ marginBottom: "1rem" }}>
                  Estimated decor package: <strong>{formatCurrency(event.decor.estimated_price)}</strong>
                </p>
              )}
              {decorImages.length > 0 && (
                <div className="propdoc__gallery">
                  {decorImages.map((img, i) => (
                    <img key={i} src={imageUrl(img.original_url)} alt="Decor reference" />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Investment */}
          <section className="propdoc__section">
            <h2>Investment</h2>

            <div className="sc-table-wrap">
              <table className="propdoc__table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Qty</th>
                    <th className="num">Rate</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {commercials.map((c, i) => (
                    <tr key={`c-${i}`}>
                      <td>{c.item}</td>
                      <td className="num">{c.qty || 1}</td>
                      <td className="num">{formatCurrency(c.cost)}</td>
                      <td className="num">{formatCurrency((Number(c.cost) || 0) * (Number(c.qty) || 1))}</td>
                    </tr>
                  ))}

                  {extras.map((e, i) => (
                    <tr key={`e-${i}`}>
                      <td>
                        {e.name}
                        {e.description && <span className="propdoc__extra-desc">{e.description}</span>}
                      </td>
                      <td className="num">1</td>
                      <td className="num">{formatCurrency(e.price)}</td>
                      <td className="num">{formatCurrency(e.price)}</td>
                    </tr>
                  ))}

                  {commercials.length === 0 && extras.length === 0 && (
                    <tr>
                      <td colSpan="4">No commercial line items were added.</td>
                    </tr>
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <td colSpan="3" className="num">Subtotal</td>
                    <td className="num">{formatCurrency(proposal.subtotal)}</td>
                  </tr>
                  {proposal.tax_percent > 0 && (
                    <tr>
                      <td colSpan="3" className="num">Tax ({proposal.tax_percent}%)</td>
                      <td className="num">{formatCurrency(proposal.tax_amount)}</td>
                    </tr>
                  )}
                  <tr className="grand">
                    <td colSpan="3" className="num">Total</td>
                    <td className="num">{formatCurrency(proposal.total)}</td>
                  </tr>
                  {details.guest_count > 0 && (
                    <tr>
                      <td colSpan="3" className="num" style={{ fontWeight: 400, color: "#7b8794" }}>
                        Per guest
                      </td>
                      <td className="num" style={{ fontWeight: 400, color: "#7b8794" }}>
                        {formatCurrency((proposal.total || 0) / details.guest_count)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </section>

          {/* Terms */}
          {(proposal.payment_terms || proposal.terms_notes) && (
            <section className="propdoc__section">
              <h2>Terms</h2>

              {proposal.payment_terms && (
                <div className="propdoc__terms">
                  <h3>Payment</h3>
                  <p>{proposal.payment_terms}</p>
                </div>
              )}

              {proposal.terms_notes && (
                <div className="propdoc__terms">
                  <h3>Additional notes</h3>
                  <p>{proposal.terms_notes}</p>
                </div>
              )}
            </section>
          )}

        </div>

        <footer className="propdoc__footer">
          <strong>Social Catering</strong> — thank you for the opportunity.
          {proposal.valid_until && ` This quote is valid until ${formatDate(proposal.valid_until)}.`}
        </footer>
      </article>
    </div>
  );
}
