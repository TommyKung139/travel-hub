export type ChecklistItem = { id: string; lead: string; text: string };
export type ChecklistSection = { id: string; title: string; items: ChecklistItem[] };

export const GOLDEN_RULE =
  'Plan for things to go wrong, and make sure no single failure can strand you. Keep backups of your documents, money, and phone access, and leave some slack in your schedule. Almost every travel disaster (lost passport, missed connection, declined card, dead phone) is survivable if you have a Plan B.';

export const CHECKLIST: ChecklistSection[] = [
  {
    id: 'before',
    title: 'Before you book anything',
    items: [
      { id: 'passport', lead: 'Check your passport.', text: 'Many countries require at least 6 months of validity beyond your travel dates, plus blank pages. Renewals can take weeks.' },
      { id: 'entry', lead: 'Check entry requirements for your passport.', text: 'Visa, e-visa, or travel authorization (ETIAS, ESTA, eTA and similar) may be needed, and some take days or weeks to process.' },
      { id: 'season', lead: 'Check the season.', text: 'Look at weather, typhoon or monsoon season, major holidays, and festivals. These affect price and crowds.' },
    ],
  },
  {
    id: 'flights',
    title: 'Booking flights',
    items: [
      { id: 'f-ahead', lead: 'Book 2-4 months ahead for international trips,', text: 'earlier for peak season. Compare Google Flights, Skyscanner, and the airline’s own site.' },
      { id: 'f-flex', lead: 'Be flexible with dates and airports.', text: 'Midweek flights are often cheaper, and a nearby airport can save a lot.' },
      { id: 'f-rules', lead: 'Read the fare rules.', text: 'Cheap fares often exclude checked bags, seat selection, and changes.' },
      { id: 'f-connect', lead: 'Avoid tight connections.', text: 'Leave 2-3 hours for international layovers, more if you change terminals or clear immigration. A single ticket protects you if you miss a connection; separate tickets don’t.' },
      { id: 'f-name', lead: 'Enter your name exactly as on your passport.', text: 'Fixing it later can cost money.' },
      { id: 'f-card', lead: 'Pay with a credit card', text: 'for better dispute protection, and check if it includes travel insurance.' },
      { id: 'f-bags', lead: 'Read baggage rules', text: 'for weight limits, carry-on size, and restrictions on lithium batteries and power banks (carry-on only).' },
    ],
  },
  {
    id: 'stay',
    title: 'Accommodation',
    items: [
      { id: 'h-cancel', lead: 'Prefer free-cancellation bookings', text: 'until your plans are firm.' },
      { id: 'h-location', lead: 'Check the location', text: '(distance to transit, safety at night) and recent reviews.' },
      { id: 'h-checkin', lead: 'Confirm check-in times,', text: 'especially if you land late at night.' },
      { id: 'h-address', lead: 'Save the address in the local language', text: 'to show taxi drivers.' },
    ],
  },
  {
    id: 'health',
    title: 'Insurance and health',
    items: [
      { id: 'i-insurance', lead: 'Buy travel insurance', text: 'covering medical care, evacuation, trip cancellation, and lost baggage. Medical bills abroad can be enormous.' },
      { id: 'i-vaccines', lead: 'Check recommended vaccines', text: 'for your destination, ideally 4-8 weeks ahead.' },
      { id: 'i-meds', lead: 'Bring enough prescription medication', text: 'for the whole trip plus extra, in original packaging with a doctor’s note. Check that it’s legal at your destination.' },
      { id: 'i-kit', lead: 'Pack a small kit:', text: 'pain relievers, stomach medicine, band-aids, and any personal essentials.' },
    ],
  },
  {
    id: 'money',
    title: 'Money',
    items: [
      { id: 'm-cards', lead: 'Bring two cards', text: '(ideally different networks, such as Visa and Mastercard) and store them separately.' },
      { id: 'm-fees', lead: 'Use a card with no foreign transaction fees', text: 'if possible, and tell your bank you’re traveling.' },
      { id: 'm-local', lead: 'Always choose to pay in the local currency', text: 'when a terminal asks. "Pay in your home currency" uses a poor exchange rate.' },
      { id: 'm-cash', lead: 'Carry some local cash', text: 'for small shops, markets, and transit. ATMs usually beat airport exchange counters.' },
      { id: 'm-emergency', lead: 'Keep emergency cash', text: '(e.g., USD or EUR) hidden separately.' },
    ],
  },
  {
    id: 'phone',
    title: 'Phone and connectivity',
    items: [
      { id: 'p-sim', lead: 'Choose an eSIM, local SIM, or roaming plan', text: 'before you leave, and check that your phone is unlocked.' },
      { id: 'p-offline', lead: 'Download offline maps', text: 'and a translation app with the offline language pack.' },
      { id: 'p-plug', lead: 'Pack a universal plug adapter', text: 'and a power bank.' },
      { id: 'p-apps', lead: 'Install the apps you’ll need:', text: 'airline, hotel, local ride-hailing (Uber, Grab, Bolt, etc.), and transit.' },
    ],
  },
  {
    id: 'docs',
    title: 'Documents and backups',
    items: [
      { id: 'd-digital', lead: 'Make digital copies', text: 'of your passport, visas, insurance, tickets, and bookings. Store them in cloud storage and email them to yourself.' },
      { id: 'd-paper', lead: 'Keep a paper copy', text: 'of key documents separately from the originals.' },
      { id: 'd-share', lead: 'Share your itinerary', text: 'with someone you trust.' },
      { id: 'd-embassy', lead: 'Register with your government’s traveler program', text: 'if it has one, and note your embassy’s contact details.' },
    ],
  },
  {
    id: 'packing',
    title: 'Packing',
    items: [
      { id: 'k-light', lead: 'Pack light.', text: 'You’ll carry it, and you’ll buy things.' },
      { id: 'k-carryon', lead: 'Keep essentials in your carry-on:', text: 'passport, medications, chargers, valuables, and a change of clothes in case your checked bag is delayed.' },
      { id: 'k-liquids', lead: 'Follow liquid rules', text: '(usually 100 ml containers in a clear bag).' },
      { id: 'k-dress', lead: 'Dress for local norms,', text: 'especially at religious sites.' },
      { id: 'k-tracker', lead: 'Put an AirTag or similar tracker', text: 'in your checked bag.' },
    ],
  },
  {
    id: 'depart',
    title: 'Right before departure',
    items: [
      { id: 'x-checkin', lead: 'Check in online', text: '24 hours ahead and recheck your flight status.' },
      { id: 'x-entry', lead: 'Confirm entry rules again', text: 'in case they changed, and complete any online arrival forms.' },
      { id: 'x-early', lead: 'Arrive early:', text: 'about 3 hours for international flights.' },
      { id: 'x-photos', lead: 'Take photos of your luggage', text: 'in case it’s lost.' },
      { id: 'x-home', lead: 'Secure your home:', text: 'handle mail, plants, and valuables.' },
    ],
  },
  {
    id: 'arrival',
    title: 'On arrival',
    items: [
      { id: 'a-immigration', lead: 'Clear immigration', text: 'with your return ticket, accommodation address, and funds details ready, since officers may ask.' },
      { id: 'a-transport', lead: 'Use official transport', text: '(metro, airport taxi stands, or a ride-hailing app) and avoid unsolicited offers.' },
      { id: 'a-oriented', lead: 'Get oriented:', text: 'drop your bags, then walk around to learn the area.' },
    ],
  },
  {
    id: 'during',
    title: 'During the trip',
    items: [
      { id: 't-spread', lead: 'Keep your valuables spread out:', text: 'don’t carry everything in one pocket or bag.' },
      { id: 't-scams', lead: 'Watch for common scams', text: 'like fake petitions, "friendly" strangers, overpriced taxis, and distraction thefts in crowded areas.' },
      { id: 't-phrases', lead: 'Learn basic phrases', text: '(hello, thank you, please, sorry, how much). Locals appreciate the effort.' },
      { id: 't-laws', lead: 'Know local laws and customs,', text: 'such as rules on drugs, photography, alcohol, and dress codes.' },
      { id: 't-buffer', lead: 'Don’t overschedule.', text: 'Leave buffer days for delays, rest, and spontaneity.' },
      { id: 't-water', lead: 'Drink bottled or filtered water', text: 'where tap water isn’t safe, and be careful with street food in the first days.' },
      { id: 't-card', lead: 'Keep your hotel’s business card', text: 'for getting back if your phone dies.' },
      { id: 't-checkin', lead: 'Stay connected to people at home', text: 'with regular check-ins.' },
    ],
  },
  {
    id: 'return',
    title: 'Returning home',
    items: [
      { id: 'r-customs', lead: 'Check customs allowances', text: 'for duty-free limits and prohibited items (food, plants, and meat are often restricted).' },
      { id: 'r-receipts', lead: 'Keep receipts', text: 'for big purchases and VAT or tax refunds.' },
      { id: 'r-time', lead: 'Leave time for the airport', text: 'and tax-refund counters.' },
      { id: 'r-statements', lead: 'Review your card statements', text: 'afterward for unfamiliar charges.' },
    ],
  },
];

export const ALL_ITEM_IDS = CHECKLIST.flatMap((s) => s.items.map((i) => i.id));
