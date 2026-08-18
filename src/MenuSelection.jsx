import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";
import { formatCurrency } from "./format";
import { courseFor, availableCourses } from "./courses";
import "./MenuSelection.css";

const PAGE_SIZE = 12;

export default function MenuSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [dishes, setDishes] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  const [course, setCourse] = useState("all");
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [dietFilter, setDietFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);

  /** { dishId: { notes } } — a flat map keeps selection state simple. */
  const [selected, setSelected] = useState({});

  const eventId = location.state?.eventId || sessionStorage.getItem("currentEventId");

  useEffect(() => {
    if (!eventId) navigate("/events", { replace: true });
  }, [eventId, navigate]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [menuRes, eventRes] = await Promise.all([
          api.get("/menu/all", { params: { limit: 1000 } }),
          eventId ? api.get(`/events/${eventId}`) : Promise.resolve(null)
        ]);

        if (cancelled) return;

        if (menuRes.data.success) setDishes(menuRes.data.menu || []);

        const existing = eventRes?.data?.event?.menu_selection?.menus || [];
        if (existing.length) {
          const restored = {};
          existing.forEach((entry) => {
            const id = entry.menu_id?._id || entry.menu_id;
            if (id) restored[id] = { notes: entry.notes || "" };
          });
          setSelected(restored);
        }
      } catch (err) {
        if (!cancelled) toast.error(errorMessage(err, "Could not load the menu"));
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const courses = useMemo(() => availableCourses(dishes), [dishes]);

  // Everything matching the course + dietary + search filters, before paging.
  const matching = useMemo(() => {
    const term = search.trim().toLowerCase();

    return dishes.filter((d) => {
      if (course !== "all" && courseFor(d.category) !== course) return false;
      if (dietFilter === "veg" && !d.isVeg) return false;
      if (dietFilter === "nonveg" && d.isVeg) return false;
      if (!term) return true;
      return (
        d.dishName?.toLowerCase().includes(term) ||
        d.category?.toLowerCase().includes(term)
      );
    });
  }, [dishes, course, dietFilter, search]);

  // Categories available inside the current course, with counts.
  const categories = useMemo(() => {
    const counts = {};
    matching.forEach((d) => {
      const c = d.category || "General";
      counts[c] ??= { name: c, total: 0, chosen: 0 };
      counts[c].total += 1;
      if (selected[d._id]) counts[c].chosen += 1;
    });
    return Object.values(counts).sort((a, b) => a.name.localeCompare(b.name));
  }, [matching, selected]);

  // Searching spans the whole course; otherwise we show one category at a time.
  const isSearching = search.trim().length > 0;

  const visibleDishes = useMemo(() => {
    if (isSearching) return matching;
    if (!activeCategory) return matching;
    return matching.filter((d) => (d.category || "General") === activeCategory);
  }, [matching, activeCategory, isSearching]);

  const totalPages = Math.max(1, Math.ceil(visibleDishes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageDishes = visibleDishes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Keep the active category valid as filters change, and reset paging.
  useEffect(() => {
    if (isSearching) return;
    const names = categories.map((c) => c.name);
    if (!names.length) {
      setActiveCategory(null);
    } else if (!activeCategory || !names.includes(activeCategory)) {
      setActiveCategory(names[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, isSearching]);

  useEffect(() => { setPage(1); }, [course, activeCategory, dietFilter, search]);

  const selectedIds = Object.keys(selected);
  const selectedDishes = useMemo(
    () => dishes.filter((d) => selected[d._id]),
    [dishes, selected]
  );
  const perPlate = useMemo(
    () => selectedDishes.reduce((sum, d) => sum + (d.price || 0), 0),
    [selectedDishes]
  );

  const toggleDish = (dish, checked) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[dish._id] = { notes: prev[dish._id]?.notes || "" };
      else delete next[dish._id];
      return next;
    });
  };

  const setNote = (dishId, notes) =>
    setSelected((prev) => ({ ...prev, [dishId]: { ...prev[dishId], notes } }));

  const clearCategory = () => {
    const ids = new Set(visibleDishes.map((d) => d._id));
    setSelected((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });
  };

  const handleNext = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one dish before continuing.");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/events/${eventId}/menu`, {
        menus: selectedIds.map((id) => ({
          menu_id: id,
          notes: selected[id]?.notes || "",
          selected_ingredients: []
        }))
      });

      navigate("/operations", {
        state: { ...location.state, eventId, editMode: location.state?.editMode || false }
      });
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the menu selection"));
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (location.state?.editMode) {
      navigate(location.state?.userType === "admin" ? "/allEvents" : "/events");
    } else {
      navigate("/booking", { state: { eventId } });
    }
  };

  if (fetching) {
    return (
      <div className="sc-page">
        <Stepper current={2} eventId={eventId} />
        <div className="sc-shell">
          <div className="sc-loading">
            <div className="sc-spinner" />
            <p>Loading the menu…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-page menu-page">
      <Stepper current={2} eventId={eventId} />

      <div className="sc-shell sc-shell--wide sc-fade-in">
        <div className="sc-page-head">
          <h1>Build the Menu</h1>
          <p>Pick a course, then choose dishes. Add a note wherever the kitchen needs one.</p>
        </div>

        {/* Course tabs */}
        <div className="menu-courses" role="tablist" aria-label="Course">
          {courses.map((c) => {
            const count =
              c.id === "all"
                ? selectedIds.length
                : selectedDishes.filter((d) => courseFor(d.category) === c.id).length;

            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={course === c.id}
                className={`menu-course ${course === c.id ? "is-active" : ""}`}
                onClick={() => setCourse(c.id)}
              >
                {c.label}
                {count > 0 && <span className="menu-course__count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Search + diet */}
        <div className="menu-toolbar">
          <div className="sc-field">
            <label htmlFor="menu-search" className="sr-only">Search dishes</label>
            <input
              id="menu-search"
              type="search"
              placeholder="Search all dishes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sc-field">
            <label htmlFor="menu-diet" className="sr-only">Dietary filter</label>
            <select id="menu-diet" value={dietFilter} onChange={(e) => setDietFilter(e.target.value)}>
              <option value="all">All dishes</option>
              <option value="veg">Vegetarian only</option>
              <option value="nonveg">Non-vegetarian only</option>
            </select>
          </div>
        </div>

        {matching.length === 0 ? (
          <div className="sc-card sc-empty">
            <h3>No dishes here</h3>
            <p>
              {dishes.length === 0
                ? "The catalogue is empty — an admin needs to add dishes first."
                : "Try another course, or clear the search and dietary filter."}
            </p>
          </div>
        ) : (
          <div className="menu-layout">

            {/* Category rail */}
            {!isSearching && (
              <aside className="menu-rail" aria-label="Categories">
                <h2 className="menu-rail__title">Categories</h2>
                <ul>
                  {categories.map((cat) => (
                    <li key={cat.name}>
                      <button
                        className={`menu-rail__item ${activeCategory === cat.name ? "is-active" : ""}`}
                        onClick={() => setActiveCategory(cat.name)}
                      >
                        <span className="menu-rail__name">{cat.name}</span>
                        <span className="menu-rail__meta">
                          {cat.chosen > 0 && (
                            <span className="menu-rail__chosen">{cat.chosen}</span>
                          )}
                          <span className="menu-rail__total">{cat.total}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            {/* Dish list */}
            <div className="menu-panel">
              <div className="menu-panel__head">
                <div>
                  <h2>{isSearching ? `Results for “${search.trim()}”` : activeCategory}</h2>
                  <p>
                    {visibleDishes.length} dish{visibleDishes.length === 1 ? "" : "es"}
                    {totalPages > 1 && ` · page ${currentPage} of ${totalPages}`}
                  </p>
                </div>

                {visibleDishes.some((d) => selected[d._id]) && (
                  <button className="sc-btn sc-btn--ghost sc-btn--sm" onClick={clearCategory}>
                    Clear these
                  </button>
                )}
              </div>

              <ul className="menu-list">
                {pageDishes.map((dish) => {
                  const isSelected = !!selected[dish._id];

                  return (
                    <li key={dish._id} className={`menu-row ${isSelected ? "is-selected" : ""}`}>
                      <label className="menu-row__main">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleDish(dish, e.target.checked)}
                        />
                        <span
                          className={dish.isVeg ? "menu-veg" : "menu-nonveg"}
                          aria-label={dish.isVeg ? "Vegetarian" : "Non-vegetarian"}
                        />
                        <span className="menu-row__text">
                          <span className="menu-row__name">{dish.dishName}</span>
                          {isSearching && (
                            <span className="menu-row__cat">{dish.category}</span>
                          )}
                        </span>
                        {dish.price > 0 && (
                          <span className="menu-row__price">{formatCurrency(dish.price)}</span>
                        )}
                      </label>

                      {isSelected && (
                        <textarea
                          className="menu-row__note"
                          rows="2"
                          placeholder="Special note for the kitchen…"
                          value={selected[dish._id]?.notes || ""}
                          onChange={(e) => setNote(dish._id, e.target.value)}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onChange={setPage}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky summary */}
      <div className="menu-bar">
        <div className="menu-bar__inner">
          <button
            className="menu-bar__stats"
            onClick={() => setReviewOpen(true)}
            disabled={selectedIds.length === 0}
          >
            <strong>{selectedIds.length}</strong> dish{selectedIds.length === 1 ? "" : "es"} selected
            {perPlate > 0 && <span className="menu-bar__price"> · {formatCurrency(perPlate)} per plate</span>}
            {selectedIds.length > 0 && <span className="menu-bar__review">Review</span>}
          </button>

          <div className="menu-bar__actions">
            <button className="sc-btn sc-btn--ghost" onClick={handleBack} disabled={loading}>
              ← Back
            </button>
            <button className="sc-btn" onClick={handleNext} disabled={loading || selectedIds.length === 0}>
              {loading ? "Saving…" : "Next: Template →"}
            </button>
          </div>
        </div>
      </div>

      {reviewOpen && (
        <ReviewDrawer
          dishes={selectedDishes}
          onRemove={(dish) => toggleDish(dish, false)}
          onClose={() => setReviewOpen(false)}
          perPlate={perPlate}
        />
      )}
    </div>
  );
}

/** Numbered pager that collapses to a window around the current page. */
function Pagination({ page, totalPages, onChange }) {
  const pages = [];
  const window = 1;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= window) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav className="menu-pager" aria-label="Dish pages">
      <button
        className="menu-pager__btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="menu-pager__gap">…</span>
        ) : (
          <button
            key={p}
            className={`menu-pager__btn ${p === page ? "is-active" : ""}`}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        className="menu-pager__btn"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  );
}

/** Everything picked so far, grouped by category, so nothing gets lost. */
function ReviewDrawer({ dishes, onRemove, onClose, perPlate }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const grouped = dishes.reduce((acc, d) => {
    (acc[d.category || "General"] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div className="menu-drawer" onClick={onClose}>
      <aside
        className="menu-drawer__panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Selected dishes"
      >
        <header className="menu-drawer__head">
          <div>
            <h2>Your selection</h2>
            <p>{dishes.length} dishes · {formatCurrency(perPlate)} per plate</p>
          </div>
          <button className="menu-drawer__close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="menu-drawer__body">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h3>{category}</h3>
              <ul>
                {items.map((d) => (
                  <li key={d._id}>
                    <span className={d.isVeg ? "menu-veg" : "menu-nonveg"} />
                    <span className="menu-drawer__name">{d.dishName}</span>
                    {d.price > 0 && <span className="menu-drawer__price">{formatCurrency(d.price)}</span>}
                    <button
                      className="menu-drawer__remove"
                      onClick={() => onRemove(d)}
                      aria-label={`Remove ${d.dishName}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="menu-drawer__foot">
          <button className="sc-btn sc-btn--block" onClick={onClose}>Done</button>
        </footer>
      </aside>
    </div>
  );
}
