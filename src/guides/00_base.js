// ============================================================================
// GUIDE CONTENT — written in a simple text format so it can be edited in the app.
//
//   ## Section heading
//   1. A numbered step (tickable)
//   - A bullet point
//   [ ] A checklist item (tickable)
//   ! A warning (red box)
//   > A note or tip (blue box)
//   + "You'll know it's right when…" (green box)
//   | Table | row |        (first row is the header)
//   Anything else is a normal paragraph.
//
//   Inside a line: **bold**, *italic*, [[guide-id]] or [[guide-id|link text]],
//   {{tokens}} filled from Our plan (e.g. {{car}}, {{away}}, {{people}}).
// ============================================================================
const GUIDES = [];
function G(meta, body) { GUIDES.push(Object.assign({ body: String(body).replace(/^\n+|\s+$/g, '') }, meta)); }

const CATS = [
  ['scenario', 'When it happens', '🚨', '#b91c1c', 'What to do, minute by minute, when something big happens.'],
  ['home', 'Our home & equipment', '🏠', '#6d28d9', 'Step by step for our own car, tank, cookers, radios and house.'],
  ['protein', 'Protein', '🍗', '#9a3412', 'Keeping everyone strong when meat and dairy run out.'],
  ['food', 'Food & cooking', '🥫', '#a16207', 'Building the pantry, meals from the store, cooking with no power.'],
  ['water', 'Water, toilets & hygiene', '💧', '#0369a1', 'Safe water, emergency toilets and staying clean.'],
  ['health', 'First aid & health', '🩹', '#be123c', 'What to do until help arrives — and when it can\'t.'],
  ['land', 'Growing & living off the land', '🌱', '#15803d', 'Gardens, preserving and foraging.'],
  ['skills', 'Skills, shelter & safety', '🔥', '#475569', 'Fire, shelter, evacuation, security and getting around.'],
  ['family', 'Family', '👪', '#0f766e', 'Children, older family, practice and wellbeing.'],
  ['away', 'Overseas', '✈️', '#0e7490', 'When a parent is stuck overseas.'],
  ['ours', 'Our own guides', '📝', '#334155', 'Anything we add ourselves.'],
];
