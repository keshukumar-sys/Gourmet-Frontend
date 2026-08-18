import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api, { errorMessage, isAdmin, imageUrl } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";
import { formatCurrency, formatDate } from "./format";
import { collectEntryImages } from "./EntryFields";
import WhatsAppShare from "./WhatsAppShare";
import { STATUS_LABELS } from "./eventShape";
import "./Proposal.css";
import "./EntryFields.css";

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
  const [reviewing, setReviewing] = useState(false);

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

  const operations = event?.operations || {};
  const decor = event?.decor || {};
  const approvals = event?.approvals || {};
  const estimate = data?.estimate;
  const admin = isAdmin();

  // Older events kept their uploads in one flat list; newer ones hang them off
  // the individual entries. Show both so nothing silently disappears.
  const opsImages = [
    ...(event?.images || []).filter((i) => i.section === "operations").map((i) => i.original_url),
    ...collectEntryImages(
      operations.crew_list || [],
      operations.locations || [],
      operations.crockery || [],
      operations.notes_references || []
    )
  ];

  const decorImages = [
    ...(event?.images || []).filter((i) => i.section === "decor").map((i) => i.original_url),
    ...collectEntryImages(decor.locations || [], decor.elements || [])
  ];

  /**
   * Record an approval decision. The review endpoints return an unpopulated
   * event, so only the fields they actually change are merged in — replacing
   * the whole object would drop the populated menu and template.
   */
  const submitReview = async (who, decision) => {
    let note = "";

    if (decision === "reject") {
      const reason = window.prompt("Add a note explaining the rejection (optional):", "");
      if (reason === null) return; // cancelled
      note = reason;
    }

    setReviewing(true);
    try {
      const res = await api.put(`/events/${eventId}/review/${who}`, { decision, note });

      if (res.data.success) {
        const updated = res.data.event;
        setData((prev) => ({
          ...prev,
          event: { ...prev.event, status: updated.status, approvals: updated.approvals }
        }));
        toast.success(decision === "approve" ? "Proposal approved." : "Proposal rejected.");
      }
    } catch (err) {
      toast.error(errorMessage(err, "Could not record the decision"));
    } finally {
      setReviewing(false);
    }
  };

  /**
   * Render the document to a paginated A4 PDF.
   *
   * Shared by the download button and the WhatsApp hand-off so both send the
   * client exactly the same file.
   */
  const buildPdf = async () => {
    if (!docRef.current) throw new Error("The proposal is not ready yet.");

    const canvas = await html2canvas(docRef.current, {
      scale: 3,
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

    pdf.addImage(imgData, "PNG", 0, position, pageW, imgH, undefined, "FAST");
    remaining -= pageH;

    while (remaining > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageW, imgH, undefined, "FAST");
      remaining -= pageH;
    }

    return pdf;
  };

  const pdfFileName = () => {
    const client = (details.contact_info?.name || "Client").replace(/\s+/g, "_");
    return `Proposal_${client}_${proposalRef}.pdf`;
  };

  const downloadPDF = async () => {
    setDownloading(true);

    try {
      const pdf = await buildPdf();
      pdf.save(pdfFileName());
      toast.success("Proposal downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate the PDF.");
    } finally {
      setDownloading(false);
    }
  };

  /** The same PDF, as a blob the share dialog can upload. */
  const buildPdfBlob = async () => (await buildPdf()).output("blob");

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
          <WhatsAppShare
            eventId={eventId}
            docType="proposal"
            defaultNumber={details.contact_info?.phone}
            defaultMessage={whatsappMessage(details, proposalRef)}
            buildPdf={buildPdfBlob}
          />
          <button className="sc-btn sc-btn--accent" onClick={finishFlow} disabled={finishing}>
            Done
          </button>
        </div>
      </div>

      <div className="propview-review">
        <div className="propview-review__status">
          <span className="sc-badge">{STATUS_LABELS[event.status] || event.status}</span>

          {approvals.admin?.decision && approvals.admin.decision !== "pending" && (
            <p className="propview-review__note">
              Admin {approvals.admin.decision}
              {approvals.admin.by_name ? ` by ${approvals.admin.by_name}` : ""}
              {approvals.admin.at ? ` on ${formatDate(approvals.admin.at)}` : ""}
              {approvals.admin.note ? ` — "${approvals.admin.note}"` : ""}
            </p>
          )}

          {approvals.client?.decision && approvals.client.decision !== "pending" && (
            <p className="propview-review__note">
              Client {approvals.client.decision}
              {approvals.client.at ? ` on ${formatDate(approvals.client.at)}` : ""}
              {approvals.client.note ? ` — "${approvals.client.note}"` : ""}
            </p>
          )}
        </div>

        <div className="propview-review__actions">
          {admin ? (
            <>
              <button
                className="sc-btn sc-btn--sm"
                onClick={() => submitReview("admin", "approve")}
                disabled={reviewing || approvals.admin?.decision === "approved"}
              >
                Approve as admin
              </button>
              <button
                className="sc-btn sc-btn--danger sc-btn--sm"
                onClick={() => submitReview("admin", "reject")}
                disabled={reviewing || approvals.admin?.decision === "rejected"}
              >
                Reject
              </button>
            </>
          ) : approvals.admin?.decision === "approved" ? (
            <>
              <button
                className="sc-btn sc-btn--sm"
                onClick={() => submitReview("client", "approve")}
                disabled={reviewing || approvals.client?.decision === "approved"}
              >
                Client approved
              </button>
              <button
                className="sc-btn sc-btn--danger sc-btn--sm"
                onClick={() => submitReview("client", "reject")}
                disabled={reviewing || approvals.client?.decision === "rejected"}
              >
                Client rejected
              </button>
            </>
          ) : (
            <span className="propview-review__note">
              {approvals.admin?.decision === "rejected"
                ? "Rejected by admin — edit the proposal and resubmit."
                : "Waiting on admin approval before this can go to the client."}
            </span>
          )}
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
              <div className="propdoc__fact">
                <dt>Prepared by</dt>
                <dd>{event.created_by?.name || event.user_id?.name || "—"}</dd>
              </div>
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
          {(operations.crew_list?.length > 0 ||
            operations.locations?.length > 0 ||
            operations.crockery?.length > 0 ||
            operations.notes_references?.length > 0 ||
            operations.notes ||
            opsImages.length > 0) && (
              <section className="propdoc__section">
                <h2>Service &amp; crew</h2>

                {operations.crew_list?.length > 0 && (
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
                        {operations.crew_list.map((crew, i) => (
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

                <EntryLines title="Locations" entries={operations.locations} />
                <EntryLines title="Crockery & cutlery" entries={operations.crockery} />

                {operations.notes_references?.length > 0 && (
                  <div className="propdoc__terms" style={{ marginTop: "1rem" }}>
                    <h3>Notes &amp; references</h3>
                    {operations.notes_references.map((row, i) => (
                      <p key={i}>
                        {row.note}
                        {row.reference && <em> ({row.reference})</em>}
                      </p>
                    ))}
                  </div>
                )}

                {operations.notes && (
                  <div className="propdoc__terms" style={{ marginTop: "1rem" }}>
                    <h3>Notes</h3>
                    <p>{operations.notes}</p>
                  </div>
                )}

                {opsImages.length > 0 && (
                  <div className="propdoc__gallery" style={{ marginTop: "1rem" }}>
                    {opsImages.map((url, i) => (
                      <img key={`${url}-${i}`} src={imageUrl(url)} alt="Venue and setup reference" />
                    ))}
                  </div>
                )}
              </section>
            )}

          {/* Decor */}
          {(decorImages.length > 0 ||
            decor.estimated_price > 0 ||
            decor.locations?.length > 0 ||
            decor.elements?.length > 0 ||
            decor.additional_info) && (
              <section className="propdoc__section">
                <h2>Decor</h2>

                {decor.estimated_price > 0 && (
                  <p className="propdoc__lead" style={{ marginBottom: "1rem" }}>
                    Estimated decor package: <strong>{formatCurrency(decor.estimated_price)}</strong>
                  </p>
                )}

                <EntryLines title="Locations" entries={decor.locations} showPrice />
                <EntryLines title="Flowers & elements" entries={decor.elements} showPrice />

                {decor.additional_info && (
                  <div className="propdoc__terms" style={{ marginTop: "1rem" }}>
                    <h3>Additional information</h3>
                    <p>{decor.additional_info}</p>
                  </div>
                )}

                {decorImages.length > 0 && (
                  <div className="propdoc__gallery">
                    {decorImages.map((url, i) => (
                      <img key={`${url}-${i}`} src={imageUrl(url)} alt="Decor reference" />
                    ))}
                  </div>
                )}
              </section>
            )}

          {/* Investment */}
          <section className="propdoc__section">
            <h2>Investment</h2>

            {proposal.service_style && (
              <p className="propdoc__lead" style={{ marginBottom: "1rem" }}>
                Service style: <strong>{proposal.service_style}</strong>
              </p>
            )}

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
                  {proposal.special_price > 0 ? (
                    <>
                      <tr>
                        <td colSpan="3" className="num">List price</td>
                        <td className="num">{formatCurrency(proposal.list_subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="num">Special price</td>
                        <td className="num">{formatCurrency(proposal.subtotal)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="3" className="num">Subtotal</td>
                      <td className="num">{formatCurrency(proposal.subtotal)}</td>
                    </tr>
                  )}
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

            {proposal.service_inclusions && (
              <div className="propdoc__terms" style={{ marginTop: "1rem" }}>
                <h3>Service inclusions</h3>
                <p>{proposal.service_inclusions}</p>
              </div>
            )}
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

          {/* The decor-and-operations estimate, restated as the client sees it */}
          {estimate?.total > 0 && (
            <section className="estimate-box">
              <p className="estimate-box__label">Estimated Price</p>
              <p className="estimate-box__value">{formatCurrency(estimate.total)}</p>
              <p className="estimate-box__note">
                *This Pricing is an average cost for decor and operations only.
              </p>
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

/** Print one of the repeatable operations/decor lists as document copy. */
function EntryLines({ title, entries, showPrice = false }) {
  if (!entries?.length) return null;

  return (
    <div className="propdoc__terms" style={{ marginTop: "1rem" }}>
      <h3>{title}</h3>
      <ul>
        {entries.map((row, i) => (
          <li key={i}>
            <strong>{row.name || "Untitled"}</strong>
            {showPrice && Number(row.price) > 0 && ` — ${formatCurrency(row.price)}`}
            {row.notes && <span className="propdoc__extra-desc">{row.notes}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Opening line for the WhatsApp message, built from the event facts. */
function whatsappMessage(details, ref) {
  const name = details.contact_info?.name;
  const occasion = details.event_type;
  const when = details.event_date ? formatDate(details.event_date) : "";

  const greeting = name ? `Hi ${name},` : "Hello,";
  const about = occasion
    ? `here is the proposal for your ${occasion}${when ? ` on ${when}` : ""}.`
    : "here is your event proposal.";

  return `${greeting} ${about}\n\nSocial Catering — ref ${ref}`;
}
