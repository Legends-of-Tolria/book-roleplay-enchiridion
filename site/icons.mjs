// Book icons, drawn as line art so they take the colour of whatever they sit on.
const svg = (body) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const icons = {
  // The Worldbuilder: a globe with meridians and parallels
  worldbuilder: svg(
    `<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/><path d="M4.6 7.5h14.8M4.6 16.5h14.8"/>`
  ),
  // The Writer: a quill
  writer: svg(
    `<path d="M19.5 3.5C13 4 8 8.5 6.5 15.5c3.5.3 7.5-1.5 10-5.5 2-3 2.8-5.2 3-6.5z"/><path d="M4 20.5l2.5-5"/><path d="M9.5 12.5l5-5"/>`
  ),
  // The Game Master: a twenty-sided die
  "game-master": svg(
    `<path d="M12 2.5l8.5 4.7v9.6L12 21.5l-8.5-4.7V7.2z"/><path d="M12 6.5l5.5 9h-11z"/><path d="M12 2.5v4M3.5 7.2l8.5-.7 8.5.7M20.5 7.2l-3 8.3 3 1.3M17.5 15.5L12 21.5l-5.5-6M3.5 7.2l3 8.3-3 1.3"/>`
  ),
  // The Player: a person
  player: svg(
    `<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.6-4 3.7-6.5 7.5-6.5s6.9 2.5 7.5 6.5"/>`
  ),
  // The Artisan: a painter's palette
  artisan: svg(
    `<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.6-2.1-.5-1.2.3-2.4 1.6-2.4H17a4 4 0 0 0 4-4c0-5.2-4-9.5-9-9.5z"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="9.5" cy="7.2" r="1.2" fill="currentColor"/><circle cx="14" cy="6.6" r="1.2" fill="currentColor"/><circle cx="17.2" cy="9.8" r="1.2" fill="currentColor"/>`
  ),
  // The Publisher: an open book
  publisher: svg(
    `<path d="M3 5.5c3-1 6-1 9 1.2 3-2.2 6-2.2 9-1.2v13c-3-1-6-1-9 1.2-3-2.2-6-2.2-9-1.2z"/><path d="M12 6.7v13.2"/><path d="M5.5 9c1.6-.3 3.1 0 4.2.6M5.5 12c1.6-.3 3.1 0 4.2.6M14.3 9.6c1.1-.6 2.6-.9 4.2-.6M14.3 12.6c1.1-.6 2.6-.9 4.2-.6"/>`
  ),
  // The Workshop: an anvil and hammer
  workshop: svg(
    `<path d="M3 8h12.5c0 2.5 2 4 5.5 4-1.5 1.2-3.5 1.8-5.5 1.8H13l-1 2.2h1.5v2H6.5v-2H8l-1-2.2C4.8 13.8 3 11.6 3 8z"/><path d="M15 3.5l3 2.5-2.2 1.6"/>`
  ),
  // Appendices: a scroll
  appendices: svg(
    `<path d="M7 4h11v12.5a3.5 3.5 0 0 1-3.5 3.5H6.5A3.5 3.5 0 0 1 3 16.5V16h11v.5a3.5 3.5 0 0 0 3.5 3.5"/><path d="M7 4a2 2 0 0 0-2 2v10"/><path d="M10 8.5h5M10 11.5h5"/>`
  ),
};

export const iconFor = (folder) => icons[folder.replace(/^[IVX]+-/, "")] || "";
