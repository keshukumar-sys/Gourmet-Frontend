/**
 * The API returns events in the nested schema shape; the list screens want a
 * flat row. Mapping in one place keeps Events and AllEvents in agreement.
 */
export function toRow(event) {
  const details = event.details || {};

  const selectedMenu = {};
  const menuNotes = {};

  (event.menu_selection?.menus || []).forEach((entry) => {
    const dish = entry.menu_id;
    if (!dish) return;

    const category = dish.category || "General";
    (selectedMenu[category] ||= []).push(dish.dishName);
    if (entry.notes) menuNotes[dish.dishName] = entry.notes;
  });

  const template = event.menu_template?.template_id;

  return {
    _id: event._id,
    status: event.status,
    currentStep: event.current_step,
    eventname: details.event_type || "Untitled event",
    username: details.contact_info?.name || "",
    email: details.contact_info?.email || "",
    mobnumber: details.contact_info?.phone || "",
    eventdate: details.event_date ? new Date(details.event_date).toISOString().split("T")[0] : "",
    guest: details.guest_count || 0,
    startTime: details.start_time || "",
    endTime: details.end_time || "",
    venue: details.venue || "",
    manager: event.user_id?.name || "",
    selectedMenu,
    menuNotes,
    beverageNotes: event.menu_selection?.beverage_notes || "",
    templateName: template?.templateName || "",
    templateImage: template?.previewImage || "",
    operations: event.operations || {},
    decor: event.decor || {},
    proposal: event.proposal || {},
    images: event.images || [],
    raw: event
  };
}

/** Upcoming first (soonest to furthest), then past events newest first. */
export function sortByRelevance(rows) {
  const now = Date.now();

  return [...rows].sort((a, b) => {
    const ta = a.eventdate ? new Date(a.eventdate).getTime() : 0;
    const tb = b.eventdate ? new Date(b.eventdate).getTime() : 0;

    const aPast = ta < now;
    const bPast = tb < now;

    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast ? tb - ta : ta - tb;
  });
}

export const STATUS_LABELS = {
  draft: "Draft",
  pending_admin: "Pending approval",
  approved_by_admin: "Approved",
  sent_to_client: "Sent to client",
  approved_by_client: "Client approved"
};
