import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import EventDetailsModal from "./EventDetailsModal";
import { toRow, sortByRelevance, STATUS_LABELS, STATUS_TONE } from "./eventShape";
import { formatDate } from "./format";
import "./Events.css";

export default function Events() {
  const navigate = useNavigate();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailsFor, setDetailsFor] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  const clearFlow = () => {
    ["bookingData", "selectedMenus", "menuNotes", "templateSettings",
     "templateHTML", "bookingInProgress", "eventFlowId", "currentEventId"]
      .forEach((k) => sessionStorage.removeItem(k));
  };

  useEffect(() => {
    // A stale half-finished flow shouldn't leak into a new booking.
    if (!sessionStorage.getItem("eventFlowId")) clearFlow();
  }, []);

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
    if (!term) return events;

    return events.filter((e) =>
      [e.eventname, e.username, e.mobnumber, e.venue]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [events, search]);

  const startNewEvent = () => {
    clearFlow();
    sessionStorage.setItem("editMode", "false");
    sessionStorage.setItem("eventFlowId", crypto.randomUUID());
    sessionStorage.setItem("bookingInProgress", "true");
    navigate("/booking");
  };

  /**
   * Once the admin has signed a proposal off, the rep records what the client
   * came back with. Before that the buttons are not offered at all.
   */
  const handleClientReview = async (row, decision) => {
    let note = "";

    if (decision === "reject") {
      const reason = window.prompt(`What did the client say about "${row.eventname}"? (optional)`, "");
      if (reason === null) return; // cancelled
      note = reason;
    }

    setReviewingId(row._id);
    try {
      const res = await api.put(`/events/${row._id}/review/client`, { decision, note });

      if (res.data.success) {
        const updated = res.data.event;
        setEvents((prev) => prev.map((e) =>
          e._id === row._id
            ? { ...e, status: updated.status, approvals: updated.approvals }
            : e
        ));
        toast.success(decision === "approve" ? "Marked as client approved." : "Marked as client rejected.");
      }
    } catch (err) {
      toast.error(errorMessage(err, "Could not record the decision"));
    } finally {
      setReviewingId(null);
    }
  };

  const resumeEvent = (row) => {
    clearFlow();
    sessionStorage.setItem("editMode", "true");
    sessionStorage.setItem("eventFlowId", crypto.randomUUID());
    sessionStorage.setItem("bookingInProgress", "true");
    sessionStorage.setItem("currentEventId", row._id);

    navigate("/menuSelection", {
      state: { eventId: row._id, editMode: true, userType: "user" }
    });
  };

  return (
    <div className="sc-page">
      <div className="sc-shell sc-shell--wide sc-fade-in">

        <div className="events-head">
          <div>
            <h1>Events</h1>
            <p>
              {events.length} event{events.length === 1 ? "" : "s"} you have created
            </p>
          </div>

          <button className="sc-btn sc-btn--accent" onClick={startNewEvent}>
            + New event
          </button>
        </div>

        <div className="sc-field events-search">
          <label htmlFor="events-search" className="sr-only">Search events</label>
          <input
            id="events-search"
            type="search"
            placeholder="Search by event, client, phone or venue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="events-grid">
            {[0, 1, 2].map((i) => <div key={i} className="sc-skeleton" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="sc-card sc-empty">
            <h3>{events.length === 0 ? "No events yet" : "Nothing matches"}</h3>
            <p>
              {events.length === 0
                ? "Create your first event to get started."
                : "Try a different search term."}
            </p>
            {events.length === 0 && (
              <button className="sc-btn" onClick={startNewEvent}>+ New event</button>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {visible.map((row) => {
              const isPast = row.eventdate && new Date(row.eventdate) < new Date();

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
                    <div>
                      <dt>Time</dt>
                      <dd>{row.startTime || "—"}{row.endTime ? ` – ${row.endTime}` : ""}</dd>
                    </div>
                    <div><dt>Mobile</dt><dd>{row.mobnumber || "—"}</dd></div>
                    <div><dt>Created by</dt><dd>{row.createdBy || "—"}</dd></div>
                  </dl>

                  <footer className="event-card__actions">
                    <span className={`sc-badge ${STATUS_TONE[row.status] || ""}`}>
                      {STATUS_LABELS[row.status] || row.status}
                    </span>

                    <div className="event-card__buttons">
                      {row.approvals?.admin?.decision === "approved" && (
                        <>
                          <button
                            className="sc-btn sc-btn--sm"
                            onClick={() => handleClientReview(row, "approve")}
                            disabled={reviewingId === row._id || row.approvals?.client?.decision === "approved"}
                          >
                            Client approved
                          </button>
                          <button
                            className="sc-btn sc-btn--danger sc-btn--sm"
                            onClick={() => handleClientReview(row, "reject")}
                            disabled={reviewingId === row._id || row.approvals?.client?.decision === "rejected"}
                          >
                            Client rejected
                          </button>
                        </>
                      )}

                      <button className="sc-btn sc-btn--ghost sc-btn--sm" onClick={() => setDetailsFor(row)}>
                        Details
                      </button>
                      <button className="sc-btn sc-btn--ghost sc-btn--sm" onClick={() => resumeEvent(row)}>
                        Edit
                      </button>
                      <button
                        className="sc-btn sc-btn--sm"
                        onClick={() => navigate(
                          row.proposal?.total > 0
                            ? `/proposal/${row._id}/view`
                            : `/proposal/${row._id}`
                        )}
                      >
                        {row.proposal?.total > 0 ? "Proposal" : "Create proposal"}
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
