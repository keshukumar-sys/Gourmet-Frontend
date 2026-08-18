import { useEffect } from "react";
import { imageUrl } from "./api";
import { formatCurrency, formatDate } from "./format";
import { STATUS_LABELS } from "./eventShape";
import { collectEntryImages } from "./EntryFields";
import "./EventDetailsModal.css";

/** Read-only detail view, shared by the rep and admin event lists. */
export default function EventDetailsModal({ row, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const ops = row.operations || {};
  const decor = row.decor || {};
  const menuEntries = Object.entries(row.selectedMenu);

  // Legacy flat uploads plus whatever hangs off the repeatable entries
  const opsImages = [
    ...row.images.filter((i) => i.section === "operations").map((i) => i.original_url),
    ...collectEntryImages(
      ops.crew_list || [],
      ops.locations || [],
      ops.crockery || [],
      ops.notes_references || []
    )
  ];

  const decorImages = [
    ...row.images.filter((i) => i.section === "decor").map((i) => i.original_url),
    ...collectEntryImages(decor.locations || [], decor.elements || [])
  ];

  return (
    <div className="ev-modal" role="dialog" aria-modal="true" aria-label="Event details" onClick={onClose}>
      <div className="ev-modal__panel" onClick={(e) => e.stopPropagation()}>

        <header className="ev-modal__head">
          <div>
            <h2>{row.eventname}</h2>
            <p>{row.username} · {formatDate(row.eventdate)}</p>
          </div>
          <button className="ev-modal__close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="ev-modal__body">

          <section>
            <h3 className="sc-section-title">Details</h3>
            <dl className="sc-datalist">
              <Fact label="Status" value={STATUS_LABELS[row.status] || row.status} />
              <Fact label="Client" value={row.username} />
              <Fact label="Mobile" value={row.mobnumber} />
              <Fact label="Email" value={row.email} />
              <Fact label="Guests" value={row.guest} />
              <Fact label="Start time" value={row.startTime} />
              <Fact label="End time" value={row.endTime} />
              <Fact label="Venue" value={row.venue} />
              <Fact label="Created by" value={row.createdBy} />
              <Fact label="Creator email" value={row.createdByEmail} />
            </dl>
          </section>

          {(row.approvals?.admin?.decision || row.approvals?.client?.decision) && (
            <section>
              <h3 className="sc-section-title">Approvals</h3>
              <dl className="sc-datalist">
                <Fact label="Admin" value={decisionText(row.approvals.admin)} />
                <Fact label="Client" value={decisionText(row.approvals.client)} />
              </dl>

              {row.approvals.admin?.note && (
                <p className="ev-modal__notes">Admin note: {row.approvals.admin.note}</p>
              )}
              {row.approvals.client?.note && (
                <p className="ev-modal__notes">Client note: {row.approvals.client.note}</p>
              )}
            </section>
          )}

          {menuEntries.length > 0 && (
            <section>
              <h3 className="sc-section-title">Menu</h3>
              <div className="ev-modal__menu">
                {menuEntries.map(([category, items]) => (
                  <div key={category} className="ev-modal__cat">
                    <h4>{category}</h4>
                    <ul>
                      {items.map((item, i) => (
                        <li key={i}>
                          {item}
                          {row.menuNotes[item] && (
                            <em className="ev-modal__note">{row.menuNotes[item]}</em>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {row.templateName && (
            <section>
              <h3 className="sc-section-title">Template</h3>
              <div className="ev-modal__template">
                {row.templateImage && <img src={imageUrl(row.templateImage)} alt={row.templateName} />}
                <span>{row.templateName}</span>
              </div>
            </section>
          )}

          <section>
            <h3 className="sc-section-title">Operations</h3>
            {ops.crew_list?.length > 0 ? (
              <div className="sc-table-wrap">
                <table className="sc-table">
                  <thead><tr><th>Role</th><th>Name</th><th>Contact</th><th>Notes</th></tr></thead>
                  <tbody>
                    {ops.crew_list.map((c, i) => (
                      <tr key={i}>
                        <td>{c.role || "—"}</td>
                        <td>{c.name || "—"}</td>
                        <td>{c.contact || "—"}</td>
                        <td>{c.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sc-hint">No crew assigned.</p>
            )}

            <EntryList title="Locations" entries={ops.locations} />
            <EntryList title="Crockery &amp; cutlery" entries={ops.crockery} />

            {ops.notes_references?.map((n, i) => (
              <p key={i} className="ev-modal__notes">
                {n.note}
                {n.reference && <em> ({n.reference})</em>}
              </p>
            ))}

            {ops.notes && <p className="ev-modal__notes">{ops.notes}</p>}
            <Gallery images={opsImages} />
          </section>

          <section>
            <h3 className="sc-section-title">Decor</h3>

            <EntryList title="Locations" entries={decor.locations} showPrice />
            <EntryList title="Flowers &amp; elements" entries={decor.elements} showPrice />

            <p className="ev-modal__price">{formatCurrency(decor.estimated_price)}</p>
            {decor.additional_info && <p className="ev-modal__notes">{decor.additional_info}</p>}

            <Gallery images={decorImages} />
          </section>

          {row.proposal?.total > 0 && (
            <section>
              <h3 className="sc-section-title">Proposal</h3>
              <dl className="sc-datalist">
                <Fact label="Service style" value={row.proposal.service_style} />
                <Fact label="Subtotal" value={formatCurrency(row.proposal.subtotal)} />
                <Fact label="Tax" value={formatCurrency(row.proposal.tax_amount)} />
                <Fact label="Total" value={formatCurrency(row.proposal.total)} />
                <Fact label="Valid until" value={formatDate(row.proposal.valid_until)} />
              </dl>

              {row.proposal.service_inclusions && (
                <p className="ev-modal__notes">
                  Inclusions: {row.proposal.service_inclusions}
                </p>
              )}
            </section>
          )}

        </div>

        <footer className="ev-modal__foot">
          <button className="sc-btn sc-btn--ghost" onClick={onClose}>Close</button>
        </footer>
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

function Gallery({ images }) {
  if (!images.length) return null;

  return (
    <div className="ev-modal__gallery">
      {images.map((url, i) => (
        <img key={`${url}-${i}`} src={imageUrl(url)} alt="" />
      ))}
    </div>
  );
}

/** Compact read-out of one repeatable operations/decor list. */
function EntryList({ title, entries, showPrice = false }) {
  if (!entries?.length) return null;

  return (
    <>
      <h4 className="ev-modal__subhead">{title}</h4>
      <ul className="ev-modal__entries">
        {entries.map((row, i) => (
          <li key={i}>
            <strong>{row.name || "Untitled"}</strong>
            {showPrice && Number(row.price) > 0 && ` — ${formatCurrency(row.price)}`}
            {row.notes && <em className="ev-modal__note">{row.notes}</em>}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Turns a stored decision into a readable line, or says it is still open. */
function decisionText(decision) {
  if (!decision?.decision || decision.decision === "pending") return "Not reviewed yet";

  const verb = decision.decision === "approved" ? "Approved" : "Rejected";
  const who = decision.by_name ? ` by ${decision.by_name}` : "";
  const when = decision.at ? ` on ${formatDate(decision.at)}` : "";

  return `${verb}${who}${when}`;
}
