import { useState } from 'react';

const BANNER_KEY = 'netlab.mobile-banner.dismissed.v1';

function bannerDismissed(): boolean {
  try {
    return localStorage.getItem(BANNER_KEY) === '1';
  } catch {
    return false;
  }
}

// One-time heads-up on phones: the study modes work here, the canvas needs a
// bigger screen. Dismissal is remembered so it only shows once.
export function MobileBanner() {
  const [open, setOpen] = useState(() => !bannerDismissed());
  if (!open) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(BANNER_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div className="mobile-banner" role="status">
      <div className="mobile-banner-text">
        <strong>Studying on mobile.</strong> Quiz, Flashcards, Match, PBQs, the OSI model, and
        Troubleshooting all work here. The Visual Lab and Guided missions need a mouse and a bigger
        screen, so open the lab on a desktop for the full experience.
      </div>
      <button className="mobile-banner-close" onClick={dismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

const COPY: Record<string, { title: string; body: string }> = {
  lab: {
    title: 'The Visual Lab',
    body: 'Dragging devices onto the canvas, wiring cables, panning and zooming, and watching packets fly all need a mouse and room to work.',
  },
  guided: {
    title: 'Guided missions',
    body: 'The guided missions run on the Visual Lab canvas, so they need the same mouse-and-room setup the lab does.',
  },
};

// Shown in place of a canvas mode that does not work on a phone, so mobile users
// get a clear message instead of a broken, zoomed-out canvas.
export function DesktopOnlyNotice({ section }: { section: string }) {
  const c = COPY[section] ?? COPY.lab;
  return (
    <div className="study">
      <div className="desktop-only">
        <div className="desktop-only-icon" aria-hidden="true">
          🖥️
        </div>
        <h2>{c.title} works best on a desktop</h2>
        <p>{c.body}</p>
        <p className="desktop-only-tip">
          On the go? Use <strong>Quiz</strong>, <strong>Flashcards</strong>, <strong>Match</strong>,{' '}
          <strong>PBQs</strong>, <strong>OSI Model</strong>, or <strong>Troubleshoot</strong> — they
          are all built to work on a phone.
        </p>
      </div>
    </div>
  );
}
