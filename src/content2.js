// ============================================================================
// OUR HOME — guides written for this household's own equipment.
// Tokens like {{car}} are filled from Our plan → Our home systems.
// ============================================================================

const HOME_DEFAULTS = {
  car: 'our PHEV', carModel: '', carOutlet: 1500, carVolts: 'unknown', carKwh: 12, carFuelL: 45, carNotes: '',
  inverter: '', inverterSocket: 'unknown',
  tankL: 0, tankCount: 1, tapWhere: 'the tank tap', tankNotes: '',
  oven: 'the pizza oven', ovenGas: 'unknown',
  bbq: 'the Big Green Egg', stove: '',
  radios: 'our handheld radios', radioCh: '', radioNotes: '',
  gasMeter: '', waterToby: '', switchboard: '',
};

// Appliances for the PHEV power calculator. [name, running W, avg W over a day, surge W, note]
const APPLIANCES = [
  ['Fridge', 150, 50, 900, 'Cycles on and off. Uses most power just after it starts.'],
  ['Chest freezer', 120, 40, 700, 'Keep it full and shut.'],
  ['Fridge-freezer (large)', 200, 70, 1200, ''],
  ['LED lights (×4)', 40, 40, 40, ''],
  ['Phone charging (×3)', 30, 30, 30, ''],
  ['Laptop', 60, 60, 60, ''],
  ['Wi-Fi router + fibre box', 25, 25, 25, 'Only useful if the internet still works.'],
  ['TV', 100, 100, 100, ''],
  ['Rice cooker', 700, 700, 700, 'About 30–40 minutes per batch.'],
  ['Slow cooker (low)', 200, 200, 200, 'Very efficient way to cook.'],
  ['Induction hob (medium)', 1200, 1200, 1200, 'Fine at medium. Full power may trip the car\'s limit.'],
  ['Microwave', 1200, 1200, 1500, 'Short bursts only.'],
  ['Electric frying pan', 1500, 1500, 1500, ''],
  ['Electric blanket', 80, 80, 80, 'Cheapest way to stay warm at night.'],
  ['CPAP / medical device', 60, 60, 60, ''],
  ['Small fan heater (low)', 1000, 1000, 1000, 'Uses the battery fast — avoid.'],
  ['Kettle', 2200, 2200, 2200, 'Usually too much for the car\'s plug — boil water on the BBQ instead.'],
  ['Water pump (if fitted)', 600, 600, 1500, ''],
];

const HOME_GUIDES = [
{
  id: 'h-power', icon: '⚡', title: 'Power cut: running the house from {{car}}',
  body: `
<div class="warn"><b>Why the solar panels don't help in a power cut:</b> our solar is "grid-tied" with no battery. By law it switches itself off the moment the grid goes down, so it can't push power into lines that people may be repairing. The panels can be in full sun and give nothing. {{inverterLine}}</div>
<h3>The car is our battery</h3>
<p>{{Car}} has a plug (up to about <b>{{carOutlet}} W</b>) and a battery of roughly <b>{{carKwh}} kWh</b>. When the battery runs low, the petrol engine recharges it. With a full tank, it can keep the fridge, freezer, lights and phones going for <b>days</b>.</p>
{{voltsLine}}
<h3>Set it up — step by step</h3>
<ol>
<li>Park the car <b>outside, in the open air</b> — on the driveway, not in the garage. The engine may start by itself to recharge, and exhaust fumes kill.</li>
<li>Keep it at least 3 metres from open windows and doors.</li>
<li>Turn the car on ("ready" mode) and switch on the power outlet as the car's manual explains. {{carNotes}}</li>
<li>Use a <b>heavy-duty, outdoor-rated extension lead</b> (15 A or 10 A rated, fully unwound — a coiled lead can overheat). Run it to a multi-box inside.</li>
<li>Plug in the <b>fridge and freezer first</b>. Then lights and phone chargers.</li>
<li>Unplug the fridge and freezer when you want to use the rice cooker or electric pan, then plug them back in.</li>
<li>Check the car's battery and fuel each morning and evening. Keep at least a quarter tank for driving if we must leave.</li>
</ol>
<div class="warn"><b>Never</b> plug the car into a wall socket or try to power the house's wiring through a socket ("back-feeding"). It is illegal, can start a fire, and can kill a lineworker. Only plug appliances <b>directly</b> into the lead. An electrician can fit a proper inlet and changeover switch if we want the house circuits powered.</div>
<h3>What it can and can't run</h3>
<p>Under {{carOutlet}} W at once is fine. Use the <a data-go="tool:power">power calculator</a> to check a combination and how long the battery lasts.</p>
<ul>
<li>✅ Fridge, freezer, lights, phone and laptop charging, radio, electric blanket, slow cooker, rice cooker (alone).</li>
<li>⚠️ Microwave, induction hob, electric pan — one at a time, with the fridge unplugged.</li>
<li>❌ Kettle, oven, heaters, hot water cylinder, clothes dryer — too much power.</li>
</ul>
<h3>Making the fuel last</h3>
<ul>
<li>Fridge and freezer only need power for a few hours spread over the day. Run them 1 hour on, 1 hour off if fuel is short.</li>
<li>Open the fridge as little as possible. Put frozen water bottles from the freezer in the fridge.</li>
<li>Do heavy cooking with the BBQ, pizza oven or Egg instead.</li>
<li>Fill the car's tank as soon as a power cut looks like lasting — petrol stations need power to pump.</li>
</ul>`
},
{
  id: 'h-water', icon: '🚰', title: 'Water from our tanks',
  body: `
<p>Our rain tanks {{tankLine}} feed <b>{{tapWhere}}</b> by gravity, so <b>it keeps working with no power</b>.</p>
<h3>Getting water</h3>
<ol>
<li>Fill clean buckets, jerry cans and bottles straight from the tap. Pressure is low, so be patient.</li>
<li>Label containers: <b>DRINKING</b> (treated) and <b>WASHING</b> (untreated).</li>
<li>Treat drinking water — rainwater from a roof can carry bird and possum droppings.
  <ul><li><b>Boil:</b> rolling boil for 1 minute, cool with the lid on. <b>Best.</b></li>
  <li><b>Or bleach:</b> 5 drops of plain unscented bleach per litre, stir, wait 30 minutes.</li></ul></li>
<li>Untreated tank water is fine for washing, flushing the toilet (pour a bucket into the bowl), cleaning and the garden.</li>
</ol>
<h3>Making it last</h3>
<p>{{tankDays}}</p>
<ul>
<li>Drinking and cooking first. Then hand washing. Then everything else.</li>
<li>Re-use: dish water → toilet flushing. Shower water (bucket under you) → garden.</li>
<li>Check the tank level weekly in a long emergency. Write it in the notes.</li>
</ul>
<h3>Protect the tank</h3>
<ul>
<li><b>Ashfall or smoke:</b> disconnect the downpipes from the tank so ash doesn't wash in.</li>
<li>Keep the lid and mesh screens on. Keep gutters clean. Clean the first-flush diverter after dry spells.</li>
<li>If the water smells, looks cloudy, or an animal gets in, don't drink it untreated.</li>
</ul>
{{tankNotes}}`
},
{
  id: 'h-cook', icon: '🔥', title: 'Cooking with no power — easiest first',
  body: `
<p>Always cook <b>outdoors</b>. Every fuel-burning cooker makes carbon monoxide.</p>
<table><tr><th>Option</th><th>How hard</th><th>Best for</th></tr>
<tr><td><b>1. Electric cooker on {{car}}</b></td><td>Easiest</td><td>Rice cooker, slow cooker, electric pan. See <a data-go="home:h-power">Power cut</a>.</td></tr>
<tr><td><b>2. Camp stove (butane)</b>{{stoveLine}}</td><td>Easy</td><td>Boiling water, quick meals.</td></tr>
<tr><td><b>3. {{oven}} (wood)</b></td><td>Medium</td><td>Bread, roasting, boiling a pot. See <a data-go="home:h-oven">Pizza oven</a>.</td></tr>
<tr><td><b>4. {{bbq}} (charcoal)</b></td><td>Medium</td><td>Long cooks, stews, baking, boiling. See <a data-go="home:h-egg">Big Green Egg</a>.</td></tr>
<tr><td><b>5. Open fire</b></td><td>Harder</td><td>Last resort, in a fire pit or the pizza oven.</td></tr></table>
<h3>Simple meals that work on anything</h3>
<ul>
<li><b>Rice:</b> 1 cup rice + 1½ cups water, lid on, boil, then lowest heat 15 min. Or boil 5 min then wrap the pot in towels for 30 min (hay-box).</li>
<li><b>Porridge:</b> 1 cup oats + 2 cups water or milk, stir 5 minutes.</li>
<li><b>One-pot stew:</b> tin of tomatoes + tin of beans + any vegetables + rice or pasta + water. Simmer 20 minutes.</li>
<li><b>Flatbread:</b> 2 cups flour + ¾ cup water + pinch of salt (+ oil). Knead, flatten, cook on a hot pan, pizza stone or Egg grid 1–2 minutes each side.</li>
<li><b>Boiling water to drink:</b> a big pot on any of the above — 1 minute at a rolling boil.</li>
</ul>`
},
{
  id: 'h-egg', icon: '🥚', title: 'Big Green Egg — how to use it',
  body: `
<p>A ceramic charcoal cooker that holds heat for hours on very little fuel. Once it's lit, it's like an outdoor oven.</p>
<h3>Light it (15 minutes)</h3>
<ol>
<li>Open the lid. Open the <b>bottom vent</b> (draft door at the front) fully. Take off the metal top cap or open it fully.</li>
<li>Lift out the cooking grid. If there's lots of ash, scrape it out through the bottom door.</li>
<li>Fill the firebox with <b>lump charcoal</b> up to just above the holes in the fire ring. Big pieces at the bottom, small on top.</li>
<li>Push 2–3 natural fire-starter cubes (or twists of newspaper with a little cooking oil) into the charcoal and light them. <b>Never use petrol, kerosene or lighter fluid.</b></li>
<li>Leave the lid <b>open</b> for about 10 minutes until a few coals glow red and the starters have burnt away.</li>
<li>Put the grid back. Close the lid.</li>
</ol>
<h3>Control the heat</h3>
<p>More air = hotter. Less air = cooler. Small changes, then wait 10 minutes to see the result.</p>
<table><tr><th>Cooking</th><th>Temperature</th><th>Bottom vent</th><th>Top</th></tr>
<tr><td>Slow cook, stew</td><td>110–140°C</td><td>Open about 1 cm</td><td>Petals barely open</td></tr>
<tr><td>Roast, bake, boil a pot</td><td>160–200°C</td><td>Open 3–5 cm</td><td>Petals half open</td></tr>
<tr><td>Pizza, sear, quick cook</td><td>230°C+</td><td>Fully open</td><td>Cap off / fully open</td></tr></table>
<p>If it gets too hot, close both vents a little — it takes a while to come down, so don't overshoot.</p>
<h3>Opening the lid safely ("burp it")</h3>
<p class="warn">When hot, <b>lift the lid only a few centimetres for 3 seconds</b>, then open fully. Opening it fast can make a flash of flame shoot out.</p>
<h3>Cooking</h3>
<ul>
<li>Put a cast-iron pot or pan straight on the grid. It works like a stove top and oven at once.</li>
<li>Use a pot with a lid to boil water or cook rice and stews.</li>
<li>Bread: pizza stone on the grid at 200°C, 30–40 minutes for a loaf.</li>
</ul>
<h3>Put it out and save the charcoal</h3>
<ol>
<li>Close the bottom vent completely. Close the top completely.</li>
<li>The fire goes out from lack of air. Leftover charcoal can be used again next time — it saves fuel.</li>
<li><b>Never pour water in</b> — it can crack the ceramic. Leave it to cool for several hours.</li>
</ol>
<p>When charcoal runs out, see <a data-go="home:h-charcoal">Making charcoal</a>. Small pieces of dry hardwood can be used in an emergency, but they burn faster and smokier than charcoal.</p>`
},
{
  id: 'h-oven', icon: '🍕', title: 'Pizza oven — cooking with wood',
  body: `
<p>{{oven}} {{ovenGasLine}}</p>
<h3>Light it with wood</h3>
<ol>
<li>Use <b>dry hardwood</b> cut into small pieces about the size of your forearm's width and 12–15 cm long. Mānuka, kānuka, gum, fruit-tree wood are all good. Pine works but burns fast.</li>
<li><b>Never burn</b> treated timber (green-tinged building wood — it releases arsenic), painted wood, plywood, MDF or driftwood.</li>
<li>Open the chimney vent fully. Put 1 firelighter and 2–3 small sticks in the fuel tray or at the back of the oven. Light it.</li>
<li>When the sticks catch, add 2 bigger pieces. Close the door partly to draw the fire.</li>
<li>Add one piece of wood every few minutes. It gets very hot in 15–20 minutes.</li>
</ol>
<h3>Cooking</h3>
<ul>
<li><b>Flatbread or pizza:</b> on the stone at full heat — about 1–2 minutes. Turn it halfway.</li>
<li><b>Pot of rice, stew or water:</b> let the fire settle lower, put a cast-iron pot in the mouth of the oven.</li>
<li><b>Roast vegetables, kūmara, potatoes:</b> in a cast-iron pan, 20–40 minutes, turning.</li>
<li>Keep children well back — the outside gets dangerously hot.</li>
</ul>
<p>The oven is also the easiest place to <a data-go="home:h-charcoal">make charcoal</a> for the Egg.</p>`
},
{
  id: 'h-charcoal', icon: '⚫', title: 'Making charcoal (tin method)',
  body: `
<p>Charcoal is wood that has been "cooked" without air. You can make it from garden wood in a sealed tin inside a fire.</p>
<h3>You need</h3>
<ul><li>A metal tin with a tight lid — paint tin, biscuit tin or a small steel drum. Wash out paint tins first and burn them empty once.</li>
<li>A nail and hammer.</li><li>Dry hardwood: mānuka, kānuka, gum, fruit-tree prunings. Thumb-to-wrist thickness, cut to fit the tin. Take the bark off if you can.</li>
<li>A good wood fire (pizza oven, fire pit or brazier). Tongs or heavy gloves.</li></ul>
<h3>Steps</h3>
<ol>
<li>Punch <b>one small hole</b> in the lid with the nail.</li>
<li>Pack the tin full of wood pieces. Put the lid on tightly.</li>
<li>Put the tin into the middle of the hot fire.</li>
<li>After a while, smoke and then a small <b>flame will jet out of the hole</b> — that's the wood gas burning. This is normal.</li>
<li>When the flame from the hole <b>stops</b> (usually 30–90 minutes, depending on the tin size), lift the tin out with tongs.</li>
<li>Put it somewhere safe on bare ground or bricks. <b>Do not open it until it is completely cold</b> — several hours. If air gets in while it's hot, the charcoal catches fire.</li>
<li>Open: you should have black, light pieces that snap cleanly. Brown bits weren't cooked long enough — put them back in next time.</li>
</ol>
<p>Store charcoal dry, in a lidded bin. A 20-litre tin makes enough for one or two Egg cooks.</p>
<p class="small muted">Safety: do this outdoors, away from the house and dry grass, with water nearby. Not during a fire ban.</p>`
},
{
  id: 'h-radio', icon: '📡', title: 'Our walkie-talkies',
  body: `
<p>We have {{radios}}. When phones are down, these are how we talk to each other around the neighbourhood — roughly <b>1–5 km</b> between houses, much further from a hilltop.</p>
<h3>Our family channel: <b>{{radioCh}}</b></h3>
<p class="small">Every radio uses the same channel <b>and</b> the same squelch tone (on Unidens it's called a <b>CTCSS code</b>). The tone means our radios stay quiet unless one of <i>us</i> is talking.</p>
<h3>Using one — step by step</h3>
<ol>
<li>Turn the top knob to switch it on. Turn the volume up.</li>
<li>Check the screen shows <b>our channel ({{radioCh}})</b>. If not, use the arrow keys to change it.</li>
<li>To talk: <b>hold the button on the side</b>, wait one second, speak slowly with the radio a hand's width from your mouth.</li>
<li><b>Let go of the button to listen.</b> You can't hear anyone while you're holding it.</li>
<li>Say who you're calling, then who you are: <i>"{{homeAdult}}, {{homeAdult}}, this is {{away}}."</i> Wait. When they answer, give the message, then say <i>"over"</i> when you've finished.</li>
<li>Keep messages short: where you are, are you OK, what you need.</li>
</ol>
<h3>When the phones are down — radio schedule</h3>
<ul>
<li>To save batteries, radios don't need to be on all day. Switch on for <b>5 minutes on the hour</b> (8:00, 9:00, 10:00…) and call each other.</li>
<li>If someone is missing or there's danger, leave the radio on.</li>
<li>Charge radios from the car's USB or plug whenever it's running. Keep the spare batteries charged — check them monthly.</li>
</ul>
<h3>Setting up all the radios (do this once, then test)</h3>
<ol>
<li><b>Unidens:</b> set the channel, then the CTCSS code. Write the code number down. The Uniden manual has a table showing what that code is in <b>Hz</b> (e.g. 100.0 Hz).</li>
<li><b>Baofeng:</b> set the same frequency (PRS channel 1 = 476.425 MHz, each channel +0.025 MHz). Set bandwidth to <b>Narrow</b>, low power, and the transmit and receive tone (T-CTCS / R-CTCS) to the same <b>Hz</b> as the Unidens. The Baofeng uses Hz, not Uniden's code numbers.</li>
<li><b>Test:</b> talk from each radio to every other one. If one can't hear another, the tone doesn't match — check the Hz.</li>
<li>Write the channel and tone on a label on the back of every radio.</li>
</ol>
<div class="note small"><b>The tone isn't privacy</b> — anyone on that channel without a tone can still hear us, and someone talking on the channel blocks it even if we can't hear them. If the channel is busy, move everyone to the backup channel. <b>In a real emergency, turn the tone OFF</b> (code 0 / OFF) so you can hear anyone nearby calling for help.</div>
<h3>The Baofeng — extra uses</h3>
<ul>
<li>The Baofeng also has an <b>FM radio</b> mode — tune to <b>101.4 FM (RNZ National)</b> for official emergency news.</li>
<li>It can <b>listen</b> on other bands too — for example marine VHF channel 16 (156.800 MHz), the distress and calling channel, for news from the coast.</li>
<li>Only <b>transmit</b> on frequencies we're allowed to use. The one exception: <b>when a life is at risk you may use any radio on any frequency to call for help.</b></li>
<li>Licence-free walkie-talkies in NZ use the <b>PRS / UHF CB band (476–477 MHz)</b>. Channels 5 and 35 are <i>not</i> monitored emergency channels in NZ — scan for anyone listening and ask for help.</li>
</ul>
{{radioNotes}}
<p class="small muted">Use the PRS band (476–477 MHz) for family talk — it's licence-free. Avoid channels 1–8 and 31–38 (repeaters), 11 (truckies' call channel), 5 and 35, and 22/23 (data only).</p>`
},
{
  id: 'h-shutoff', icon: '🔧', title: 'Turning off gas, water & power',
  body: `
<ul>
<li><b>Gas meter / bottles:</b> {{gasMeter}} — quarter-turn the valve so the handle is across the pipe. Only turn gas off if you smell gas, hear hissing or there's damage. Don't turn it back on yourself — a gasfitter must relight appliances.</li>
<li><b>Water toby (main tap at the street):</b> {{waterToby}} — usually under a small lid near the front boundary. Turn clockwise. You may need a toby key or long screwdriver.</li>
<li><b>Main switchboard:</b> {{switchboard}} — flip the main switch to OFF. Use dry hands; never touch it if you're standing in water.</li>
<li><b>Hot water cylinder:</b> turn off its power at the switchboard before draining it for drinking water.</li>
</ul>
<p>Add photos of each in <a data-go="tab:plan">Our plan → Documents</a> so anyone can find them.</p>`
},
];

// ============================================================================
// AWAY — for the family member who travels for work (flight crew) when stuck overseas. Numbers verified
// against NZ SafeTravel and Australia's Smartraveller (Oct 2026).
// ============================================================================
const AWAY_GENERAL = {
  mfat: [['+64 99 20 20 20','NZ consular emergency (MFAT) — from overseas, 24/7'],['0800 30 10 30','Same line — from within NZ']],
  steps: [
    '<b>Stay with the crew and follow the airline.</b> Crew on a trip are the airline\'s responsibility: crew scheduling and the captain coordinate hotels, transport and getting everyone home. Keep the crew contact / ops number in your phone and on paper.',
    'Message home as soon as you can: <b>"Safe. Where I am. Phone battery %."</b> Short messages get through when calls don\'t.',
    'If phones are down: try hotel Wi-Fi and WhatsApp/iMessage/Messenger, the hotel landline, a crew member\'s phone, or satellite messaging on your iPhone (Emergency SOS / Messages via satellite, where available).',
    'Register with <b>SafeTravel</b> (safetravel.govt.nz) if you\'re stranded more than a day or two — the NZ Government uses it to find and contact New Zealanders in a crisis.',
    'Follow local official alerts (see the country below). Do what locals are told to do.',
    'Don\'t try to get home by risky routes. The safest way home is usually waiting for the airline or an official evacuation.',
    'If you are separated from the crew and in trouble: local emergency number first, then the NZ embassy/consulate, then the MFAT 24/7 line.',
  ],
  checkin: [
    'We agree a daily check-in time in NZ time (set it in Our plan). One message a day, even "all fine, no news".',
    'If a check-in is missed, wait 12 hours before worrying — networks may be down. Then {{homeAdult}} contacts the airline\'s crew support line.',
    'At home, {{homeAdult}} looks after our daughter and runs the plan. {{away}} does not need to do anything about home — just keep herself safe and get back when it\'s safe.',
    'If both of us are away or can\'t get home, the backup adult collects our daughter (set in Our plan).',
  ],
  kit: [
    'Power bank (airline-approved, in cabin bag) and charging cable',
    'Small cash: US$100, ¥10,000, A$100 in small notes (adjust to the trip)',
    'Photo of passport, crew ID and visa pages on phone + paper copy in bag',
    'Printed card: family numbers, airline crew support, MFAT 24/7 line, home address',
    'This app installed on your phone (it works offline, including this Away section)',
    'Prescription medicines for 3 extra days, plus a copy of the prescription',
    'Water purification tablets, a few muesli bars, electrolyte sachets',
    'Light rain jacket, comfortable walking shoes (not just uniform shoes)',
    'Small torch or head torch',
    'Earplugs and eye mask (evacuation centres are noisy)',
    'Offline maps downloaded for regular layover cities (Google Maps or Organic Maps)',
    'eSIM or roaming that works in each country; know how to switch it on',
  ],
};

const AWAY_REGIONS = [
{
  id: 'na', flag: '🇺🇸🇨🇦', name: 'North America (USA & Canada)', tz: 'America/Los_Angeles',
  zones: [['Los Angeles / Vancouver / San Francisco','America/Los_Angeles'],['Honolulu','Pacific/Honolulu'],['Houston / Chicago','America/Chicago'],['New York','America/New_York']],
  numbers: [['911','Police, fire, ambulance (USA and Canada)']],
  alerts: [
    'Wireless Emergency Alerts arrive on your phone automatically (keep alerts switched on in Settings).',
    'FEMA app (USA) and local TV/radio. In Canada: Alert Ready on phones.',
  ],
  hazards: [
    '<b>Earthquakes</b> — California, Pacific Northwest, Vancouver. Drop, Cover, Hold exactly as at home.',
    '<b>Tsunami</b> — West Coast and Hawaii. Same rule: long or strong — get gone, inland or uphill.',
    '<b>Wildfire smoke</b> — summer and autumn. Stay inside, close windows, wear an N95 mask outside.',
    '<b>Hurricanes</b> (June–November) — Gulf Coast, East Coast, Hawaii. Follow evacuation orders.',
    '<b>Winter storms</b> — airports can close for days. Stay in the hotel, keep warm, keep charged.',
  ],
  missions: [
    ['NZ Embassy, Washington DC','+1 202 328 4848'],
    ['NZ Consulate-General, Los Angeles','+1 310 566 6555'],
    ['NZ Consulate-General, Honolulu','+1 808 675 5555'],
    ['NZ Consulate-General, New York','+1 212 832 4038'],
    ['NZ High Commission, Ottawa (Canada)','+1 613 238 5991'],
  ],
},
{
  id: 'jp', flag: '🇯🇵', name: 'Japan', tz: 'Asia/Tokyo',
  zones: [['Tokyo / Osaka','Asia/Tokyo']],
  numbers: [['110','Police'],['119','Fire and ambulance']],
  alerts: [
    '<b>Safety Tips</b> app (Japan Tourism Agency) — earthquake, tsunami and weather alerts in English. Install before the trip.',
    '<b>NHK World-Japan</b> app and radio for English news.',
    'Phone alerts make a loud distinctive sound for earthquake early warnings — you may get a few seconds\' notice. Drop, Cover, Hold immediately.',
    'Evacuation shelters (避難所 hinanjo) and tsunami evacuation buildings are signposted with green signs.',
  ],
  hazards: [
    '<b>Earthquakes</b> are frequent. Hotels are built for them — stay inside during shaking, away from windows. Don\'t use lifts after a big one.',
    '<b>Tsunami</b> — near the coast (including Tokyo Bay and Osaka Bay areas): if warned, go to a tsunami evacuation building or high ground immediately.',
    '<b>Typhoons</b> (mainly June–October) — transport shuts down. Stay in the hotel until the all clear.',
    '<b>Heat</b> in summer — drink water, use shade.',
  ],
  missions: [['NZ Embassy, Tokyo (20-40 Kamiyama-cho, Shibuya-ku)','+81 3 3467 2271']],
},
{
  id: 'au', flag: '🇦🇺', name: 'Australia', tz: 'Australia/Sydney',
  zones: [['Sydney / Melbourne / Brisbane','Australia/Sydney'],['Perth','Australia/Perth']],
  numbers: [['000','Police, fire, ambulance'],['112','Also works from mobiles']],
  alerts: [
    'ABC Local Radio is the official emergency broadcaster.',
    'State apps: Hazards Near Me (NSW), VicEmergency (Victoria), QLD alerts. Emergency alerts also come by text.',
  ],
  hazards: [
    '<b>Bushfires</b> (mainly spring–summer) — follow "Leave now" warnings immediately; smoke can close airports.',
    '<b>Cyclones and floods</b> in the north and Queensland (November–April).',
    '<b>Heat</b> — very hot days are dangerous. Stay in air conditioning, drink water.',
  ],
  missions: [
    ['NZ High Commission, Canberra','+61 2 6270 4211'],
    ['NZ Consulate-General, Sydney','+61 2 9270 5900'],
    ['NZ Consulate-General, Melbourne','+61 3 9678 0201'],
  ],
},
{
  id: 'pac', flag: '🌴', name: 'South Pacific islands', tz: 'Pacific/Fiji',
  zones: [['Fiji','Pacific/Fiji'],['Samoa','Pacific/Apia'],['Tonga','Pacific/Tongatapu'],['Rarotonga','Pacific/Rarotonga'],['Vanuatu','Pacific/Efate'],['New Caledonia','Pacific/Noumea'],['Tahiti','Pacific/Tahiti']],
  numbers: [
    ['Fiji','911 medical · 917 police · 910 fire'],
    ['Samoa','911 police, fire, medical'],
    ['Tonga','933 ambulance · 922 police · 999 fire'],
    ['Cook Islands','999 general · 22 499 police · 996 fire · Rarotonga Hospital 22 664'],
    ['Vanuatu','115 ambulance (Port Vila, Luganville) · 111 police · 113 fire'],
    ['New Caledonia','15 ambulance · 17 police · 18 fire · 112 also works'],
    ['French Polynesia','15 ambulance · 17 police · 18 fire'],
  ],
  alerts: [
    'Local radio is the main source of warnings. Hotels usually relay Civil Defence/National Disaster Management Office instructions.',
    'Fiji Meteorological Service covers cyclone warnings for much of the region.',
  ],
  hazards: [
    '<b>Cyclones</b> — season usually November to April. Flights stop before landfall. Stay in the strongest part of the hotel, away from windows, until the all clear. Islands can be cut off for days afterwards.',
    '<b>Earthquake and tsunami</b> — Tonga, Samoa, Vanuatu and Fiji are in very active zones. Long or strong — get gone: inland or uphill immediately, don\'t wait for sirens.',
    '<b>Volcanoes</b> — Tonga and Vanuatu. Ash closes airports, sometimes for days.',
    '<b>Disease</b> — dengue outbreaks are common. Insect repellent, long sleeves at dawn and dusk.',
    'Hospitals are limited. Serious cases are flown to NZ or Australia — keep travel/crew insurance details handy.',
  ],
  missions: [
    ['NZ High Commission, Suva (Fiji)','+679 331 1422'],
    ['NZ High Commission, Apia (Samoa)','+685 21 711'],
    ['NZ High Commission, Nukuʻalofa (Tonga)','+676 23122'],
    ['NZ High Commission, Rarotonga (Cook Islands)','+682 22 201'],
  ],
},
];
