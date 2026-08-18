import { useEffect, useMemo, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import EventDetailsModal from "./EventDetailsModal";
import { toRow, sortByRelevance, STATUS_LABELS, STATUS_TONE } from "./eventShape";
import { formatCurrency, formatDate } from "./format";
import "./Events.css";
import "./AllEvents.css";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Completed" },
  { id: "proposed", label: "With proposal" },
  { id: "pending", label: "Awaiting approval" }
];

export default function AllEvents() {
  const navigate = useNavigate();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [detailsFor, setDetailsFor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api.get("/events")
      .then((res) => {
        if (cancelled) return;
        setEvents(sortByRelevance((res.data || []).map(toRow)));
      })
      .catch((err) => {
        if (!cancelled) toast.error(errorMessage(err, "Could not load events"));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = Date.now();

    return events.filter((e) => {
      const time = e.eventdate ? new Date(e.eventdate).getTime() : 0;

      if (filter === "upcoming" && time < now) return false;
      if (filter === "past" && time >= now) return false;
      if (filter === "proposed" && !(e.proposal?.total > 0)) return false;
      if (filter === "pending" && e.status !== "pending_admin") return false;

      if (!term) return true;
      return [e.eventname, e.username, e.mobnumber, e.email, e.manager, e.createdBy, e.createdByEmail]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [events, search, filter]);

  /** Admin sign-off, straight from the list — no need to open the document. */
  const handleReview = async (row, decision) => {
    let note = "";

    if (decision === "reject") {
      const reason = window.prompt(`Why is "${row.eventname}" being rejected? (optional)`, "");
      if (reason === null) return; // cancelled
      note = reason;
    }

    setReviewingId(row._id);
    try {
      const res = await api.put(`/events/${row._id}/review/admin`, { decision, note });

      if (res.data.success) {
        const updated = res.data.event;
        setEvents((prev) => prev.map((e) =>
          e._id === row._id
            ? { ...e, status: updated.status, approvals: updated.approvals }
            : e
        ));
        toast.success(decision === "approve" ? "Proposal approved." : "Proposal rejected.");
      }
    } catch (err) {
      toast.error(errorMessage(err, "Could not record the decision"));
    } finally {
      setReviewingId(null);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Permanently delete "${row.eventname}"? This cannot be undone.`)) return;

    setDeletingId(row._id);
    try {
      const res = await api.delete(`/events/${row._id}`);
      if (res.data.success) {
        setEvents((prev) => prev.filter((e) => e._id !== row._id));
        toast.success("Event deleted.");
      } else {
        toast.error(res.data.message || "Could not delete the event");
      }
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the event"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="sc-page">
      <div className="sc-shell sc-shell--wide sc-fade-in">

        <div className="events-head">
          <div>
            <h1>All Events</h1>
            <p>{events.length} event{events.length === 1 ? "" : "s"} across the team</p>
          </div>

          <div className="allevents-admin-actions">
            <NavLink to="/addTemplate" className="sc-btn sc-btn--sm">Add template</NavLink>
          </div>
        </div>

        <div className="allevents-controls">
          <div className="sc-field">
            <label htmlFor="ae-search" className="sr-only">Search events</label>
            <input
              id="ae-search"
              type="search"
              placeholder="Search by event, client, phone, email or creator…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="allevents-filters" role="tablist" aria-label="Filter events">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                className={`allevents-filter ${filter === f.id ? "is-active" : ""}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="events-grid">
            {[0, 1, 2].map((i) => <div key={i} className="sc-skeleton" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="sc-card sc-empty">
            <h3>No events to show</h3>
            <p>{events.length === 0 ? "Nothing has been booked yet." : "Try another search or filter."}</p>
          </div>
        ) : (
          <div className="events-grid">
            {visible.map((row) => {
              const isPast = row.eventdate && new Date(row.eventdate) < new Date();
              const hasProposal = row.proposal?.total > 0;

              return (
                <article key={row._id} className={`event-card ${isPast ? "is-past" : ""}`}>
                  <header className="event-card__head">
                    <h2>{row.eventname}</h2>
                    <span className={`sc-badge ${isPast ? "" : "sc-badge--success"}`}>
                      {isPast ? "Completed" : "Upcoming"}
                    </span>
                  </header>

                  <dl className="event-card__facts">
                    <div><dt>Client</dt><dd>{row.username || "—"}</dd></div>
                    <div><dt>Date</dt><dd>{formatDate(row.eventdate)}</dd></div>
                    <div><dt>Guests</dt><dd>{row.guest}</dd></div>
                    <div><dt>Mobile</dt><dd>{row.mobnumber || "—"}</dd></div>
                    <div><dt>Created by</dt><dd>{row.createdBy || "—"}</dd></div>
                    <div>
                      <dt>Proposal</dt>
                      <dd>{hasProposal ? formatCurrency(row.proposal.total) : "Not created"}</dd>
                    </div>
                  </dl>

                  <footer className="event-card__actions">
                    <span className={`sc-badge ${STATUS_TONE[row.status] || ""}`}>
                      {STATUS_LABELS[row.status] || row.status}
                    </span>

                    <div className="event-card__buttons">
                      {hasProposal && (
                        <>
                          <button
                            className="sc-btn sc-btn--sm"
                            onClick={() => handleReview(row, "approve")}
                            disabled={reviewingId === row._id || row.approvals?.admin?.decision === "approved"}
                          >
                            Approve
                          </button>
                          <button
                            className="sc-btn sc-btn--danger sc-btn--sm"
                            onClick={() => handleReview(row, "reject")}
                            disabled={reviewingId === row._id || row.approvals?.admin?.decision === "rejected"}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      <button className="sc-btn sc-btn--ghost sc-btn--sm" onClick={() => setDetailsFor(row)}>
                        Details
                      </button>

                      <button
                        className="sc-btn sc-btn--ghost sc-btn--sm"
                        onClick={() => {
                          sessionStorage.setItem("currentEventId", row._id);
                          sessionStorage.setItem("editMode", "true");
                          sessionStorage.setItem("eventFlowId", crypto.randomUUID());
                          sessionStorage.setItem("bookingInProgress", "true");
                          navigate("/menuSelection", {
                            state: { eventId: row._id, editMode: true, userType: "admin" }
                          });
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="sc-btn sc-btn--sm"
                        onClick={() => navigate(
                          hasProposal ? `/proposal/${row._id}/view` : `/proposal/${row._id}`
                        )}
                      >
                        {hasProposal ? "Proposal" : "Create proposal"}
                      </button>

                      <button
                        className="sc-btn sc-btn--danger sc-btn--sm"
                        onClick={() => handleDelete(row)}
                        disabled={deletingId === row._id}
                      >
                        {deletingId === row._id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {detailsFor && (
        <EventDetailsModal row={detailsFor} onClose={() => setDetailsFor(null)} />
      )}
    </div>
  );
}
