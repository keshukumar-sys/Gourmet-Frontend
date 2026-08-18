import { useNavigate } from "react-router-dom";
import "./Stepper.css";

/**
 * Progress indicator for the event-creation flow.
 * `current` is 1-based and matches the backend's `current_step`.
 *
 * Steps already completed are clickable so you can jump back and correct
 * something. Later steps stay inert — their data doesn't exist yet.
 */
export const FLOW_STEPS = [
  { id: 1, label: "Details", path: "/booking" },
  { id: 2, label: "Menu", path: "/menuSelection" },
  { id: 3, label: "Operations", path: "/operations" },
  { id: 4, label: "Decor", path: "/decor" },
  { id: 5, label: "Template", path: "/templateSelection" },
  { id: 6, label: "Summary", path: "/summary" },
  { id: 7, label: "Proposal", path: "/proposal" }
];

export default function Stepper({ current, eventId }) {
  const navigate = useNavigate();
  const total = FLOW_STEPS.length;
  const activeStep = FLOW_STEPS.find((s) => s.id === current);

  const resolvedId = eventId || sessionStorage.getItem("currentEventId");

  const goTo = (step) => {
    if (step.id >= current) return;

    // The proposal is the only step that carries the id in the URL.
    if (step.id === 7) {
      if (resolvedId) navigate(`/proposal/${resolvedId}`);
      return;
    }

    navigate(step.path, { state: { eventId: resolvedId } });
  };

  return (
    <nav className="sc-stepper" aria-label="Event setup progress">
      <ol className="sc-stepper__list">
        {FLOW_STEPS.map((step) => {
          const state =
            step.id < current ? "done" : step.id === current ? "active" : "todo";
          const clickable = state === "done";

          return (
            <li
              key={step.id}
              className={`sc-stepper__step is-${state}`}
              aria-current={state === "active" ? "step" : undefined}
            >
              <button
                type="button"
                className="sc-stepper__btn"
                onClick={() => goTo(step)}
                disabled={!clickable}
                aria-label={
                  clickable
                    ? `Go back to step ${step.id}: ${step.label}`
                    : `Step ${step.id}: ${step.label}`
                }
              >
                <span className="sc-stepper__dot">
                  {state === "done" ? "✓" : step.id}
                </span>
                <span className="sc-stepper__label">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Compact readout for narrow screens, where the full rail is hidden */}
      <div className="sc-stepper__compact">
        {current > 1 && (
          <button
            type="button"
            className="sc-stepper__compact-back"
            onClick={() => goTo(FLOW_STEPS[current - 2])}
          >
            ← {FLOW_STEPS[current - 2].label}
          </button>
        )}
        <span>
          Step {current} of {total}
          {activeStep ? ` — ${activeStep.label}` : ""}
        </span>
      </div>
    </nav>
  );
}
