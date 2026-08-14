import { useEffect } from "react";
import { imageUrl } from "./api";
import { formatCurrency, formatDate } from "./format";
import { STATUS_LABELS } from "./eventShape";
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

  const opsImages = row.images.filter((i) => i.section === "operations");
  const decorImages = row.images.filter((i) => i.section === "decor");
  const menuEntries = Object.entries(row.selectedMenu);

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
              <Fact label="Manager" value={row.manager} />
            </dl>
          </section>

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
            {row.operations?.crew_list?.length > 0 ? (
              <div className="sc-table-wrap">
                <table className="sc-table">
                  <thead><tr><th>Role</th><th>Name</th><th>Contact</th></tr></thead>
                  <tbody>
                    {row.operations.crew_list.map((c, i) => (
                      <tr key={i}>
                        <td>{c.role || "—"}</td>
                        <td>{c.name || "—"}</td>
                        <td>{c.contact || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sc-hint">No crew assigned.</p>
            )}

            {row.operations?.notes && <p className="ev-modal__notes">{row.operations.notes}</p>}
            <Gallery images={opsImages} />
          </section>

          <section>
            <h3 className="sc-section-title">Decor</h3>
            <p className="ev-modal__price">{formatCurrency(row.decor?.estimated_price)}</p>
            <Gallery images={decorImages} />
          </section>

          {row.proposal?.total > 0 && (
            <section>
              <h3 className="sc-section-title">Proposal</h3>
              <dl className="sc-datalist">
                <Fact label="Subtotal" value={formatCurrency(row.proposal.subtotal)} />
                <Fact label="Tax" value={formatCurrency(row.proposal.tax_amount)} />
                <Fact label="Total" value={formatCurrency(row.proposal.total)} />
                <Fact label="Valid until" value={formatDate(row.proposal.valid_until)} />
              </dl>
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
      {images.map((img, i) => (
        <img key={i} src={imageUrl(img.original_url)} alt="" />
      ))}
    </div>
  );
}
