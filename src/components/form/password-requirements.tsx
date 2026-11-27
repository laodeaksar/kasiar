import type { CSSProperties } from "react";

import { Check, X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  getPasswordAssessment,
  getPasswordSuggestion,
} from "~/lib/password-strength";

type PasswordRequirementsPopoverProps = {
  password: string;
  username?: string;
  open: boolean;
  containerRef: { current: HTMLDivElement | null };
  id: string;
};

const noopSubscribe = () => () => {};
function supportsAnchoredPopover() {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("position-area", "top") &&
    typeof HTMLElement !== "undefined" &&
    "showPopover" in HTMLElement.prototype
  );
}

type RequirementItem = {
  id: string;
  met: boolean;
  label: string;
};

const panelBase =
  "pointer-events-none rounded-box border border-base-300 bg-base-100 p-3 text-sm text-base-content shadow-xl";
// Popover API + anchor positioning (pola "dropdown" daisyUI 5): tampil di top layer,
// jadi tidak terpotong overflow Modal; flip atas/bawah ditangani CSS.
const panelAnchored = `dropdown mx-0 my-2 w-[anchor-size(width)] max-w-[calc(100vw-2rem)] [position-area:top_span-right] [position-try-fallbacks:flip-block] ${panelBase}`;
// Fallback untuk browser tanpa anchor positioning / Popover API.
const panelFallback = `w-full max-w-[calc(100vw-2rem)] ${panelBase}`;

export function PasswordRequirementsPopover({
  password,
  username,
  open,
  containerRef,
  id,
}: PasswordRequirementsPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const anchored = useSyncExternalStore(
    noopSubscribe,
    supportsAnchoredPopover,
    () => false,
  );
  const anchorName = `--${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const assessment = getPasswordAssessment(password, username);

  // Jadikan container field sebagai anchor.
  useEffect(() => {
    const container = containerRef.current;
    if (!anchored || !container) return;
    container.style.setProperty("anchor-name", anchorName);
    return () => {
      container.style.removeProperty("anchor-name");
    };
  }, [anchored, anchorName, containerRef]);

  // popover="manual": tidak mencuri fokus dan tidak tertutup oleh klik di luar.
  useEffect(() => {
    const panel = panelRef.current;
    if (!anchored || !panel) return;
    const isOpen = panel.matches(":popover-open");
    if (open && !isOpen) panel.showPopover();
    else if (!open && isOpen) panel.hidePopover();
  }, [anchored, open]);

  /* const required = assessment.requirements.filter((requirement) => requirement.group === "wajib");
  const recommended = assessment.requirements.filter(
    (requirement) => requirement.group === "disarankan",
  ); */

  const className = anchored
    ? panelAnchored
    : `${panelFallback} ${open ? "absolute left-0 top-full z-50 mt-2" : "hidden"}`;

  return (
    <div
      ref={panelRef}
      id={id}
      popover={anchored ? "manual" : undefined}
      style={
        anchored
          ? ({
              positionAnchor: anchorName,
            } as CSSProperties)
          : undefined
      }
      className={className}
      role="group"
      aria-label="Syarat password"
    >
      <RequirementGroup
        title="Jenis karakter"
        requirements={assessment.characterKinds.map((kind) => ({
          id: kind.id,
          met: kind.present,
          label: kind.label,
        }))}
      />
    </div>
  );
}

/*
<p className="mb-2 font-semibold">Syarat password</p>
      <RequirementGroup
        title="Wajib"
        requirements={required}
      />
      <RequirementGroup
        title="Disarankan (agar Kuat)"
        requirements={recommended}
      />
      */

function RequirementGroup({
  title,
  requirements,
}: {
  title: string;
  requirements: RequirementItem[];
}) {
  return (
    <div className="mt-2">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/70">
        {title}
      </p>
      <ul className="space-y-1">
        {requirements.map((requirement) => (
          <li
            key={requirement.id}
            className={`flex items-start gap-2 ${requirement.met ? "text-success" : "text-error"}`}
          >
            {requirement.met ? (
              <Check
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <X
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
            )}
            <span>
              <span className="sr-only">
                {requirement.met ? "Terpenuhi: " : "Belum terpenuhi: "}
              </span>
              {requirement.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Bar tiga segmen + teks kekuatan password beserta sarannya. Kosong saat password kosong.
 * Biasanya tidak dipakai langsung; PasswordField sudah menampilkannya lewat `showStrength`.
 *
 * @example
 * <PasswordStrengthIndicator password={password} username={username} />
 */
export function PasswordStrengthIndicator({
  password,
  username,
}: {
  password: string;
  username?: string;
}) {
  const assessment = getPasswordAssessment(password, username);
  const strength = assessment.strength;
  const active = strength === "Lemah" ? 1 : strength === "Sedang" ? 2 : 3;
  return (
    <div
      className="space-y-1"
      aria-live="polite"
    >
      {password ? (
        <>
          <div
            className="flex gap-1"
            aria-hidden="true"
          >
            {[1, 2, 3].map((segment) => (
              <span
                key={segment}
                className={`h-2 flex-1 rounded-full ${segment <= active ? (strength === "Lemah" ? "bg-error" : strength === "Sedang" ? "bg-warning" : "bg-success") : "bg-base-300"}`}
              />
            ))}
          </div>
          <p className="text-sm">
            Kekuatan password: <strong>{strength}</strong>.{" "}
            {getPasswordSuggestion(strength, assessment)}
          </p>
        </>
      ) : null}
    </div>
  );
}
