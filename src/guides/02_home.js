// ---------------------------------------------------------------- OUR HOME
G({ id: 'car-power', cat: 'home', icon: '⚡', title: 'Power cut: running the house from {{car}}',
  one: 'The car is our battery. Car outside → READY → AC button → transformer → fridge and freezer.' }, `
## Why the solar panels don't help
! Our solar{{inverterNote}} is **grid-tied with no battery**. By law it switches itself off the moment the grid goes down, so it can't push power into lines that people may be repairing. The panels can be in full sun and give **nothing**. Don't waste time on it — use the car.
## What {{car}} can do
- {{carModel}} has a big battery (about **{{carKwh}} kWh**) and a petrol engine that recharges it.
- It has built-in power sockets (one in the back of the centre console, one in the boot) that give up to about **{{carOutlet}} W** in total.
- With a full tank of petrol ({{carFuel}} L) it can keep the fridge, freezer, lights, radios and phones going for **several days**.
! {{voltsWarning}}
## You'll need
[ ] The car, fuelled
[ ] The step-up transformer (100 V → 230 V) — if our sockets are 100 V
[ ] A heavy-duty outdoor extension lead (10 A or 15 A rated), long enough to reach inside
[ ] A multi-box (power board) — one with a reset/overload switch
## Set it up — step by step
1. Park the car **outside in the open air** — on the driveway, nose out. **Never in the garage**, even with the door open. The engine starts by itself to recharge, and exhaust fumes kill.
1. Keep the exhaust at least 3 metres from any open window, door or vent.
1. Get in, foot on the brake, press the **POWER** button until **READY** shows on the dash.
1. Put the car in **P** (Park) and put the handbrake on.
1. Press the **AC power button** (on the dash, to the left of the steering wheel). The light on the button comes on.
1. Plug the transformer into the socket in the boot (it's heavy — put it on the ground next to the car, keep it dry).
1. Plug the extension lead into the transformer. **Unwind the whole lead** — a coiled lead can overheat.
1. Run the lead inside through a window or a door you can nearly close. Plug the multi-box in.
1. Plug in the **fridge first**. Wait one minute. Then the **freezer**. Wait one minute. Then lights and phone chargers.
1. Lock the car with the spare key if you need to (the power keeps going) — keep a key with you.
+ It's working when the fridge light comes on and you can hear it hum. The car may start its engine by itself after a while — that is normal, it's recharging.
## Using it day to day
1. Check the car's fuel and battery morning and night. **Keep at least a quarter tank** in case we need to drive away.
1. Only run big things one at a time: unplug the fridge for 30 minutes while you use the rice cooker or electric frying pan, then plug it back in.
1. Use the [[tool:power|power calculator]] to check what fits under {{carOutlet}} W.
1. To save fuel: run the fridge and freezer for **1 hour on, 1 hour off** during the day, and leave them off overnight with the doors shut. A full freezer stays frozen through a night.
1. Fill the tank whenever petrol is available — service stations need power to pump.
## What it can and can't run
| Appliance | OK? |
| Fridge, freezer | ✅ Yes |
| Lights, phone & laptop charging, radio, Wi-Fi router | ✅ Yes |
| Electric blanket (warmest way to sleep) | ✅ Yes |
| Slow cooker, rice cooker | ✅ One at a time |
| Microwave, induction hob, electric frying pan | ⚠️ One at a time, fridge unplugged |
| Kettle, toaster, heaters, oven, hot water cylinder, dryer | ❌ Too much power |
## Never do this
! **Never plug the car into a wall socket** or try to power the house wiring through a socket ("back-feeding"). It's illegal, can start a fire, and can kill a lineworker working on the street. Only plug appliances **directly** into the lead.
! Never run the car in a closed garage, even "just for a minute".
> **Upgrade idea:** an electrician can fit a proper inlet socket and changeover switch so the car can safely run chosen house circuits (lights, fridge circuit). Or add a home battery with backup to the solar — ask the solar installer about a SolarEdge battery with backup.
`);

G({ id: 'tank-water', cat: 'home', icon: '🚰', title: 'Water from our tank',
  one: '{{tank}} by gravity from {{tapWhere}}. Works with no power. Treat it before drinking.' }, `
## What we have
- Our rain tank holds **{{tank}}** when full. It feeds **{{tapWhere}}** by gravity — no pump, so **it works in a power cut**.
- At **20 L per person per day** (drinking, cooking, washing) a full tank lasts our {{people}} people about **{{tankDays20}} days**. At the bare minimum of **3 L** each per day, about **{{tankDays3}} days**.
- The tap is near the bottom, so nearly all the water comes out. The last few centimetres stay in the tank — that's where sludge settles, which is good.
## Getting water — step by step
1. Take clean containers to the tap: buckets with lids, 10–20 L jerry cans, big bottles.
1. Rinse each container with a little tank water first.
1. Open the tap slowly. Pressure is low, so it takes a few minutes to fill a 20 L container.
1. Close the tap fully when you're done — a dripping tap can empty the tank.
1. Label containers with tape and a marker: **DRINKING** (treated) and **WASHING** (untreated).
## Making it safe to drink
> Rain off a roof picks up bird and possum droppings, leaves and dust. It's usually fine for washing but must be **treated** before drinking, especially for children and older people.
1. **Boil (best):** bring to a full rolling boil for **1 minute**. Let it cool with the lid on. Pour into clean DRINKING containers.
1. **Or bleach:** add **5 drops of plain, unscented household bleach per litre** (so 100 drops — about 1 teaspoon — per 20 L). Stir. Wait **30 minutes** before drinking. It should smell faintly of chlorine.
1. **Or filter + bleach:** if the water looks cloudy, pour it through a clean cloth first, then bleach with **double** the drops.
+ Treated water should be clear, with no smell except a faint chlorine smell.
## What untreated tank water is good for
- Washing hands and bodies (not open wounds), dishes (rinse with treated water), clothes.
- Flushing the toilet: pour a bucket straight into the toilet bowl — it flushes by itself. Only if the sewer is working.
- The garden and the chickens.
## Making it last
1. Drinking and cooking first. Then hand washing. Then everything else.
1. Re-use: dishwater → toilet flushing. Shower over a bucket → garden.
1. Check the tank level once a week. Knock on the side from the top down — the sound changes from hollow to dull at the water line. Write the level in the notes below.
1. When rain is forecast, make sure the downpipes, gutters and first-flush diverter are clear.
## Keeping the tank healthy
[ ] Lid closed and mesh screens on the inlet and overflow (keeps mosquitoes, rats and possums out).
[ ] Gutters cleaned every 6 months; trees trimmed back from the roof.
[ ] First-flush diverter emptied and cleaned after dry spells.
[ ] **Ashfall or smoke:** disconnect the downpipes from the tank so ash can't wash in.
[ ] If the water smells, looks cloudy, or a dead animal is found: don't drink it untreated; ask Healthline (0800 611 116) for advice on cleaning the tank.
`);

G({ id: 'cook-options', cat: 'home', icon: '🔥', title: 'Cooking with no power — easiest first',
  one: 'Car + rice cooker → Ooni on gas → Big Green Egg → wood fire. Always outdoors.' }, `
! Every gas, charcoal and wood cooker makes **carbon monoxide**. Use them **outdoors only** — never in the house, garage or under a closed carport.
## Pick the easiest one available
| Cooker | How hard | Use it for |
| 1. Electric cookers on {{car}} | Easiest | Rice cooker, slow cooker, electric frying pan. See [[car-power]]. |
| 2. {{oven}} on gas | Easy | Boiling water, pots, frying, bread, pizza. See [[ooni]]. |
| 3. {{bbq}} (charcoal) | Medium | Stews, roasting, baking, boiling — uses very little fuel. See [[egg]]. |
| 4. {{oven}} on wood | Medium | When the gas runs out. See [[ooni]]. |
| 5. Hay box | Easy | Finishing rice, beans and stews with no fuel. See [[haybox]]. |
## Fuel we should keep
[ ] 2 full 9 kg LPG gas bottles (one in use, one spare). One bottle cooks for the family for roughly 2–3 weeks if used carefully.
[ ] 2 bags of lump charcoal for the Egg, plus natural fire-starter cubes.
[ ] A stack of dry hardwood split small (wrist thickness, 15 cm long) for the Ooni.
[ ] Matches and lighters in a sealed bag.
## Ways to save fuel
- Put a lid on every pot — it boils in half the time.
- Soak beans and rice before cooking.
- Bring things to the boil, then finish them in a hay box ([[haybox]]).
- Cook several things at once while the Egg or Ooni is hot — bake bread straight after dinner.
- Boil water for drinking in big batches.
## Simple meals
See [[recipes]] for step-by-step meals made only from the pantry.
`);

G({ id: 'egg', cat: 'home', icon: '🥚', title: 'Big Green Egg — step by step',
  one: 'Lump charcoal + fire starters, lid open 10 minutes, then control heat with the two vents.' }, `
> The Egg is a ceramic charcoal cooker. It holds heat for hours on very little fuel and works like an outdoor oven **and** stove. Once you've done it twice it's easy.
## You'll need
[ ] Lump charcoal (not briquettes) — or charcoal we've made ([[charcoal]])
[ ] 2–3 natural fire-starter cubes (or a twist of newspaper dipped in cooking oil)
[ ] Matches or a lighter
[ ] Heat-proof gloves and long tongs
[ ] The ash tool (the metal hook)
## Light it (about 15 minutes)
1. Open the dome (lid). Open the **bottom vent** (the metal sliding door at the front, near the ground) all the way.
1. Take off the top cap (the metal "chimney" on the lid) or open it fully.
1. Lift out the cooking grid with gloves and put it on a safe surface.
1. If there's lots of ash in the bottom, scrape it out through the bottom vent with the ash tool. Air must get through the holes.
1. Fill the firebox (the ceramic bowl inside) with lump charcoal to just **above its air holes**. For a long cook, fill higher — up to the top of the fire ring. Big lumps at the bottom, smaller on top.
1. Push 2–3 fire-starter cubes into the top of the charcoal, spaced out. Light them.
1. Leave the lid **open** for **10 minutes**. The cubes burn and the charcoal around them glows red.
1. Put the grid back on with gloves. Close the lid.
+ It's lit properly when you can see red-glowing charcoal in a few places, there's no thick smoke, and the starter cubes have burnt away.
! **Never** use petrol, kerosene, meths or lighter fluid. They soak into the ceramic and can flare up dangerously.
## Control the temperature
> More air = hotter. Less air = cooler. The thermometer is on the lid. Make **small** changes, wait 10 minutes, check again. It's easy to overshoot and slow to cool down.
| Cooking | Temperature | Bottom vent open | Top |
| Slow stew, pulled meat, beans | 110–140°C | about 1 cm | petals just open |
| Roast, bake, bread, boiling a pot | 160–200°C | about 3–5 cm | petals half open |
| Pizza, searing, fast boil | 230°C+ | fully open | cap off |
1. To go hotter: open the bottom vent a little more. Wait 10 minutes.
1. To go cooler: close the bottom vent and top a little. Wait 10 minutes. It may take 20–30 minutes to come down.
## Opening the lid safely — "burp" it
! When the Egg is hot, **lift the lid only 5 cm, hold for 3 seconds**, then open fully. Opening it fast lets air rush in and a flash of flame can shoot out at your face and arms.
## Cooking on it
1. Put a **cast-iron pot or frying pan** straight on the grid. It works like a stove top.
1. To boil water: a 2-litre pot with a lid boils in about 15–20 minutes at 200°C.
1. Rice: see [[recipes]]. Bring to the boil on the Egg, then move to a hay box to finish.
1. Bread: put the pizza stone on the grid at 200°C. A loaf takes 30–40 minutes. It's done when it sounds hollow when you tap the bottom.
1. Meat and fish: straight on the grid, lid closed. Fish fillets 6–10 minutes; chicken pieces 35–45 minutes until juices run clear.
## Shut it down and save the charcoal
1. Close the **bottom vent** completely.
1. Put the top cap on and close it completely.
1. The fire goes out because there's no air. The leftover charcoal can be used again next time — don't throw it away.
1. Leave it to cool for several hours.
! **Never pour water in** — it can crack the ceramic.
## When charcoal runs out
- Make more from garden wood: [[charcoal]].
- In an emergency, small pieces of dry hardwood can be burnt in the Egg. They burn faster and smokier, so watch it and keep the lid closed.
`);

G({ id: 'ooni', cat: 'home', icon: '🍕', title: '{{Oven}} — gas and wood',
  one: 'Gas: bottle on, knob in and turn, 20 minutes to heat. Wood: small dry hardwood, one piece at a time.' }, `
## Safety first
! Use it outdoors on a stable, non-flammable table, away from the house and anything that can burn. The outside gets **dangerously hot** — keep children well back.
## Using the gas burner (easiest)
{{ovenGasLine}}
1. Fit the gas burner to the back of the oven (instead of the wood/charcoal tray), as in its instructions.
1. Connect the regulator hose to a full **9 kg LPG bottle**. Hand-tighten — it's a left-hand thread on many fittings (turn the opposite way to normal).
1. Open the valve on top of the bottle.
1. Check for leaks the first time: brush soapy water on the joints. Bubbles = leak — turn off and re-tighten.
1. Push in and turn the burner knob to ignite. Hold it in for a few seconds after it lights, then let go.
1. Close the door and heat for about **20 minutes** for pizza and flatbread. For pots, turn it down.
1. When finished: turn the knob off, **then close the bottle valve**.
## Using wood (when gas runs out)
1. Use **dry hardwood** cut small: about 3–5 cm thick and **13–15 cm long** so it fits the fuel tray. Mānuka, kānuka, gum and fruit-tree wood are best. Pine works but burns fast and sooty.
! Never burn treated timber (greenish building wood — it releases arsenic), painted wood, plywood, MDF, or driftwood.
1. Open the chimney vent fully. Make sure the fuel tray is clean.
1. Put 1 fire-starter and 2–3 small sticks in the tray. Light it.
1. When the sticks are burning well (2–3 minutes), add 2 pieces of wood.
1. Close the door. The fire draws air through the oven and gets very hot in 15–20 minutes.
1. Add **one piece of wood every 2–3 minutes** to keep it going. Too much wood at once smothers it with smoke.
+ It's going well when you see flames rolling across the roof of the oven and little smoke from the chimney.
## Cooking
- **Flatbread or pizza:** on the stone at full heat — 1–2 minutes. Turn it halfway.
- **A pot (rice, stew, water):** let the fire burn lower, put a cast-iron pot at the front of the oven, door off.
- **Roast vegetables, kūmara, potatoes, fish:** in a cast-iron pan, 20–40 minutes, turning.
- **Making charcoal:** put a sealed tin of wood in the fire after cooking ([[charcoal]]).
`);

G({ id: 'charcoal', cat: 'home', icon: '⚫', title: 'Making charcoal (tin method)',
  one: 'Pack wood in a tin with a nail hole, put it in a fire, wait for the flame from the hole to stop, cool sealed.' }, `
> Charcoal is wood that has been "cooked" without air, so only the carbon is left. It burns hot and clean — exactly what the Egg needs.
## You'll need
[ ] A metal tin with a tight lid: paint tin, biscuit tin or a small steel drum. (Burn a paint tin empty once first to get rid of paint.)
[ ] A nail and hammer
[ ] Dry hardwood: mānuka, kānuka, gum, fruit-tree prunings. Pieces thumb- to wrist-thick, cut to fit the tin. Peel the bark off if you can.
[ ] A good wood fire: the Ooni, a fire pit or a brazier
[ ] Long tongs or welding gloves
[ ] A bucket of water nearby (for safety, not for the tin)
## Steps
1. Punch **one small hole** in the centre of the lid with the nail.
1. Pack the tin tightly full of wood pieces — fewer gaps means more charcoal.
1. Put the lid on firmly.
1. Put the tin into the middle of the hot fire, or right into the Ooni after cooking.
1. After 10–20 minutes, smoke and then a little **flame will jet out of the nail hole**. That's the wood gas burning. It's normal.
1. Keep the fire going around the tin. When the flame from the hole **stops completely**, it's done (usually 30–90 minutes, longer for bigger tins).
1. Lift the tin out with tongs. Put it on bare ground or bricks.
1. Push a bit of clay, mud or a screw into the nail hole to seal it.
1. **Leave it until it's completely cold** — several hours or overnight.
! Don't open it while it's hot. Air rushing in will set the charcoal on fire.
+ Good charcoal is black all the way through, light, and snaps cleanly with a "clink". Brown or woody bits weren't cooked long enough — put them in the next batch.
## Storing
- Keep charcoal dry in a lidded bin or sacks off the ground.
- A 20-litre tin makes enough for one or two cooks on the Egg.
> Do this outdoors, away from the house and dry grass, and not on a total fire ban day. Check fire rules at checkitsalright.nz.
`);

G({ id: 'radios', cat: 'home', icon: '📡', title: 'Our walkie-talkies',
  one: 'Family channel {{radioCh}}. Hold the side button, wait a second, talk, let go to listen.' }, `
## What we have
- {{radios}}.
- They reach roughly **1–5 km** between houses, much further from a hilltop or high window.
- Our family channel: **{{radioCh}}**.
- Every radio uses the same channel **and** the same squelch tone (on Unidens it's called a CTCSS code). The tone keeps our radios quiet unless one of us is talking.
## Using one — step by step
1. Turn the top knob to switch it on. Turn the volume up to about halfway.
1. Check the screen shows **our channel** and the tone code. If not, use the arrow buttons to change the channel.
1. To talk: **press and hold the big button on the side**. Wait one second. Speak slowly, with the radio a hand's width from your mouth.
1. **Let go of the button to listen.** You can't hear anyone while you're holding it, and only one person can talk at a time.
1. Start with who you're calling, then who you are: *"{{homeAdult}}, {{homeAdult}}, this is {{away}}."* Let go and wait.
1. When they answer, say your message in short pieces. Say **"over"** when you've finished and want them to reply.
1. Finish with **"out"**.
+ Short, clear messages work best: *"Home is OK. We're all safe. Water is off. Where are you? Over."*
## When phones are down — radio times
1. To save batteries, radios don't need to be on all day. Switch on for **5 minutes on the hour** (8:00, 9:00, 10:00 …) and call each other.
1. If someone is missing or there's danger, leave the radios on all the time.
1. Charge radios from the car or a power bank whenever you can. Check spare batteries monthly.
## Setting up all the radios (do once, then test)
1. **Unidens:** set the channel, then the CTCSS code. The Uniden manual has a table showing the code's tone in **Hz** (e.g. 100.0 Hz).
1. **Baofeng:** set the same frequency. PRS channel 1 = 476.425 MHz and each channel adds 0.025 MHz (channel 20 = 476.900 MHz). Set bandwidth to **Narrow**, power **Low**, and both tones (T-CTCS and R-CTCS) to the same **Hz** as the Unidens.
1. Test: talk from each radio to every other one. If two can't hear each other, the tone doesn't match — check the Hz.
1. Stick a label on the back of every radio with the channel and code.
> The tone isn't privacy — anyone on that channel without a tone can still hear us, and others talking on the channel block it. If it's busy, everyone switches to the backup channel.
! **In a real emergency, turn the tone OFF** (code 0 / OFF) so you can hear anyone nearby calling for help.
## The Baofeng's extra uses
- It has an **FM radio** mode — tune to **101.4 FM (RNZ National)** for official emergency news.
- It can **listen** to other bands, e.g. marine VHF channel 16 (156.800 MHz) — the coast distress channel.
- Only transmit where we're allowed. **When a life is at risk, you may use any radio on any frequency to call for help.**
- Licence-free family talk in NZ is on the PRS band (476–477 MHz). Avoid channels 1–8 and 31–38 (repeaters), 11 (truckies' call channel), 5 and 35, and 22/23 (data only).
`);

G({ id: 'shutoffs', cat: 'home', icon: '🔧', title: 'Turning off gas, water & power',
  one: 'Gas: handle across the pipe. Water: toby clockwise. Power: main switch down.' }, `
## Gas
- Where: {{gasMeter}}
1. Only turn gas off if you **smell gas** (rotten eggs), **hear hissing**, or there's **damage or fire**.
1. Get everyone out first. Don't touch light switches or use phones near the smell.
1. On the meter or bottle, turn the valve a quarter turn so the handle is **across** the pipe (not in line with it). On a bottle, turn the knob on top clockwise until it stops.
1. Don't turn the mains gas back on yourself — a gasfitter must check and relight appliances.
## Water
- Where: {{waterToby}}
1. The toby is usually under a small square lid near the front boundary or footpath.
1. Lift the lid. Turn the tap **clockwise** (right) until it stops. You may need a toby key or a long screwdriver through the handle.
1. Turn it off after an earthquake if pipes may be broken — it keeps the water in the hot water cylinder clean.
## Power
- Where: {{switchboard}}
1. Open the switchboard cover. The **main switch** is usually the biggest one, often labelled MAIN.
1. Flip it **down/OFF**. Only with dry hands, standing on a dry floor.
1. To turn back on: switch everything else off first, then the main, then circuits one at a time.
## The hot water cylinder as drinking water
1. Turn its power off at the switchboard (its own switch, often labelled HWC).
1. Turn off the cold water valve going into the top of the cylinder.
1. Let it cool for a few hours.
1. Open a hot tap upstairs to let air in, then open the drain valve at the bottom of the cylinder and fill clean containers.
+ Add photos of each shut-off to Our plan → Documents so anyone can find them in the dark.
`);

G({ id: 'fuel-storage', cat: 'home', icon: '⛽', title: 'Storing petrol and gas safely',
  one: 'Max 50 L of petrol at home, approved containers, rotate every 3 months.' }, `
## Petrol
- Keep no more than **50 litres** of petrol at home — more needs extra legal certification.
- Only use **approved fuel containers** (marked for petrol). Never soft-drink bottles.
- Store in a cool, shaded, ventilated place — a shed, not inside the house.
- Petrol goes stale: use and replace it **every 3 months** (tip it into the car and refill the cans). A fuel stabiliser from a hardware store makes it last longer.
1. Fill containers **on the ground**, not in the car boot or a trailer — static sparks can ignite fumes.
1. Keep the nozzle touching the container while filling.
1. Don't leave full cans in the car; heat builds up pressure.
## LPG gas bottles
- Store bottles **outside**, upright, in a shaded place. Never in the house or garage.
- Keep a spare full 9 kg bottle for cooking. Swap or refill when one runs out.
- Bottles need testing every 10 years (the date is stamped on the collar). Refill stations won't fill an out-of-date bottle.
## Keeping the car ready
- Keep the car above **half a tank** at all times.
- Keep jumper leads, a tyre pump, a torch and a grab bag in the car.
`);
