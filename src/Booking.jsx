import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";
import { toInputDate } from "./format";

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const eventId = location.state?.eventId || sessionStorage.getItem("currentEventId");

  const isEditMode = sessionStorage.getItem("editMode") === "true";
  const savedData = isEditMode
    ? JSON.parse(sessionStorage.getItem("bookingData") || "{}")
    : {};

  const [username, setUsername] = useState(savedData.username || "");
  const [mobnumber, setNumber] = useState(savedData.mobnumber || "");
  const [email, setEmail] = useState(savedData.email || "");
  const [eventname, setEventname] = useState(savedData.eventname || "");
  const [eventdate, setEventdate] = useState(savedData.eventdate || "");
  const [guest, setGuest] = useState(savedData.guest || "");
  const [startTime, setStartTime] = useState(savedData.startTime || "");
  const [endTime, setEndTime] = useState(savedData.endTime || "");
  const [manager, setManager] = useState(savedData.manager || "");
  const [venue, setVenue] = useState(savedData.venue || "");
  const [requirements, setRequirements] = useState(savedData.requirements || "");
  const [loading, setLoading] = useState(false);

  // A booking must be started from the Events screen so a flow id exists —
  // unless we're revisiting step 1 of an event that already exists.
  useEffect(() => {
    const guard = () => {
      if (eventId) return;
      const flowId = sessionStorage.getItem("eventFlowId");
      const inProgress = sessionStorage.getItem("bookingInProgress");
      if (!inProgress || !flowId) navigate("/events", { replace: true });
    };

    guard();
    window.addEventListener("pageshow", guard);
    return () => window.removeEventListener("pageshow", guard);
  }, [navigate, eventId]);

  // Stepping back into step 1 should show what was actually saved, not a
  // stale session draft — so re-read the event when one already exists.
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    api.get(`/events/${eventId}`)
      .then((res) => {
        if (cancelled || !res.data.success) return;
        const d = res.data.event.details || {};

        setUsername(d.contact_info?.name || "");
        setNumber(d.contact_info?.phone || "");
        setEmail(d.contact_info?.email || "");
        setEventname(d.event_type || "");
        setEventdate(toInputDate(d.event_date));
        setGuest(d.guest_count ? String(d.guest_count) : "");
        setStartTime(d.start_time || "");
        setEndTime(d.end_time || "");
        setVenue(d.venue || "");
        setManager(res.data.event.user_id?.name || "");
      })
      .catch(() => { /* new booking — nothing saved yet */ });

    return () => { cancelled = true; };
  }, [eventId]);

  // Keep a local draft so a refresh mid-form isn't lost.
  useEffect(() => {
    sessionStorage.setItem(
      "bookingData",
      JSON.stringify({
        username, mobnumber, email, eventname, eventdate,
        guest, startTime, endTime, manager, venue, requirements
      })
    );
  }, [username, mobnumber, email, eventname, eventdate, guest, startTime, endTime, manager, venue, requirements]);

  const validate = () => {
    if (!username.trim()) return "Please enter the client's full name.";
    if (!/^\d{10}$/.test(mobnumber)) return "Please enter a valid 10-digit mobile number.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return "That email address doesn't look right.";
    if (!eventname.trim()) return "Please enter the event name.";
    if (!eventdate) return "Please select the event date.";
    if (!startTime) return "Please select a start time.";
    if (!endTime) return "Please select an end time.";
    if (startTime && endTime && endTime <= startTime) return "The end time must be after the start time.";
    if (!guest || Number(guest) <= 0) return "Guest count must be greater than zero.";
    if (!manager.trim()) return "Please enter the event manager's name.";
    return null;
  };

  const handleNext = async (e) => {
    e.preventDefault();

    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    const payload = {
      contact_info: {
        name: username.trim(),
        phone: mobnumber,
        email: email.trim()
      },
      event_type: eventname.trim(),
      event_date: eventdate,
      start_time: startTime,
      end_time: endTime,
      guest_count: Number(guest),
      venue: venue.trim() || requirements.trim() || "Nesco"
    };

    setLoading(true);
    try {
      let currentEventId = eventId;

      if (!currentEventId) {
        const createRes = await api.post("/events", {});
        currentEventId = createRes.data.event._id;
        sessionStorage.setItem("currentEventId", currentEventId);
      }

      await api.put(`/events/${currentEventId}/details`, payload);

      navigate("/menuSelection", { state: { eventId: currentEventId } });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sc-page">
      <Stepper current={1} eventId={eventId} />

      <div className="sc-shell sc-shell--narrow sc-fade-in">
        <div className="sc-page-head">
          <h1>Book Your Event</h1>
          <p>Start with the client and event basics — everything else builds on this.</p>
        </div>

        <form className="sc-card" onSubmit={handleNext} noValidate>
          <h2 className="sc-section-title">Client</h2>

          <div className="sc-grid">
            <div className="sc-field">
              <label htmlFor="b-name">Full name</label>
              <input
                id="b-name"
                type="text"
                placeholder="Client name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="sc-field">
              <label htmlFor="b-phone">Mobile number</label>
              <input
                id="b-phone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit number"
                value={mobnumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!/^\d*$/.test(value)) return;
                  setNumber(value.slice(0, 10));
                }}
              />
              {mobnumber.length > 0 && mobnumber.length < 10 && (
                <span className="sc-hint sc-hint--error">
                  {10 - mobnumber.length} more digit{10 - mobnumber.length > 1 ? "s" : ""} needed
                </span>
              )}
            </div>

            <div className="sc-field sc-span-2">
              <label htmlFor="b-email">Email <span style={{ textTransform: "none" }}>(optional)</span></label>
              <input
                id="b-email"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="sc-hint">Appears on the client proposal.</span>
            </div>
          </div>

          <h2 className="sc-section-title" style={{ marginTop: "2rem" }}>Event</h2>

          <div className="sc-grid">
            <div className="sc-field">
              <label htmlFor="b-event">Event name</label>
              <input
                id="b-event"
                type="text"
                placeholder="e.g. Sharma Wedding Reception"
                value={eventname}
                onChange={(e) => setEventname(e.target.value)}
              />
            </div>

            <div className="sc-field">
              <label htmlFor="b-date">Event date</label>
              <input
                id="b-date"
                type="date"
                value={eventdate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setEventdate(e.target.value)}
              />
            </div>

            <div className="sc-field">
              <label htmlFor="b-start">Start time</label>
              <input
                id="b-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="sc-field">
              <label htmlFor="b-end">End time</label>
              <input
                id="b-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="sc-field">
              <label htmlFor="b-guests">Number of guests</label>
              <input
                id="b-guests"
                type="number"
                min="1"
                placeholder="e.g. 150"
                value={guest}
                onChange={(e) => setGuest(e.target.value)}
              />
            </div>

            <div className="sc-field">
              <label htmlFor="b-manager">Event manager</label>
              <input
                id="b-manager"
                type="text"
                placeholder="Who is running this event"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
              />
            </div>

            <div className="sc-field sc-span-2">
              <label htmlFor="b-venue">Venue</label>
              <input
                id="b-venue"
                type="text"
                placeholder="Where the event takes place"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>

            <div className="sc-field sc-span-2">
              <label htmlFor="b-req">Additional requirements</label>
              <textarea
                id="b-req"
                rows="4"
                maxLength="500"
                placeholder="Any special requests…"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
              <span className="sc-counter">{requirements.length}/500</span>
            </div>
          </div>

          <div className="sc-actions">
            <button
              type="button"
              className="sc-btn sc-btn--ghost"
              onClick={() => navigate("/events")}
              disabled={loading}
            >
              ← Back
            </button>
            <button type="submit" className="sc-btn" disabled={loading}>
              {loading ? "Saving…" : "Next: Menu →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
