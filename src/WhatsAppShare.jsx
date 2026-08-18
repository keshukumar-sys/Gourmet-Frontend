import { useEffect, useState } from "react";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import "./WhatsAppShare.css";

/**
 * Hand a generated PDF over to WhatsApp.
 *
 * WhatsApp's click-to-chat links can prefill a message but cannot carry an
 * attachment, so the flow is: render the PDF, upload it so it has a stable
 * URL, then open WhatsApp with that link already written into the message.
 * The send itself happens in the user's own WhatsApp — nothing is dispatched
 * from the server, so the client sees it arrive from the rep's real number.
 */

/** Strip formatting and apply the dialling code to a bare local number. */
function normaliseNumber(raw, countryCode = "91") {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";

  const cc = String(countryCode || "").replace(/\D/g, "");

  // Already carries a country code (a local Indian number is 10 digits)
  if (cc && digits.length > 10 && digits.startsWith(cc)) return digits;
  if (digits.length > 10) return digits;

  return `${cc}${digits}`;
}

export default function WhatsAppShare({
  eventId,
  defaultNumber = "",
  defaultMessage = "",
  buildPdf,
  docType = "proposal",
  label = "Send on WhatsApp"
}) {
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [countryCode, setCountryCode] = useState("91");
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  /**
   * Seed the form on open, so edits from a previous send do not linger and a
   * changed client number is picked up.
   */
  const openDialog = () => {
    setNumber(String(defaultNumber || "").replace(/\D/g, "").slice(-10));
    setMessage(defaultMessage);
    setShareLink("");
    setFileUrl("");
    setOpen(true);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const prepare = async () => {
    const to = normaliseNumber(number, countryCode);

    if (to.length < 10) {
      toast.error("Enter a valid WhatsApp number.");
      return;
    }

    setPreparing(true);
    try {
      const blob = await buildPdf();

      const formData = new FormData();
      formData.append("document", blob, `${docType}.pdf`);
      formData.append("type", docType);

      const res = await api.post(`/events/${eventId}/documents`, formData);
      const url = res.data?.url;

      if (!url) throw new Error("The document did not come back with a link.");

      const body = `${message}\n\n${url}`.trim();
      const link = `https://wa.me/${to}?text=${encodeURIComponent(body)}`;

      setFileUrl(url);
      setShareLink(link);

      // Opened straight away where the browser allows it; the visible button
      // below is the fallback when the popup is blocked.
      window.open(link, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(errorMessage(err, "Could not prepare the WhatsApp message"));
    } finally {
      setPreparing(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fileUrl);
      toast.success("PDF link copied.");
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  return (
    <>
      <button type="button" className="sc-btn sc-btn--wa" onClick={openDialog}>
        <WhatsAppIcon /> {label}
      </button>

      {open && (
        <div className="wa-modal" role="dialog" aria-modal="true" aria-label="Send on WhatsApp"
             onClick={() => setOpen(false)}>
          <div className="wa-modal__panel" onClick={(e) => e.stopPropagation()}>

            <header className="wa-modal__head">
              <h2>Send on WhatsApp</h2>
              <button className="wa-modal__close" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </header>

            <div className="wa-modal__body">
              <div className="wa-number">
                <div className="sc-field wa-number__code">
                  <label htmlFor="wa-cc">Code</label>
                  <input
                    id="wa-cc"
                    type="text"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="91"
                  />
                </div>

                <div className="sc-field wa-number__main">
                  <label htmlFor="wa-number">WhatsApp number</label>
                  <input
                    id="wa-number"
                    type="tel"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="9340179767"
                    autoFocus
                  />
                </div>
              </div>

              <div className="sc-field">
                <label htmlFor="wa-message">Message</label>
                <textarea
                  id="wa-message"
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <span className="sc-hint">
                  The PDF link is added to the end of this message automatically.
                </span>
              </div>

              <p className="wa-note">
                WhatsApp opens in your own account with the message ready — you press send.
                The PDF is uploaded first so it has a link to share, and{" "}
                <strong>anyone with that link can open it</strong>.
              </p>

              {shareLink && (
                <div className="wa-ready">
                  <p>PDF ready. If WhatsApp did not open, use the button below.</p>
                  <div className="wa-ready__actions">
                    <a
                      className="sc-btn sc-btn--wa"
                      href={shareLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon /> Open WhatsApp
                    </a>
                    <button className="sc-btn sc-btn--ghost sc-btn--sm" onClick={copyLink}>
                      Copy PDF link
                    </button>
                  </div>
                </div>
              )}
            </div>

            <footer className="wa-modal__foot">
              <button className="sc-btn sc-btn--ghost" onClick={() => setOpen(false)}>
                Close
              </button>
              <button className="sc-btn sc-btn--wa" onClick={prepare} disabled={preparing}>
                {preparing ? "Preparing PDF…" : shareLink ? "Rebuild & open again" : "Prepare & open WhatsApp"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2A9.9 9.9 0 0 0 2.1 11.9c0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.9 9.9 0 0 0 4.74 1.21h.01a9.9 9.9 0 0 0 9.9-9.9A9.9 9.9 0 0 0 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.81.83-3.03-.2-.31a8.2 8.2 0 1 1 6.98 3.86Zm4.52-6.15c-.25-.13-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12s-.64.8-.79.97c-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.44.25-.4.72-1.35.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47a.9.9 0 0 0-.66.31c-.22.25-.86.85-.86 2.06s.89 2.39 1.01 2.56c.12.16 1.74 2.66 4.22 3.73 1.57.68 2.19.73 2.97.62.48-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.18-.48-.3Z" />
    </svg>
  );
}
