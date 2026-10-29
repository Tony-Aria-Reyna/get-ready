// ============================================================================
// CONTENT — scenario guides and the survival library.
// Plain NZ English, written to be followed under stress.
// Sources: NEMA / Get Ready (getready.govt.nz), Auckland Emergency Management,
// Te Whatu Ora (info.health.nz), MPI shellfish biotoxin guidance, St John NZ.
// ============================================================================

const NUMBERS = [
  { n: '111', label: 'Emergency — Police, Fire, Ambulance', big: true },
  { n: '0800 611 116', label: 'Healthline — free nurse advice, 24/7' },
  { n: '0800 764 766', label: 'National Poisons Centre — 24/7' },
  { n: '1737', label: 'Need to talk — call or text, free, 24/7' },
  { n: '0800 46 78 46', label: 'Mental health crisis line' },
  { n: '09 301 0101', label: 'Auckland Council (incl. Emergency Management)' },
  { n: '0800 933 922', label: 'PlunketLine — child health, 24/7' },
  { n: '105', label: 'Police — non-urgent' },
];

const RADIO = [
  ['RNZ National', '101.4 FM (756 AM if still on air)', 'Official civil defence lifeline broadcaster — try this first'],
  ['Newstalk ZB', '89.4 FM · 1080 AM', 'Carries Civil Defence messages'],
  ['The Hits', '97.4 FM', 'Carries Civil Defence messages'],
  ['More FM', '91.8 FM', 'Carries Civil Defence messages'],
];

// ---------------------------------------------------------------------------
// SCENARIOS. Each has: now (first minutes), next (first hours/day), later (days+).
// ---------------------------------------------------------------------------
const SCENARIOS = [
{
  id: 'quake', icon: '🌏', title: 'Earthquake', colour: '#c2410c',
  one: 'Drop, Cover, Hold. If you are near the coast and it was long or strong — get to high ground.',
  now: [
    '<b>DROP</b> to your hands and knees. <b>COVER</b> your head and neck — get under a sturdy table if one is close. <b>HOLD</b> on until the shaking stops.',
    'Stay inside. Do not run outside — most injuries are from falling glass and bricks.',
    'In bed: stay there, pull the pillow over your head.',
    'Driving: pull over away from bridges, power lines and buildings. Stay in the car.',
    '<b>At the beach or near the sea?</b> If the shaking was LONG (a minute or more) or STRONG (hard to stand) — walk or run to high ground or inland as soon as it stops. Do not wait for a warning. See <a data-go="sc:tsunami">Tsunami</a>.',
  ],
  next: [
    'Check yourself, then others, for injuries. First aid before anything else. Call 111 only if life is at risk.',
    'Put shoes on — there will be broken glass.',
    '<b>Smell gas?</b> Get everyone out. Turn gas off at the meter or bottle. No lights, matches or switches.',
    'Water: turn off the mains tap at the street (toby) to stop clean water draining out and dirty water getting in. Your hot water cylinder is now drinking water — see <a data-go="lib:water">Water</a>.',
    'Power: if wiring is damaged or there is water near it, switch off at the main switchboard.',
    'Text, don\'t call — networks jam. Send one message to the family group: where you are and that you\'re OK.',
    'Turn on the radio — <b>RNZ National 101.4 FM</b>.',
    'Expect aftershocks. Drop, Cover, Hold again each time.',
    'Check on neighbours, especially elderly and people alone.',
  ],
  later: [
    'If the house is unsafe (big cracks, leaning walls, chimney damage) — leave and go to the first meeting point. Take the grab bags.',
    'Take photos of all damage before you clean up — for insurance (Natural Hazards Commission / Toka Tū Ake and your insurer).',
    'Use your stored water and food. Keep the fridge and freezer shut.',
    'Use the bucket toilet if the sewer may be damaged — do not flush. See <a data-go="lib:toilet">Emergency toilet</a>.',
    'Follow Auckland Emergency Management on radio for where help centres are open.',
  ],
},
{
  id: 'tsunami', icon: '🌊', title: 'Tsunami', colour: '#1d4ed8',
  one: 'LONG or STRONG — GET GONE. Walk or run to high ground or inland. Don\'t wait.',
  now: [
    '<b>LONG or STRONG — GET GONE.</b> If you are near the coast and feel an earthquake that lasts a minute or more, or is so strong it\'s hard to stand — leave as soon as the shaking stops.',
    'Other natural warnings: the sea suddenly drops away or rises fast, or a loud roar from the sea. Go immediately.',
    '<b>Walk, run or bike</b> — cars jam roads. Go uphill or as far inland as you can.',
    'Do not go to the beach to look. Do not go back for belongings.',
    'If you cannot get out of the zone: go to the third floor or higher of a solid concrete building, or climb a hill, as a last resort.',
  ],
  next: [
    'Stay out of the evacuation zone. More waves can come for hours — the first is often not the biggest.',
    'Listen to RNZ National 101.4 FM. An official warning may also come by Emergency Mobile Alert.',
    'Only go back when Civil Defence gives the all clear.',
    'Text family where you are — use the plan\'s meeting points.',
  ],
  later: [
    'Stay away from flood debris and damaged buildings. Tsunami water is contaminated with sewage.',
    'Throw out any food that touched the water. Boil or treat drinking water until told it\'s safe.',
  ],
  local: 'Inland West Auckland suburbs are well away from the sea, but the West Coast beaches (Piha, Karekare, Te Henga/Bethells, Muriwai, Whatipu) and low ground around the Manukau and Waitematā harbours are tsunami zones. If you are at a West Coast beach after a long or strong quake, head straight up the road away from the sand. A tsunami from far away (South America, Tonga–Kermadec) gives an hour or more and comes with an official warning.',
},
{
  id: 'volcano', icon: '🌋', title: 'Volcanic eruption', colour: '#7c2d12',
  one: 'Follow evacuation orders. If ash is falling: stay inside, close everything, wear a mask.',
  now: [
    'An Auckland eruption will almost certainly come with warning — swarms of small earthquakes for days or weeks. Listen to the radio and follow Auckland Emergency Management.',
    'If told to evacuate, <b>go straight away</b> by the route they give. Take grab bags, medicines, pets, documents.',
    'If ash is falling: get inside. Close windows, doors and fireplace. Turn off heat pumps and air conditioning.',
    'Wear a <b>P2/N95 mask</b> and goggles if you must go out. A damp cloth is better than nothing. No contact lenses.',
  ],
  next: [
    '<b>Protect the water tank:</b> disconnect downpipes so ash does not wash into it. Cover stored water.',
    'Keep pets inside. Bring animals under cover.',
    'Do not drive in ash — it damages engines and cuts visibility to nothing.',
    'Put damp towels at door gaps.',
    'Bring electronics inside and cover them.',
  ],
  later: [
    '<b>Ash on the roof is very heavy when wet</b> — around 10 cm can bring down a weaker roof. Clear it carefully, wearing a mask, with someone holding the ladder. Never clear a roof alone.',
    'Dampen ash lightly before sweeping. Bag it — don\'t wash it into drains.',
    'Rinse vegetables from the garden well. Check with Civil Defence before eating produce from heavy ashfall areas.',
  ],
  local: 'Auckland sits on a volcanic field of about 50 volcanoes. The next eruption could be anywhere in the field. Rangitoto erupted about 550–600 years ago. Ash from central North Island volcanoes (Taupō, Ruapehu) could also reach Auckland.',
},
{
  id: 'storm', icon: '🌧️', title: 'Storm, flood or slip', colour: '#0f766e',
  one: 'Never drive or walk through floodwater. If the hill or ground starts moving — get out now.',
  now: [
    '<b>Never drive, walk or let children play in floodwater.</b> 15 cm of fast water can knock you over; 30 cm can float a car.',
    'If water is coming into the house: switch off power at the main switchboard if you can do it safely (dry hands, dry floor). Move to higher ground or upstairs.',
    '<b>Slip warning signs:</b> new cracks in the ground, paths or walls; doors or windows suddenly sticking; trees, poles or fences tilting; new springs or muddy water; rumbling or cracking sounds. <b>Leave immediately</b> — don\'t pack.',
    'Stay away from streams and gullies — they rise in minutes. Streams across West Auckland flooded houses in January 2023.',
    'Call 111 if you are trapped or life is at risk.',
  ],
  next: [
    'Listen to RNZ National 101.4 FM and watch MetService warnings (orange = be ready, red = take action now).',
    'If told to evacuate, go to the meeting point or the Civil Defence Centre they name.',
    'Text the family group where you are.',
    'Stay away from fallen power lines — at least 10 metres. Assume they are live.',
  ],
  later: [
    'Floodwater is full of sewage. Wear gloves and boots to clean up. Wash hands well.',
    'Throw out food, including tins with damaged seals, that touched floodwater.',
    'Do not go back into a house with slip damage until it has been checked.',
    'Photograph everything for insurance before you clean up.',
  ],
  before: [
    'When a red or orange warning is issued: tie down or bring in outdoor furniture and trampolines.',
    'Charge phones, power banks and torches. Fill the car with fuel.',
    'Fill water bottles and the bath.',
    'Clear gutters and drains if it is safe to.',
    'Move valuables and documents up high.',
    'Check the grab bags are ready by the door.',
  ],
},
{
  id: 'outage', icon: '🔌', title: 'Long power or water outage', colour: '#a16207',
  one: 'Water first, then food safety, then light and warmth. Never run a BBQ, gas heater or generator indoors.',
  now: [
    'Check: is it just us or the whole street? Look at neighbours\' lights. Check the switchboard.',
    'Turn on the battery radio — RNZ National 101.4 FM.',
    'Keep the fridge and freezer <b>closed</b>. A full freezer stays frozen about 48 hours; a fridge about 4 hours.',
    'Fill every container with water now if the taps still run.',
    'Unplug appliances so the power surge when it returns doesn\'t damage them.',
  ],
  next: [
    '<b>Cook outdoors only.</b> BBQs, camp cookers and generators give off carbon monoxide — it kills silently in garages, tents and houses.',
    'Eat fridge food first, then freezer food, then the pantry and emergency stores.',
    'Light: headlamps and LED lanterns. Avoid candles near children and curtains.',
    'Stay warm: layers, beanies, everyone in one room, close off the rest of the house.',
    'Save phone battery: low-power mode, screen dim, airplane mode when not needed. Charge from power banks, car or solar.',
  ],
  later: [
    'Set up the bucket toilet if water or sewer has stopped. See <a data-go="lib:toilet">Emergency toilet</a>.',
    'Ration water: 3 litres per person per day for drinking and cooking. Treat any water not from a sealed store. See <a data-go="lib:water">Water</a>.',
    'Organise with neighbours — share a generator, freezer, cooking.',
    'If it runs past a week, start the <a data-go="sc:supply">Supply chains stop</a> plan.',
  ],
},
{
  id: 'cyber', icon: '📵', title: 'Phones, internet & EFTPOS down', colour: '#4338ca',
  one: 'Go to the family plan. Use cash. Use the radio. Meet where we agreed.',
  now: [
    'Don\'t panic-buy and don\'t keep retrying payments. Use <b>cash</b> from the emergency cash store.',
    'If you can\'t reach each other: follow the <b>family plan</b> automatically — no discussion needed. See <a data-go="tab:plan">Our plan</a>.',
    'Default rule: <b>whoever is closest collects our daughter.</b> Everyone else goes home. If home is not safe, go to meeting point 2.',
    'Turn on the radio — RNZ National 101.4 FM. Radio works without internet or mobile networks.',
    '111 may still work even when normal calls don\'t. Text 111 only if you have registered for the deaf text service.',
  ],
  next: [
    'Fill the car tank and water containers if pumps and taps still work.',
    'Write down anything important on paper. This app works offline — keep phones charged.',
    'Be suspicious of any message asking for passwords, bank details or to "click here" — scams spike during outages.',
    'Check on neighbours. Agree a time each day to meet and share news.',
  ],
  later: [
    'If it lasts more than a few days, banks may open branches for cash. Bring ID.',
    'Shops may run on cash and IOUs. Small notes and coins are most useful.',
    'If supplies stop arriving, move to the <a data-go="sc:supply">Supply chains stop</a> plan.',
  ],
  before: [
    'Keep emergency cash at home in small notes — enough for a week of food and fuel.',
    'Keep paper copies of key phone numbers, the family plan, prescriptions and insurance details (use the Print button).',
    'Keep the car above half a tank.',
    'Agree the family plan and practise it with our daughter.',
  ],
},
{
  id: 'unrest', icon: '🛡️', title: 'Civil unrest', colour: '#475569',
  one: 'Stay home, stay out of sight, stay together. Avoid crowds. Don\'t advertise what we have.',
  now: [
    'Get everyone home. Avoid town centres, protests, malls and main roads.',
    'Lock doors and windows. Close curtains at night. Keep lights low.',
    'Don\'t post on social media about our supplies, plans or where we are.',
    'If someone threatening comes to the door: don\'t open it. Call 111.',
  ],
  next: [
    'Talk to trusted neighbours — agree to watch out for each other and share news.',
    'Keep a low profile. Store supplies out of sight from the street.',
    'If you must go out: go in daylight, in pairs, plain clothes, phone charged, tell someone your route and time back.',
    'If confronted: stay calm, hand over things, not people. Possessions can be replaced.',
  ],
  later: [
    'If the area becomes unsafe, go to the out-of-area meeting point — leave early, in daylight, by a quiet route.',
    'Keep the grab bags and car ready to go at short notice.',
  ],
},
{
  id: 'supply', icon: '🌱', title: 'Supply chains stop', colour: '#15803d',
  one: 'Stretch what we have. Start growing now. Build the network of people we trade with.',
  now: [
    '<b>Week 1:</b> Take stock. Count food, water, medicine, fuel and gas. Write it in <a data-go="tab:supplies">Supplies</a>.',
    'Eat perishables first. Hold the long-life stores back.',
    'Get repeat prescriptions filled as soon as you can — ask the pharmacist for extra.',
    'Contact your <a data-go="tab:sources">Suppliers & contacts</a> list — growers, egg and poultry keepers, people with skills.',
  ],
  next: [
    '<b>Weeks 2–6:</b> Plant fast crops immediately — radish (4 weeks), lettuce and bok choy (6–8 weeks), silverbeet and spinach (8 weeks). See <a data-go="lib:grow">Growing food</a>.',
    'Plant staples for calories: potatoes, kūmara, pumpkin, beans, corn.',
    'Set up rainwater collection off the roof if you haven\'t already. See <a data-go="lib:water">Water</a>.',
    'Start a compost heap. Every scrap goes back into the soil.',
    'Ration carefully — about 2,000 calories per adult per day. Children need proportionally more. Rice, oats, pasta, beans and oil give the most calories per dollar and per shelf.',
  ],
  later: [
    '<b>Months:</b> Keep chickens for eggs — 3 or 4 hens give about 2 to 3 eggs a day. See <a data-go="lib:chickens">Chickens</a>.',
    'Save seed from your best plants every season. See <a data-go="lib:grow">Growing food</a>.',
    'Preserve surplus: drying, fermenting, bottling. See <a data-go="lib:preserve">Preserving food</a>.',
    'Fish and gather shellfish — but check for biotoxin warnings. See <a data-go="lib:sea">Fishing & shellfish</a>.',
    'Forage only what you are 100% sure of. See <a data-go="lib:forage">Foraging</a>.',
    'Trade skills, not just goods. A neighbourhood that works together eats better than any one house alone.',
  ],
},
];

// ---------------------------------------------------------------------------
// LIBRARY — longer reference articles. HTML allowed (b, ul, li, p, table).
// ---------------------------------------------------------------------------
const LIBRARY = [
{
  id: 'water', icon: '💧', title: 'Water', group: 'Survive',
  body: `
<h3>How much</h3>
<p>Minimum <b>3 litres per person per day</b> for drinking and basic hygiene — that's 9 litres each for 3 days. Wellington's emergency office recommends <b>20 litres per person per day for 7 days</b> (140 L each) so you can also cook and wash. For three of us, aim for at least <b>63 litres</b> (minimum for a week) and ideally <b>420 litres</b>. Add extra for pets.</p>
<h3>Hidden water in the house</h3>
<ul>
<li><b>Hot water cylinder:</b> usually 135–180 litres of clean water. Turn off power/gas to it first, close the cold mains tap, then drain from the tap at the bottom. Let it cool.</li>
<li><b>Toilet cistern</b> (the tank, not the bowl) — fine if you don't use cistern cleaning blocks.</li>
<li>Water already in the pipes: open the lowest tap in the house.</li>
<li>Ice cubes, tinned fruit juice and liquid from tinned vegetables.</li>
</ul>
<h3>Storing water</h3>
<ul>
<li>Clean plastic soft-drink bottles (not milk bottles — they can't be cleaned well enough).</li>
<li>Wash bottles and lids in hot soapy water. Fill to overflowing with tap water.</li>
<li>Add <b>5 drops of plain, unscented household bleach per litre</b>. Cap and store somewhere cool and dark.</li>
<li>Label with the date. Replace every 12 months.</li>
<li>A 200-litre rain tank on a downpipe is the single best thing you can add. Use a first-flush diverter so the dirty first rain goes to waste.</li>
</ul>
<h3>Making water safe</h3>
<ol>
<li><b>Boiling (best):</b> bring to a rolling boil for 1 minute. Let it cool, keep it covered.</li>
<li><b>Bleach:</b> 5 drops of plain, unscented household bleach per litre. Stir, wait 30 minutes. If the water is cloudy, filter it through a clean cloth first and double the dose. It should smell faintly of chlorine — if not, repeat.</li>
<li><b>Filters:</b> a camping or gravity filter (Sawyer, LifeStraw, Katadyn) removes bacteria and parasites but usually <b>not viruses</b> — also boil or bleach if the water might contain sewage.</li>
</ol>
<p><b>Never drink:</b> floodwater, water from radiators or hot-water heating systems, swimming pool water (except for washing and flushing), or water that smells of fuel or chemicals — boiling does not remove chemicals.</p>
<h3>Water sources near us</h3>
<p>Mark your own on the map: neighbours with rain tanks, streams (always treat), public taps. Streams in the Waitākere Ranges may carry giardia and run-off — always boil.</p>`
},
{
  id: 'toilet', icon: '🚽', title: 'Emergency toilet', group: 'Survive',
  body: `
<p>If the sewer is damaged, flushing pushes sewage back into homes and streets. Use a bucket toilet until told it's safe.</p>
<h3>Two-bucket system (recommended by Civil Defence)</h3>
<ul>
<li><b>Bucket 1 — wee only.</b> Dilute with water and pour onto the garden or down a gully trap if the sewer is working; otherwise into a hole in the garden.</li>
<li><b>Bucket 2 — poo only.</b> Line with a strong bag. After each use, cover with a handful of sawdust, dry soil, shredded paper or garden mulch. Put a lid on.</li>
<li>Keeping wee out of the poo bucket stops most of the smell.</li>
<li>When the bag is full, tie it and store it in a covered bin until there's official advice on disposal.</li>
</ul>
<h3>If it goes on for weeks</h3>
<p>Dig a hole at least 30 cm deep, well away from any water source, vegetable garden or tank. Cover each use with soil.</p>
<h3>Hygiene — this stops gastro spreading</h3>
<ul>
<li>Wash hands with soap and water, or use hand sanitiser, after the toilet and before food. Every time.</li>
<li>Keep a "tippy tap" (a container with a tap) and soap by the toilet bucket.</li>
<li>Keep the toilet area separate from food and water.</li>
</ul>`
},
{
  id: 'food', icon: '🥫', title: 'Food store & cooking without power', group: 'Survive',
  body: `
<h3>What to keep</h3>
<p>Food you already eat, that keeps without a fridge and needs little or no cooking. Rotate: use the oldest first and replace it.</p>
<ul>
<li><b>Ready to eat:</b> tinned fish, meat, beans, spaghetti, soups, fruit; peanut butter; crackers; muesli bars; dried fruit; nuts; UHT milk.</li>
<li><b>Calorie bank:</b> rice, oats, pasta, flour, sugar, honey, cooking oil, dried lentils and beans, milk powder.</li>
<li><b>Morale:</b> tea, coffee, chocolate, lollies for our daughter. It matters more than you think.</li>
<li>Salt, stock cubes, spices, vitamins.</li>
<li>A manual can opener. Check it works.</li>
</ul>
<h3>Rough calories per kilogram</h3>
<table><tr><th>Food</th><th>kcal per kg</th></tr>
<tr><td>Cooking oil</td><td>8,800</td></tr><tr><td>Peanut butter</td><td>5,900</td></tr>
<tr><td>Rice, pasta, oats, flour</td><td>3,500–3,800</td></tr><tr><td>Dried beans, lentils</td><td>3,300</td></tr>
<tr><td>Sugar, honey</td><td>3,000–4,000</td></tr><tr><td>Tinned fish</td><td>1,500–2,000</td></tr></table>
<p>One adult needs about 2,000–2,500 kcal a day. 1 kg of rice ≈ 1.5 days of calories for one adult.</p>
<h3>Fridge and freezer safety</h3>
<ul>
<li>Keep doors shut. Fridge stays cold about 4 hours; a full freezer about 48 hours (24 if half full).</li>
<li>Throw out meat, fish, dairy, cooked food and leftovers that have been above 5°C for more than 4 hours.</li>
<li>If in doubt, throw it out. Food poisoning without a working health system is dangerous.</li>
</ul>
<h3>Cooking without power</h3>
<ul>
<li>Gas BBQ, camping stove, wood fire outdoors. <b>Never indoors or in the garage</b> — carbon monoxide.</li>
<li>Keep spare gas: one 9 kg BBQ bottle cooks for a family for roughly 2–3 weeks if used carefully.</li>
<li><b>Hay-box cooking</b> saves fuel: bring rice, beans or stew to the boil for 5–10 minutes, then wrap the pot tightly in blankets or put it in a chilly bin packed with towels. It keeps cooking for hours.</li>
<li>Soak dried beans overnight to halve the cooking time.</li>
</ul>`
},
{
  id: 'firstaid', icon: '🩹', title: 'First aid essentials', group: 'Survive',
  body: `
<p class="warn">Call <b>111</b> if anyone is unconscious, not breathing normally, bleeding heavily, or you are worried. If phones are down, send someone for help and keep going with first aid.</p>
<h3>Not breathing normally — CPR (adult)</h3>
<ol>
<li>Check for danger. Shout and tap their shoulders.</li>
<li>Call 111 (speaker on). Send someone for an AED (defibrillator) — the map shows AEDs.</li>
<li>Hands in the centre of the chest. Push down hard, about 5 cm, <b>100–120 times a minute</b> (the beat of "Stayin' Alive").</li>
<li>After 30 compressions, give 2 breaths if you are trained and willing. Otherwise, compressions only — that still saves lives.</li>
<li>Turn on the AED as soon as it arrives and follow its voice.</li>
<li>Keep going until help takes over or the person breathes normally.</li>
</ol>
<p><b>Child:</b> same, but push about one-third of the chest depth (one hand for a small child). <b>Baby:</b> two fingers, about 4 cm.</p>
<h3>Heavy bleeding</h3>
<ol><li>Press firmly and directly on the wound with a pad or clean cloth. Don't lift it to look.</li>
<li>If blood soaks through, add more pads on top and keep pressing.</li>
<li>Raise the injured part if you can. Lie them down.</li>
<li>For life-threatening limb bleeding that won't stop with pressure, a tourniquet 5–7 cm above the wound (not on a joint) — note the time.</li></ol>
<h3>Burns</h3>
<p>Cool under <b>cool running water for 20 minutes</b>. Remove rings and watches. Cover loosely with cling film. No butter, ice or creams. Burns bigger than the person's palm, or on face, hands or genitals — get medical help.</p>
<h3>Choking</h3>
<p>Adult or child: up to 5 firm back blows between the shoulder blades, then up to 5 chest thrusts. Repeat. Call 111 if it doesn't clear. Start CPR if they become unconscious.</p>
<h3>Shock</h3>
<p>Pale, cold, clammy, fast weak pulse after injury. Lie them down, raise legs if no leg injury, keep warm, nothing to eat or drink, call for help.</p>
<h3>Broken bones and sprains</h3>
<p>Support the injury in the position you find it. Splint with a rolled magazine, board or pillow. Ice wrapped in cloth for 20 minutes at a time.</p>
<h3>Hypothermia</h3>
<p>Shivering, confused, slurred speech. Get them out of wet clothes, into dry layers and a sleeping bag, cover the head. Warm sweet drinks if fully awake. Warm them slowly.</p>
<h3>Cuts and infection (when help is far away)</h3>
<p>Clean wounds with clean (boiled, cooled) water — lots of it. Cover with a clean dressing and change daily. Watch for redness spreading, heat, swelling, pus or fever — that needs a doctor or pharmacist.</p>
<h3>Gastro and dehydration</h3>
<p>Small sips often. Oral rehydration sachets (keep some in the kit). Home mix if needed: 1 litre of safe water + 6 level teaspoons sugar + ½ level teaspoon salt. Children with gastro dehydrate fast — watch for no wee for 6+ hours, very sleepy, sunken eyes: get help.</p>`
},
{
  id: 'comms', icon: '📻', title: 'Staying informed & in touch', group: 'Survive',
  body: `
<h3>Radio (works when phones and internet don't)</h3>
<table><tr><th>Station</th><th>Auckland</th></tr>${'${RADIO_ROWS}'}</table>
<p>Keep a battery or wind-up radio and spare batteries. The car radio works too.</p>
<h3>Phones</h3>
<ul>
<li><b>Text instead of calling</b> — texts get through when calls don't, and use less battery.</li>
<li>Emergency Mobile Alerts arrive on phones without an app if the cell tower is working.</li>
<li>111 may work even if your phone shows "SOS only".</li>
<li>Save battery: low-power mode, dim screen, close apps, airplane mode between checks.</li>
</ul>
<h3>Out-of-town contact</h3>
<p>Pick one person outside Auckland that everyone checks in with. Local networks may be down while long-distance messages still work. Put them in <a data-go="tab:plan">Our plan</a>.</p>
<h3>Walkie-talkies (PRS / UHF CB)</h3>
<ul>
<li>Licence-free handheld radios on the 476–477 MHz band. Range about 1–5 km in suburbs, more from hilltops.</li>
<li>Agree a family channel now (e.g. channel 12) and write it in the plan.</li>
<li>Channel 5 and 35 are emergency channels in Australia, but <b>in New Zealand they are not officially monitored</b>. In an emergency, scan all channels for anyone listening, then ask for help.</li>
<li>Do a radio check with the family once a month.</li>
</ul>
<h3>Notice board</h3>
<p>If phones are down and you leave home, write a note on the inside of the front window: who, where you've gone, when. Agree this with the family.</p>`
},
{
  id: 'power', icon: '🔋', title: 'Power, light & warmth', group: 'Survive',
  body: `
<ul>
<li><b>Light:</b> a head torch for each person, plus an LED lantern. Spare batteries. Solar garden lights brought inside at night make good free night-lights for children.</li>
<li><b>Phone power:</b> 2–3 large power banks (20,000 mAh each ≈ 4 phone charges). A small solar panel (20–40 W) keeps phones and radio charged indefinitely. A car charger works while the car is running.</li>
<li><b>Generators:</b> only outdoors, at least 3 m from windows and doors. Never in the garage. Store fuel safely and rotate it (petrol goes stale in 3–6 months without stabiliser).</li>
<li><b>Warmth:</b> wool layers, beanies, sleeping bags. Everyone sleeps in one room. Hang blankets over doors and windows. Hot water bottles from water heated on the BBQ.</li>
<li><b>No unflued gas heaters, BBQs or braziers indoors</b> — carbon monoxide has no smell. Headache, dizziness and nausea in a closed room = get outside now.</li>
</ul>`
},
{
  id: 'grow', icon: '🥬', title: 'Growing food in Auckland', group: 'Live off the land',
  body: `
<p>Auckland is mild and mostly frost-free, so something can be grown in every month. Start small near the house, in the sunniest spot. Raised beds or bags of potting mix work on clay soil.</p>
<h3>Fastest food (plant first)</h3>
<table><tr><th>Crop</th><th>Ready in</th><th>Notes</th></tr>
<tr><td>Radish</td><td>4 weeks</td><td>Sow every 2 weeks</td></tr>
<tr><td>Microgreens / sprouts</td><td>1–2 weeks</td><td>Grow indoors on a windowsill — mung beans, broccoli, peas</td></tr>
<tr><td>Lettuce, bok choy, mizuna</td><td>6–8 weeks</td><td>Pick leaves as they grow</td></tr>
<tr><td>Silverbeet, spinach, kale</td><td>8–10 weeks</td><td>Keep producing for months</td></tr>
<tr><td>Spring onions</td><td>8 weeks</td><td>Replant shop-bought roots in water</td></tr>
<tr><td>Zucchini</td><td>8 weeks (warm months)</td><td>One plant feeds a family</td></tr></table>
<h3>Calorie crops (what keeps you alive)</h3>
<table><tr><th>Crop</th><th>Plant</th><th>Ready</th></tr>
<tr><td>Potatoes</td><td>Aug–Oct and Feb</td><td>3–4 months</td></tr>
<tr><td>Kūmara</td><td>Oct–Dec (from slips)</td><td>4–5 months</td></tr>
<tr><td>Pumpkin, squash</td><td>Oct–Dec</td><td>3–4 months; store for months</td></tr>
<tr><td>Beans (climbing, dwarf)</td><td>Oct–Feb</td><td>2–3 months; dry the extras</td></tr>
<tr><td>Sweetcorn</td><td>Oct–Jan</td><td>3 months</td></tr>
<tr><td>Broad beans, peas</td><td>Apr–Jul</td><td>4–5 months</td></tr>
<tr><td>Garlic, onions</td><td>May–Jul</td><td>6–8 months</td></tr></table>
<h3>By season (Auckland)</h3>
<ul>
<li><b>Spring (Sep–Nov):</b> potatoes, tomatoes (after Labour Day), beans, corn, zucchini, pumpkin, cucumber, kūmara slips, lettuce, beetroot, carrots.</li>
<li><b>Summer (Dec–Feb):</b> keep sowing beans, lettuce, carrots, beetroot, basil. In Feb, start broccoli, cabbage and cauliflower seedlings and a second potato crop.</li>
<li><b>Autumn (Mar–May):</b> broccoli, cabbage, cauliflower, kale, silverbeet, spinach, broad beans, peas, onions, garlic (May).</li>
<li><b>Winter (Jun–Aug):</b> garlic, broad beans, peas, onions, leafy greens. Plant fruit trees and citrus. Early potatoes in late Aug.</li>
</ul>
<h3>Fruit that grows easily here</h3>
<p>Feijoa, lemon, mandarin, orange, tamarillo, passionfruit, guava, avocado, apple (low-chill varieties), fig, plum. They take 2–4 years — plant now, before you need them.</p>
<h3>Saving seed</h3>
<ul>
<li>Buy <b>open-pollinated or heirloom</b> seed — hybrid (F1) seed won't grow true next year.</li>
<li>Easiest to save: beans, peas, tomatoes, lettuce, pumpkin, silverbeet.</li>
<li>Let the best plants go to seed. Dry the seed fully, store in paper envelopes in a jar somewhere cool and dark. Label with name and date.</li>
<li>Keep a seed bank now: a sealed tin of seed packets, replaced every 2–3 years.</li>
</ul>
<h3>Soil</h3>
<p>Compost everything — food scraps, lawn clippings, leaves, cardboard. Worm farms turn scraps into rich fertiliser fast. Wood ash (small amounts) adds potash. Seaweed (rinsed) is excellent fertiliser and mulch.</p>`
},
{
  id: 'chickens', icon: '🐔', title: 'Chickens', group: 'Live off the land',
  body: `
<ul>
<li>3–4 laying hens give about 2–3 eggs a day — a cheap, steady source of protein.</li>
<li><b>Breeds:</b> Shaver/Brown Shaver (most eggs, 1–2 years peak), Orpington or Australorp (hardy, good mothers, also meat), Wyandotte. Heritage breeds can raise their own chicks.</li>
<li>You don't need a rooster for eggs — only to breed. Auckland Council urban rules usually allow hens but not roosters; check before you buy.</li>
<li><b>Housing:</b> a dry, draught-free coop with a perch and nest box, and a run safe from dogs, rats and stoats. About 1 m² of coop and 3–4 m² of run per bird.</li>
<li><b>Feed:</b> layer pellets plus kitchen scraps and garden greens. If feed runs out: let them free-range, feed worms, bugs, grain, cooked rice and vegetable scraps, crushed eggshell or shell grit for calcium. No avocado skin or stone, raw potato peel, mouldy food or salty food.</li>
<li>Fresh water every day.</li>
<li>Line up a local supplier of point-of-lay hens and feed now — add them to <a data-go="tab:sources">Suppliers & contacts</a>.</li>
</ul>`
},
{
  id: 'preserve', icon: '🫙', title: 'Preserving food', group: 'Live off the land',
  body: `
<h3>Drying</h3>
<p>Thin slices of fruit (apple, feijoa, tomato, banana), vegetables, herbs and lean meat can be dried in the sun on a screen covered with mesh, in a car on a hot day, or in a low oven. Store in sealed jars.</p>
<h3>Fermenting</h3>
<p>Sauerkraut and kimchi: finely shred cabbage, mix with salt (about 2% of the cabbage weight — 20 g per kg), pack tightly in a jar until liquid covers it, keep under the liquid with a weight. Ready in 1–4 weeks at room temperature. Adds vitamin C in winter.</p>
<h3>Salting and curing</h3>
<p>Fish and meat can be heavily salted and dried. It's a skill — practise before you need it.</p>
<h3>Bottling (preserving in jars)</h3>
<ul>
<li><b>High-acid foods</b> (fruit, tomatoes with added lemon juice, pickles, jams, chutneys): safe in a boiling water bath.</li>
<li><b>Low-acid foods</b> (vegetables, beans, meat, fish) <b>must be pressure-canned</b>. Bottling them in a water bath risks <b>botulism</b>, which can kill. If you don't have a pressure canner, dry, ferment or pickle these instead.</li>
<li>Throw out any jar with a bulging lid, leaking seal, spurting liquid or off smell. Don't taste it.</li>
</ul>
<h3>Storing harvests</h3>
<p>Pumpkins (cured in the sun for 2 weeks) keep 3–6 months. Potatoes and kūmara: cool, dark, dry. Onions and garlic: plaited and hung. Dried beans: in sealed jars for years.</p>`
},
{
  id: 'sea', icon: '🎣', title: 'Fishing & shellfish', group: 'Live off the land',
  body: `
<p class="warn"><b>Shellfish can be deadly.</b> Toxic algae makes mussels, oysters, pipi, tuatua, cockles, scallops, cat's eyes and kina poisonous — <b>cooking does not destroy the toxin</b>. Check MPI shellfish biotoxin warnings before gathering.</p>
<ul>
<li>Symptoms of shellfish poisoning: numbness or tingling around the mouth, face, hands or feet; difficulty swallowing or breathing; dizziness; vomiting. Usually within 10 minutes to 3 hours. Get medical help — call Healthline 0800 611 116 or 111.</li>
<li>Pāua, crab and crayfish are safer if the gut is removed completely before cooking. Finfish are not affected by algal toxins — but discard the liver.</li>
<li>Don't gather shellfish near stormwater outlets, marinas or for at least 2–3 days after heavy rain (sewage overflows).</li>
<li>Follow MPI daily limits and size rules, and respect rāhui. The NZ Fishing Rules app works offline once downloaded.</li>
<li><b>Easy fish from the shore around Auckland:</b> kahawai, snapper (in season), mullet, gurnard, piper. A simple rod, ledger rig, hooks and bait (pilchards, squid, or a bit of the last catch).</li>
<li>A cast net or set line may be restricted — check the rules.</li>
</ul>`
},
{
  id: 'forage', icon: '🌿', title: 'Foraging — safe and deadly plants', group: 'Live off the land',
  body: `
<p class="warn"><b>Golden rule: if you are not 100% sure, don't eat it.</b> Never let our daughter eat anything wild without checking with an adult. Never eat wild mushrooms — the deadly death cap grows in Auckland under oak trees.</p>
<h3>Common, easy-to-identify edibles in Auckland</h3>
<ul>
<li><b>Pūhā</b> (sow thistle) — boil, change the water once to reduce bitterness.</li>
<li><b>Watercress</b> — only from clean, fast-flowing water away from farms; always cook it.</li>
<li><b>Kawakawa</b> — leaves for tea (heart-shaped, often with holes from caterpillars).</li>
<li><b>Dandelion</b> — young leaves raw or cooked, roots roasted.</li>
<li><b>Chickweed, plantain, nasturtium</b> (leaves and flowers), <b>wild fennel</b> (strong aniseed smell — if it doesn't smell of aniseed, it isn't fennel).</li>
<li><b>Fruit:</b> feijoa (autumn), guava, loquat, blackberry (summer), plums, figs, citrus on unused land.</li>
<li><b>Pikopiko</b> (young curled fern fronds) — only from species you can positively identify; cook well.</li>
</ul>
<h3>DEADLY — never eat</h3>
<ul>
<li><b>Tutu</b> — shrub with drooping clusters of small black-purple berries. All parts are deadly (the seeds especially). Common in the Waitākere Ranges.</li>
<li><b>Karaka</b> — orange berries in summer; the raw kernels are deadly.</li>
<li><b>Hemlock</b> — looks like wild carrot or parsley, with purple blotches on a smooth stem and a mousy smell. Easily mistaken for fennel or carrot.</li>
<li><b>Ongaonga</b> (tree nettle) — its sting can be fatal. Don't touch.</li>
<li><b>Foxglove, arum lily, oleander, deadly nightshade, rhubarb leaves, raw kidney beans</b> (cook beans fully).</li>
<li><b>Any wild mushroom</b>, especially white-gilled ones near oak trees.</li>
</ul>
<p>If someone eats something suspicious: call the Poisons Centre <b>0800 764 766</b>. Keep a sample of the plant. Don't make them vomit.</p>`
},
{
  id: 'security', icon: '🔒', title: 'Security & community', group: 'Live off the land',
  body: `
<ul>
<li><b>Your neighbours are your best security.</b> Get to know them now. Agree to watch each other's houses and share news.</li>
<li>Keep supplies out of sight. Don't talk about how much you have outside the trusted circle.</li>
<li>Good locks, a sensor light (solar), a dog if you can. Close curtains at night.</li>
<li>Never confront intruders. Lock yourselves in a room, call 111.</li>
<li>In a long emergency, communities that organise do far better: a neighbourhood meeting point, a skills list (nurse, builder, mechanic, gardener), shared cooking, a roster to check on vulnerable people.</li>
<li>Your local marae and community centres are usually where community help is organised. They are on the map.</li>
</ul>`
},
{
  id: 'kids', icon: '🧒', title: 'Looking after our daughter', group: 'Family',
  body: `
<ul>
<li><b>Practise the plan together</b> — make it a game. Drop, Cover, Hold. Where to meet. Who picks her up. Our phone numbers by heart.</li>
<li>Find out the school's emergency plan: will they keep the children or release them? Who is on the pickup list? Add both of us and a backup adult.</li>
<li>Give her a job in an emergency (holding the torch, checking the pet, ticking the list). Jobs make children feel safe.</li>
<li>Keep a comfort item, a book or a game, and favourite snacks in her grab bag.</li>
<li>Keep routines going as much as possible — meals, bedtime, a story.</li>
<li>Talk honestly and simply: "Something big happened. We're together and we have a plan." Let her ask questions.</li>
<li>Limit news and adult worry-talk in front of her.</li>
<li>Watch for changes after the event — bad dreams, clinginess, stomach aches. Healthline and the school can help.</li>
</ul>`
},
{
  id: 'nav', icon: '🧭', title: 'Finding your way without a phone', group: 'Family',
  body: `
<ul>
<li>Phone GPS works <b>without mobile signal</b> — the blue dot on this app's map still works in airplane mode. The maps must be saved first (Map → Save maps).</li>
<li>Keep a paper Auckland street map in the car and a Topo50 map for any bush routes.</li>
<li><b>Sun:</b> in New Zealand the sun is in the north at midday. It rises in the east, sets in the west.</li>
<li>From West Auckland: the Waitākere Ranges are west (and higher ground); the city and Sky Tower are north-east; the Manukau Harbour is south.</li>
<li>Walking pace is about 4–5 km per hour on roads, 2 km per hour in rough bush. Plan routes you could walk with our daughter.</li>
</ul>`
},
];

// ---------------------------------------------------------------------------
// SUPPLIES — default kit list. q = quantity per person (or per household if hh)
// for the chosen number of days, unit, and whether it scales with days.
// ---------------------------------------------------------------------------
const SUPPLY_TEMPLATE = [
  // [group, name, perPersonPerDay | fixed, unit, scales(days)?, perPerson?, expires?]
  ['Water', 'Drinking water (minimum 3 L/person/day)', 3, 'L', true, true, true],
  ['Water', 'Extra water for washing and cooking (to 20 L/person/day)', 17, 'L', true, true, true],
  ['Water', 'Plain unscented bleach (for treating water)', 1, 'bottle', false, false, true],
  ['Water', 'Water filter (gravity or squeeze)', 1, '', false, false, false],
  ['Water', 'Rain tank with first-flush diverter', 1, '', false, false, false],
  ['Food', 'Ready-to-eat tins (fish, meat, beans, soup, fruit)', 2, 'tins', true, true, true],
  ['Food', 'Rice, pasta, oats', 0.25, 'kg', true, true, true],
  ['Food', 'Peanut butter, crackers, muesli bars', 1, 'serves', true, true, true],
  ['Food', 'Milk powder / UHT milk', 1, 'serves', true, true, true],
  ['Food', 'Cooking oil', 1, 'L', false, false, true],
  ['Food', 'Salt, sugar, stock, tea, coffee', 1, 'set', false, false, true],
  ['Food', 'Treats and comfort food', 1, 'pack', false, true, true],
  ['Food', 'Manual can opener', 2, '', false, false, false],
  ['Cooking', 'Gas BBQ bottle (9 kg) or camp stove + canisters', 1, '', false, false, false],
  ['Cooking', 'Spare gas', 1, 'bottle', false, false, false],
  ['Cooking', 'Matches / lighters in a sealed bag', 2, '', false, false, false],
  ['Health', 'First aid kit', 1, '', false, false, true],
  ['Health', 'Prescription medicines (extra supply)', 14, 'days', false, true, true],
  ['Health', 'Pain relief, antihistamine, rehydration sachets', 1, 'set', false, false, true],
  ['Health', 'P2/N95 masks', 5, '', false, true, false],
  ['Health', 'Hand sanitiser, soap', 2, '', false, false, true],
  ['Health', 'Toilet paper', 1, 'roll', true, false, false],
  ['Health', 'Sanitary items', 1, 'pack', false, false, false],
  ['Toilet', 'Two buckets with lids', 2, '', false, false, false],
  ['Toilet', 'Heavy-duty rubbish bags', 30, '', false, false, false],
  ['Toilet', 'Sawdust / dry soil / kitty litter', 1, 'bag', false, false, false],
  ['Toilet', 'Disposable gloves', 1, 'box', false, false, false],
  ['Power & light', 'Battery or wind-up radio', 1, '', false, false, false],
  ['Power & light', 'Head torch', 1, '', false, true, false],
  ['Power & light', 'LED lantern', 1, '', false, false, false],
  ['Power & light', 'Spare batteries (AA/AAA)', 1, 'pack', false, false, true],
  ['Power & light', 'Power banks (20,000 mAh)', 1, '', false, true, false],
  ['Power & light', 'Small solar panel charger', 1, '', false, false, false],
  ['Shelter & warmth', 'Sleeping bag', 1, '', false, true, false],
  ['Shelter & warmth', 'Warm clothes, beanie, raincoat', 1, 'set', false, true, false],
  ['Shelter & warmth', 'Tarpaulin, rope, duct tape', 1, 'set', false, false, false],
  ['Shelter & warmth', 'Tent', 1, '', false, false, false],
  ['Tools', 'Multi-tool / pocket knife', 1, '', false, false, false],
  ['Tools', 'Shovel, spade, crowbar', 1, 'set', false, false, false],
  ['Tools', 'Shifting spanner (gas and water shut-off)', 1, '', false, false, false],
  ['Tools', 'Fire extinguisher + fire blanket', 1, '', false, false, true],
  ['Money & documents', 'Cash in small notes', 1, 'week', false, false, false],
  ['Money & documents', 'Printed copy of this app (Print button)', 1, '', false, false, false],
  ['Money & documents', 'USB stick: ID, insurance, photos of house contents', 1, '', false, false, false],
  ['Growing', 'Open-pollinated seed bank (sealed tin)', 1, '', false, false, true],
  ['Growing', 'Seed-raising mix, trays, garden tools', 1, 'set', false, false, false],
  ['Grab bags', 'Grab bag packed for each person', 1, '', false, true, false],
  ['Grab bags', 'Grab bag in the car', 1, '', false, false, false],
  ['Child', 'Comfort toy, book, games, colouring', 1, 'set', false, false, false],
  ['Child', 'Spare clothes and shoes (current size)', 1, 'set', false, false, false],
  ['Pets', 'Pet food and water', 1, 'week', false, false, true],
];

const GRAB_BAG = [
  'Water (2 × 1.5 L) and snacks', 'Torch and spare batteries', 'Radio', 'First aid kit and medicines',
  'Copies of ID and key documents (or USB)', 'Cash', 'Phone charger and power bank',
  'Warm clothes, raincoat, beanie', 'Sturdy walking shoes', 'Toiletries, hand sanitiser, masks',
  'Emergency blanket', 'Whistle', 'Pen and notebook', 'Glasses / hearing aids', 'Comfort item (child)',
];

// ---------------------------------------------------------------------------
// SUPPLIER CATEGORIES with a short guide on who to line up.
// ---------------------------------------------------------------------------
const SOURCE_CATS = [
  ['produce', '🥕', 'Food & produce', 'Market gardeners, orchards, farmers\' markets (e.g. Oratia), roadside stalls, neighbours with big gardens. Ask what they grow each season and whether they\'d trade.'],
  ['eggs', '🥚', 'Eggs & chickens', 'Local hen keepers, poultry breeders, lifestyle blocks. Ask about point-of-lay hens, fertile eggs and feed.'],
  ['meat', '🥩', 'Meat & fish', 'Local farms that sell direct, home-kill butchers, fishing friends, hunters with a licence.'],
  ['seeds', '🌱', 'Seeds & plants', 'Heritage seed suppliers, community gardens, seed swaps, garden centres. Get open-pollinated seed you can save.'],
  ['water', '💧', 'Water & tanks', 'Water carriers, tank suppliers, neighbours with rain tanks or a bore.'],
  ['fuel', '⛽', 'Fuel & gas', 'Gas bottle refill/swap, firewood suppliers, people with a woodlot.'],
  ['tools', '🔧', 'Tools & building', 'Hardware, builders\' merchants, tradies you know, people with tools to lend.'],
  ['medical', '💊', 'Medical & pharmacy', 'Your pharmacy and GP, nurses or first-aiders you know, vets.'],
  ['feed', '🌾', 'Animal feed', 'Produce stores, farm supply, grain growers, horse feed suppliers.'],
  ['skills', '🧰', 'Skills & trades', 'Electricians, plumbers, mechanics, beekeepers, preservers, fishers, hunters, gardeners — people whose skills you could trade for.'],
  ['other', '📦', 'Other', 'Anyone else useful.'],
];

// Core medical points bundled with the app (OpenStreetMap, © OSM contributors, ODbL).
// [type, lat, lon, name, address, phone, emergencyDept, hours]
const CORE_POINTS = [
  ['H',-36.85974,174.77048,'Auckland City Hospital (incl. Starship children\'s)','2 Park Road, Grafton','09 307 8888',1,'24/7 emergency department'],
  ['H',-36.86958,174.63069,'Waitākere Hospital','55–75 Lincoln Road, Henderson','09 839 0000',1,'24/7 emergency department'],
  ['H',-36.7819,174.75678,'North Shore Hospital','124 Shakespeare Road, Takapuna','09 486 8900',1,'24/7 emergency department'],
  ['H',-36.9641,174.84135,'Middlemore Hospital','100 Hospital Road, Ōtāhuhu','09 276 0000',1,'24/7 emergency department'],
  ['H',-37.21752,174.90431,'Pukekohe Hospital','1 Tuakau Road, Pukekohe','09 237 0600',0,''],
  ['H',-36.8949,174.78002,'Greenlane Clinical Centre','214 Green Lane West','09 367 0000',0,'Outpatients — no emergency department'],
  ['U',-36.8645,174.63021,'White Cross Henderson','Lincoln Road, Henderson','',0,''],
  ['U',-36.90231,174.69277,'White Cross Avondale','2144 Great North Road, Avondale','09 828 8912',0,'Mo-Su 08:00-20:00'],
  ['U',-36.88188,174.73141,'White Cross St Lukes','52 St Lukes Road','09 815 3111',0,'Mo-Su 08:00-20:00'],
  ['U',-36.94252,174.84075,'White Cross Ōtāhuhu','Ōtāhuhu','',0,'24/7'],
  ['U',-36.88862,174.83075,'White Cross Lunn Avenue','110 Lunn Avenue, Mt Wellington','',0,''],
  ['U',-36.9086,174.75524,'Three Kings Accident & Medical','Three Kings','09 625 2999',0,'Mo-Su 08:00-20:00'],
  ['U',-36.92337,174.78356,'Onehunga Accident & Medical','Onehunga','',0,''],
  ['U',-36.78462,174.75319,'Shorecare Urgent Care Smales Farm','74 Taharoto Road, Takapuna','',0,'24/7'],
  ['U',-36.7309,174.72411,'Shorecare Urgent Care Northcross','50 Greville Road','09 489 7777',0,''],
  ['U',-36.78097,174.72115,'White Cross Glenfield','Glenfield','',0,''],
  ['U',-36.92238,174.91352,'Eastcare Urgent Care','Botany','09 277 1516',0,''],
  ['U',-36.93365,174.9112,'Botany Medical & Urgent Care','Town Centre Drive, Botany','09 280 1790',0,'Mo-Su 08:00-20:00'],
  ['U',-36.98889,174.8849,'Manukau City Accident & Medical','Manukau','',0,''],
  ['P',-36.91043,174.65178,'Glen Eden Pharmacy','226 West Coast Road, Glen Eden','09 818 5252',0,'Mo-Fr 08:30-17:30; Sa 09:00-13:00'],
  ['P',-36.91043,174.64986,'Westview Pharmacy','5 Glendale Road, Glen Eden','09 818 3388',0,'Mo-Fr 08:30-17:30; Sa 09:00-12:30'],
  ['P',-36.93782,174.65667,'Titirangi Pharmacy','Titirangi','09 817 7658',0,'Mo-Fr 08:30-18:00; Sa 09:00-13:30'],
  ['P',-36.90883,174.68369,'Health New Lynn Pharmacy','6 McCrae Way, New Lynn','09 827 7214',0,'Mo-Fr 08:00-20:00; Sa-Su 09:00-15:00'],
  ['F',-36.93397,174.57771,'Waiatarua Fire Station','464A Scenic Drive','09 814 9213',0,''],
  ['F',-36.96343,174.6289,'Laingholm Fire Station','75 Victory Road','09 817 5475',0,''],
  ['F',-36.86878,174.49076,'Bethells Valley Fire Station','Bethells Road','09 810 9142',0,''],
  ['F',-36.84876,174.5442,'Waitākere Fire Station','8 Township Road','09 810 9251',0,''],
  ['C',-36.9391,174.65587,'Titirangi War Memorial Hall','500 South Titirangi Road','',0,''],
  ['C',-36.86432,174.60266,'Rānui Community Centre','474 Swanson Road','',0,''],
];
