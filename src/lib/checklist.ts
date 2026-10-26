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

// ───────────── Traditional Chinese (Taiwan) ─────────────

export const GOLDEN_RULE_ZH =
  '計畫好萬一出狀況怎麼辦，並確保任何單一失誤都不會讓你受困。備份你的文件、現金與手機連線方式，行程中也預留一些彈性。幾乎所有旅行災難（遺失護照、錯過轉機、信用卡被拒、手機沒電），只要有備案，都能化解。';

export const SECTION_TITLE_ZH: Record<string, string> = {
  before: '預訂前先確認',
  flights: '訂機票',
  stay: '住宿',
  health: '保險與健康',
  money: '金錢',
  phone: '手機與網路',
  docs: '文件與備份',
  packing: '打包行李',
  depart: '出發前',
  arrival: '抵達當地',
  during: '旅途中',
  return: '返家',
};

export const ITEM_ZH: Record<string, { lead: string; text: string }> = {
  passport: { lead: '檢查護照效期。', text: '許多國家要求護照在停留結束後仍有至少 6 個月效期，並且要有空白頁。換發護照可能需要數週。' },
  entry: { lead: '確認入境規定。', text: '你的護照可能需要簽證、電子簽證或電子旅行許可（如 ETIAS、ESTA、eTA 等），有些需要數天到數週審核。' },
  season: { lead: '確認旅遊季節。', text: '查看天氣、颱風或雨季、重要節日與慶典，這些都會影響價格與人潮。' },

  'f-ahead': { lead: '國際航線建議提前 2 至 4 個月訂票，', text: '旺季要更早。可比較 Google Flights、Skyscanner 與航空公司官網。' },
  'f-flex': { lead: '日期與機場保持彈性。', text: '平日出發常比較便宜，改搭附近的機場也可能省不少。' },
  'f-rules': { lead: '看清楚票價規則。', text: '低價票常不含託運行李、選位與改票。' },
  'f-connect': { lead: '避免轉機時間太緊。', text: '國際轉機請預留 2 至 3 小時，若需換航廈或辦理入境則要更久。同一張機票的話，誤了接駁班機航空公司會處理；分開購買的機票則不會。' },
  'f-name': { lead: '姓名要與護照完全一致。', text: '事後更正可能要付費。' },
  'f-card': { lead: '用信用卡付款，', text: '發生糾紛時比較有保障，也可確認該卡是否附旅遊保險。' },
  'f-bags': { lead: '看清楚行李規定，', text: '包括重量限制、隨身行李尺寸，以及鋰電池與行動電源的限制（只能放隨身行李）。' },

  'h-cancel': { lead: '優先選擇可免費取消的訂房，', text: '等行程確定後再定案。' },
  'h-location': { lead: '確認地點，', text: '（離大眾運輸多遠、夜間治安如何）並查看近期評價。' },
  'h-checkin': { lead: '確認入住時間，', text: '尤其是深夜才抵達的話。' },
  'h-address': { lead: '把地址存成當地語言，', text: '方便出示給計程車司機。' },

  'i-insurance': { lead: '購買旅遊保險，', text: '涵蓋醫療、緊急救援後送、行程取消與行李遺失。海外醫療費用可能非常高。' },
  'i-vaccines': { lead: '確認目的地建議施打的疫苗，', text: '最好提前 4 至 8 週。' },
  'i-meds': { lead: '攜帶足夠的處方藥，', text: '份量要涵蓋整趟旅程並多帶一些，保持原包裝並附上醫師證明。也要確認該藥物在目的地是否合法。' },
  'i-kit': { lead: '準備小型藥品包：', text: '止痛藥、腸胃藥、OK 繃，以及個人必需用品。' },

  'm-cards': { lead: '帶兩張卡，', text: '（最好是不同國際組織，例如 Visa 和 Mastercard），並分開存放。' },
  'm-fees': { lead: '盡量使用免國外交易手續費的信用卡，', text: '並事先告知銀行你要出國。' },
  'm-local': { lead: '一律選擇以當地貨幣付款。', text: '刷卡機詢問時，選當地貨幣；「以本國貨幣結帳」的匯率通常較差。' },
  'm-cash': { lead: '帶一些當地現金，', text: '用於小店、市場與交通。通常在提款機領錢比機場換匯櫃檯划算。' },
  'm-emergency': { lead: '另外藏一份緊急現金，', text: '（例如美元或歐元），與主要錢包分開放。' },

  'p-sim': { lead: '出發前選好 eSIM、當地 SIM 卡或漫遊方案，', text: '並確認手機已解鎖。' },
  'p-offline': { lead: '下載離線地圖，', text: '以及含離線語言包的翻譯 App。' },
  'p-plug': { lead: '準備萬用轉接頭，', text: '和行動電源。' },
  'p-apps': { lead: '先安裝需要的 App：', text: '航空公司、住宿、當地叫車（Uber、Grab、Bolt 等）與大眾運輸。' },

  'd-digital': { lead: '備份數位檔案：', text: '護照、簽證、保險、機票與訂房資料，存到雲端並寄給自己。' },
  'd-paper': { lead: '另外準備紙本影本，', text: '與正本分開存放。' },
  'd-share': { lead: '分享你的行程，', text: '讓信任的親友知道。' },
  'd-embassy': { lead: '登錄政府的旅外國人服務，', text: '（若有提供），並記下駐外館處的聯絡方式。' },

  'k-light': { lead: '行李輕量化。', text: '行李要自己提，而且你一定會買東西回來。' },
  'k-carryon': { lead: '必需品放在隨身行李：', text: '護照、藥品、充電器、貴重物品，以及一套換洗衣物，以防託運行李延誤。' },
  'k-liquids': { lead: '遵守液體規定，', text: '（通常是 100 毫升以下的容器，放進透明夾鏈袋）。' },
  'k-dress': { lead: '依當地習俗穿著，', text: '尤其是前往宗教場所時。' },
  'k-tracker': { lead: '在託運行李放 AirTag 或類似的追蹤器，', text: '以便追蹤行李。' },

  'x-checkin': { lead: '提前線上報到，', text: '（約 24 小時前），並再次確認航班狀態。' },
  'x-entry': { lead: '再次確認入境規定，', text: '以防有變動，並完成各國要求的線上入境表格。' },
  'x-early': { lead: '提早抵達機場：', text: '國際航班約 3 小時前。' },
  'x-photos': { lead: '替行李拍照，', text: '萬一遺失可用來認領。' },
  'x-home': { lead: '處理好家裡：', text: '信件、植物與貴重物品。' },

  'a-immigration': { lead: '通過入境審查時，', text: '準備好回程機票、住宿地址與資金證明，因為官員可能會詢問。' },
  'a-transport': { lead: '搭乘正規交通工具，', text: '（捷運、機場計程車排班處或叫車 App），不要理會主動攬客。' },
  'a-oriented': { lead: '先熟悉環境：', text: '放好行李後，在周邊走一走。' },

  't-spread': { lead: '分散放置貴重物品：', text: '不要把所有東西放在同一個口袋或包包。' },
  't-scams': { lead: '留意常見詐騙，', text: '例如假連署、「熱心」陌生人、喊價過高的計程車，以及在擁擠處的調虎離山扒竊。' },
  't-phrases': { lead: '學幾句基本用語，', text: '（你好、謝謝、請、抱歉、多少錢）。當地人會很感謝你的用心。' },
  't-laws': { lead: '了解當地法律與習俗，', text: '例如毒品、拍照、酒類與服裝規定。' },
  't-buffer': { lead: '行程不要排太滿。', text: '預留緩衝日，應付延誤、休息與臨時起意。' },
  't-water': { lead: '在自來水不能直接喝的地方，喝瓶裝水或過濾水，', text: '前幾天吃路邊攤要小心。' },
  't-card': { lead: '隨身帶著飯店的名片，', text: '手機沒電時才回得去。' },
  't-checkin': { lead: '與家人朋友保持聯繫，', text: '定期報平安。' },

  'r-customs': { lead: '確認海關免稅額度，', text: '與違禁品規定（食品、植物與肉類常受限制）。' },
  'r-receipts': { lead: '保留收據，', text: '以備大筆消費與退稅之用。' },
  'r-time': { lead: '預留去機場的時間，', text: '以及退稅櫃檯的時間。' },
  'r-statements': { lead: '回國後檢查信用卡帳單，', text: '確認沒有陌生的扣款。' },
};

// Returns the lead/text/title in the right language, plus the joiner between lead and text.
export function itemText(item: ChecklistItem, lang: 'en' | 'zh'): { lead: string; text: string; sep: string } {
  if (lang === 'zh') {
    const z = ITEM_ZH[item.id];
    if (z) return { ...z, sep: '' };
  }
  return { lead: item.lead, text: item.text, sep: ' ' };
}

export function sectionTitle(section: ChecklistSection, lang: 'en' | 'zh'): string {
  return lang === 'zh' ? SECTION_TITLE_ZH[section.id] ?? section.title : section.title;
}
