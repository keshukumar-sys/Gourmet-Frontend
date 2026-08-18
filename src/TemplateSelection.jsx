import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { errorMessage, isAdmin, imageUrl } from "./api";
import { useToast } from "./Toast";
import Stepper from "./Stepper";
import "./templateSelection.css";

import template1 from "./assets/template1.jpg";
import template2 from "./assets/template2.jpg";

const HEADING_FONTS = [
  { value: "SilkSerif", label: "Silk Serif" },
  { value: "Cormorant2", label: "Cormorant" }
];

const ITEM_FONTS = [
  { value: "Monsterrat", label: "Montserrat" },
  { value: "Futura", label: "Futura" }
];

// Shipped fallbacks, used only when the templates collection is empty.
const FALLBACK_TEMPLATES = [
  { _id: "template1", templateName: "Classic Gold", previewImage: template1, defaultTextColor: "#d4af37" },
  { _id: "template2", templateName: "Modern Minimal", previewImage: template2, defaultTextColor: "#333333" }
];

export default function TemplateSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const eventId = location.state?.eventId || sessionStorage.getItem("currentEventId");
  const editMode = location.state?.editMode || false;

  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState("");
  const [menuByCategory, setMenuByCategory] = useState({});
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  const saved = JSON.parse(sessionStorage.getItem("templateSettings") || "{}");
  const [headingSize, setHeadingSize] = useState(saved.headingsize || 30);
  const [headingFont, setHeadingFont] = useState(saved.headingfont || "SilkSerif");
  const [itemSize, setItemSize] = useState(saved.fontsize || 16);
  const [itemFont, setItemFont] = useState(saved.font || "Monsterrat");

  useEffect(() => {
    if (!eventId) navigate("/events", { replace: true });
  }, [eventId, navigate]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [tplRes, eventRes] = await Promise.all([
          api.get("/templates"),
          eventId ? api.get(`/events/${eventId}`) : Promise.resolve(null)
        ]);

        if (cancelled) return;

        const fetched = tplRes.data?.success ? tplRes.data.templates : [];
        const list = fetched.length ? fetched : FALLBACK_TEMPLATES;
        setTemplates(list);

        // Rebuild the menu preview from the event itself — the source of truth.
        const event = eventRes?.data?.event;
        if (event) {
          const grouped = {};
          (event.menu_selection?.menus || []).forEach((entry) => {
            const dish = entry.menu_id;
            if (!dish) return;
            (grouped[dish.category || "General"] ||= []).push(dish.dishName);
          });
          setMenuByCategory(grouped);
        }

        const already = event?.menu_template?.template_id;
        const alreadyId = already?._id || already;

        setTemplate(
          (alreadyId && list.some((t) => String(t._id) === String(alreadyId)) && String(alreadyId)) ||
          (saved.template && list.some((t) => String(t._id) === String(saved.template)) && String(saved.template)) ||
          String(list[0]?._id || "")
        );
      } catch (err) {
        if (!cancelled) toast.error(errorMessage(err, "Could not load templates"));
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Persist the styling choices so a refresh keeps the preview intact.
  useEffect(() => {
    sessionStorage.setItem(
      "templateSettings",
      JSON.stringify({
        template,
        headingsize: headingSize,
        headingfont: headingFont,
        fontsize: itemSize,
        font: itemFont
      })
    );
  }, [template, headingSize, headingFont, itemSize, itemFont]);

  const currentTemplate = useMemo(
    () => templates.find((t) => String(t._id) === String(template)) || null,
    [templates, template]
  );

  const cycle = (list, current, direction, getId = (x) => x) => {
    const ids = list.map(getId);
    const i = ids.indexOf(current);
    const next = (i + direction + ids.length) % ids.length;
    return ids[next];
  };

  const saveTemplate = async () => {
    // Fallback ids are not real ObjectIds — don't try to persist them.
    const isPersistable = /^[a-f\d]{24}$/i.test(String(template));
    if (!isPersistable) return;
    await api.put(`/events/${eventId}/menu-template`, { template_id: template });
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      await saveTemplate();
      navigate("/summary", { state: { ...location.state, eventId } });
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the template"));
      setLoading(false);
    }
  };

  const handleUpdateOnly = async () => {
    setLoading(true);
    try {
      await saveTemplate();
      toast.success("Menu and template updated.");

      ["bookingData", "selectedMenus", "menuNotes", "templateSettings",
       "templateHTML", "eventFlowId", "bookingInProgress", "editMode"]
        .forEach((k) => sessionStorage.removeItem(k));

      navigate(isAdmin() ? "/allEvents" : "/events");
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the template"));
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="sc-page">
        <Stepper current={5} eventId={eventId} />
        <div className="sc-shell">
          <div className="sc-loading">
            <div className="sc-spinner" />
            <p>Loading templates…</p>
          </div>
        </div>
      </div>
    );
  }

  const categories = Object.entries(menuByCategory);

  return (
    <div className="sc-page">
      <Stepper current={5} eventId={eventId} />

      <div className="sc-shell sc-shell--wide sc-fade-in">
        <div className="sc-page-head">
          <h1>Menu Card Design</h1>
          <p>Choose a template and set the type — the preview updates as you go.</p>
        </div>

        <div className="tpl-layout">

          {/* Controls */}
          <aside className="sc-card tpl-controls">
            <h2 className="sc-section-title">Template</h2>

            <div className="tpl-carousel">
              <button
                type="button"
                className="tpl-arrow"
                onClick={() => setTemplate(cycle(templates, template, -1, (t) => String(t._id)))}
                aria-label="Previous template"
              >
                ❮
              </button>

              <div className="tpl-preview">
                {currentTemplate?.previewImage && (
                  <img src={imageUrl(currentTemplate.previewImage)} alt={currentTemplate.templateName} />
                )}
                <p>{currentTemplate?.templateName || "—"}</p>
              </div>

              <button
                type="button"
                className="tpl-arrow"
                onClick={() => setTemplate(cycle(templates, template, 1, (t) => String(t._id)))}
                aria-label="Next template"
              >
                ❯
              </button>
            </div>

            <h2 className="sc-section-title" style={{ marginTop: "1.75rem" }}>Headings</h2>

            <div className="sc-field">
              <label htmlFor="heading-size">Size — {headingSize}px</label>
              <input
                id="heading-size"
                type="range"
                min="24"
                max="48"
                value={headingSize}
                onChange={(e) => setHeadingSize(Number(e.target.value))}
              />
            </div>

            <div className="tpl-carousel tpl-carousel--font">
              <button
                type="button"
                className="tpl-arrow"
                onClick={() => setHeadingFont(cycle(HEADING_FONTS, headingFont, -1, (f) => f.value))}
                aria-label="Previous heading font"
              >
                ❮
              </button>
              <span className="tpl-font-name" style={{ fontFamily: headingFont }}>
                {HEADING_FONTS.find((f) => f.value === headingFont)?.label}
              </span>
              <button
                type="button"
                className="tpl-arrow"
                onClick={() => setHeadingFont(cycle(HEADING_FONTS, headingFont, 1, (f) => f.value))}
                aria-label="Next heading font"
              >
                ❯
              </button>
            </div>

            <h2 className="sc-section-title" style={{ marginTop: "1.75rem" }}>Dishes</h2>

            <div className="sc-field">
              <label htmlFor="item-size">Size — {itemSize}px</label>
              <input
                id="item-size"
                type="range"
                min="12"
                max="28"
                value={itemSize}
                onChange={(e) => setItemSize(Number(e.target.value))}
              />
            </div>

            <div className="tpl-carousel tpl-carousel--font">
              <button
                type="button"
                className="tpl-arrow"
                onClick={() => setItemFont(cycle(ITEM_FONTS, itemFont, -1, (f) => f.value))}
                aria-label="Previous dish font"
              >
                ❮
              </button>
              <span className="tpl-font-name" style={{ fontFamily: itemFont }}>
                {ITEM_FONTS.find((f) => f.value === itemFont)?.label}
              </span>
              <button
                type="button"
                className="tpl-arrow"
                onClick={() => setItemFont(cycle(ITEM_FONTS, itemFont, 1, (f) => f.value))}
                aria-label="Next dish font"
              >
                ❯
              </button>
            </div>
          </aside>

          {/* Live preview */}
          <div className="tpl-stage">
            {categories.length === 0 ? (
              <div className="sc-card sc-empty">
                <h3>No dishes selected</h3>
                <p>Go back a step and pick the menu first.</p>
              </div>
            ) : (
              <div className="tpl-cards">
                {categories.map(([category, items]) => (
                  <div
                    key={category}
                    className="tpl-card"
                    style={{
                      backgroundImage: currentTemplate?.previewImage
                        ? `url(${imageUrl(currentTemplate.previewImage)})`
                        : "none"
                    }}
                  >
                    <div className="tpl-card__content">
                      <h3
                        style={{
                          color: currentTemplate?.defaultTextColor,
                          fontSize: `${headingSize}px`,
                          fontFamily: headingFont
                        }}
                      >
                        {category}
                      </h3>

                      {items.map((item, i) => (
                        <p
                          key={i}
                          style={{
                            color: currentTemplate?.defaultTextColor,
                            fontSize: `${itemSize}px`,
                            fontFamily: itemFont
                          }}
                        >
                          • {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sc-actions">
          <button
            className="sc-btn sc-btn--ghost"
            onClick={() => navigate("/decor", { state: { ...location.state, eventId } })}
            disabled={loading}
          >
            ← Back
          </button>

          <div className="sc-actions__group">
            {editMode && (
              <button className="sc-btn sc-btn--success" onClick={handleUpdateOnly} disabled={loading}>
                {loading ? "Updating…" : "Save & exit"}
              </button>
            )}
            <button className="sc-btn" onClick={handleNext} disabled={loading}>
              {loading ? "Saving…" : "Next: Summary →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
