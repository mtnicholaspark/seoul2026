import { escapeHtml } from './utils.js';

// "Itinerary Idea" tab — curated day plans, pre-written rather than generated on demand.
//
// Why static instead of generate-on-demand: this app has no backend and no AI API wired
// up (that's what keeps it free — see README). Generating a fresh itinerary on the fly
// would mean calling out to a paid LLM API, which isn't part of this build. So instead:
// 10 day plans, hand-built from the neighborhoods and items already in Wishlist/Nearby,
// each filled out with a few "not tracked elsewhere" suggestions for what to do en route
// or before/after the main stops (marked with the 💡 Tip badge below).
//
// Each stop's `type` is 'food' | 'activity' | 'tip' — 'tip' means it's a suggestion that
// isn't one of the app's own wishlist/food items, just a useful thing to slot in nearby.

export const ITINERARY_IDEAS = [
  {
    id: 'hongdae-mapo',
    title: 'Hongdae & Mapo Day',
    tagline: 'Animal cafés, indie shopping, and late-night chimaek',
    neighborhood: 'Hongdae / Mapo-gu',
    bestFor: 'Any day — Hongdae has energy day or night; Saturday adds the Free Market',
    stops: [
      { time: 'Morning', title: 'Raccoon Cafe or Fox Cafe (Table A)', type: 'activity', notes: 'Same registered-zoo venue for both. ~12–9 PM, ~₩18,000/2hrs — go early to beat the crowd.' },
      { time: 'Midday', title: 'Hongik University Free Market', type: 'tip', notes: "Weekend craft/art flea market right by the university (Sat afternoons, roughly Mar–Nov) — not in the app's data but a Hongdae institution." },
      { time: 'Lunch', title: 'Hongdae Walkable Street', type: 'food', notes: 'Street food grazing — tteokbokki, corn dogs, skewers, ₩3-7k items.' },
      { time: 'Afternoon', title: '50 Page (photobook flip page) + Pixx Toy Box', type: 'activity', notes: 'Both photobooths are steps apart near Hongik Univ. Station Exit 3.' },
      { time: 'Afternoon', title: 'Adidas Hongdae Brand Center', type: 'activity', notes: 'Optional — customize shoes/clothes, ₩60-75k, 10:30 AM–10 PM.' },
      { time: 'Dinner', title: 'Jeongdaepo or Toledo Pasta Bar', type: 'food', notes: 'Charcoal pork belly BBQ, or a Culinary Class Wars Black Spoon pasta spot if you want a break from Korean food.' },
      { time: 'Night', title: 'Sangsu Sogul', type: 'food', notes: 'Pub/anju bar near Sangsu Station Exit 4, open till 2 AM — good nightcap stop.' },
    ],
  },
  {
    id: 'gangnam-apgujeong',
    title: 'Gangnam & Apgujeong Day',
    tagline: 'Wellness, jewelry, and fine dining minutes from the apartment',
    neighborhood: 'Gangnam-gu / Apgujeong',
    bestFor: 'A lower-key day — everything here is a short trip from Teheran-ro',
    stops: [
      { time: 'Morning', title: 'Free Skin Analysis (Wellness House Seoul) or Optima Wellness Museum', type: 'activity', notes: 'Wellness House closed Sundays; Optima is 10 AM–10 PM daily.' },
      { time: 'Morning', title: 'Free Color Analysis, Olive Young Central Gangnam Town', type: 'activity', notes: 'Near Gangnam Station Exit 10 — easy to pair with the skin analysis stop.' },
      { time: 'Lunch', title: 'Gangnam Kyoja', type: 'food', notes: 'Kalguksu & mandu, near Gangnam Station.' },
      { time: 'Afternoon', title: 'Garosu-gil', type: 'tip', notes: "The tree-lined shopping street connecting Sinsa and Apgujeong — not tracked in the app, but the natural walking link between the next two stops." },
      { time: 'Afternoon', title: 'Ssil & Numbering (jewelry)', type: 'activity', notes: 'Both on Apgujeong-ro side streets. Ssil closed Sun & Mon.' },
      { time: 'Afternoon', title: 'Photolab Library (Sinsa)', type: 'activity', notes: 'Keyring photos, 24/7.' },
      { time: 'Coffee', title: 'Bouquet de Pain', type: 'food', notes: 'French bakery known for salt bread, 10 AM–9 PM.' },
      { time: 'Dinner', title: 'Han Chu, or Mingles if you want to splurge', type: 'food', notes: 'Han Chu for casual double-fried chicken; Mingles (Michelin 2★) needs a booking 2-4 weeks out.' },
    ],
  },
  {
    id: 'seongsu',
    title: 'Seongsu "Brooklyn of Seoul" Day',
    tagline: 'DIY workshops, warehouse shopping, and dessert crawling',
    neighborhood: 'Seongsu-dong',
    bestFor: 'A creative, hands-on day — most workshops need no reservation but arrive early',
    stops: [
      { time: 'Morning', title: 'Seoul Forest', type: 'activity', notes: 'Deer/Eco Park — go early to dodge midday heat.' },
      { time: 'Late Morning', title: 'Whipped Official — Keychain Hand Cream', type: 'activity', notes: 'Make your own, ₩15-25k, 11 AM–8 PM.' },
      { time: 'Lunch', title: 'Seongsu Baking Studio', type: 'food', notes: 'French bakery, ~0.5km from Seoul Forest Station.' },
      { time: 'Afternoon', title: 'Daelim Changgo', type: 'tip', notes: "A converted 1970s warehouse turned café/gallery complex — one of Seongsu's most-photographed spots, not tracked in the app." },
      { time: 'Afternoon', title: 'Shopping Seongsu-dong (Tamburins, Verish, Nyu Nyu)', type: 'activity', notes: 'Enter via Seongsu Station Exit 3. Tamburins is Gentle Monster\'s perfume concept store.' },
      { time: 'Afternoon', title: 'Titleist City Tour Van — Custom Golf Balls', type: 'activity', notes: 'Optional, for golf fans — closed 12–1 PM.' },
      { time: 'Coffee', title: 'Rufruf or Jayeondo Salt Bread', type: 'food', notes: 'Rufruf for cheesecake, Jayeondo for salt-bread pastries — both on Yeonmujang-gil.' },
      { time: 'Photos', title: 'Pixx Toy Box (Seongsu)', type: 'activity', notes: 'Second Pixx location, 24/7.' },
      { time: 'Night', title: 'Warehouse cocktail & wine bars', type: 'tip', notes: "Seongsu's converted-warehouse feel carries into the evening — intimate cocktail bars and wine bars tucked into old factory spaces, a quieter contrast to Gangnam-style nightlife. Not tracked in the app; just wander the backstreets east of the Seongsu Station exits and see what's tucked behind an unmarked door." },
    ],
  },
  {
    id: 'itaewon-yongsan',
    title: 'Itaewon & Yongsan Sunset Day',
    tagline: 'Themed cafés by day, Namsan Tower at golden hour',
    neighborhood: 'Itaewon / Yongsan-gu',
    bestFor: 'Time the Namsan stop for sunset — around 7–7:30 PM in this window',
    stops: [
      { time: 'Lunch', title: 'Kyochon Pilbang', type: 'food', notes: "Kyochon's flagship chimakase concept store — menu not sold at regular branches." },
      { time: 'Afternoon', title: 'Rain Report', type: 'activity', notes: 'The café where it "always rains" indoors, 11 AM–9:30 PM.' },
      { time: 'Afternoon', title: 'Shiba Inu Cafe (The Mi Three)', type: 'activity', notes: 'No-kids-zone, near Noksapyeong Station. Closed Tue/Wed.' },
      { time: 'Afternoon', title: 'Haebangchon (HBC) wander', type: 'tip', notes: 'A residential hillside village just up from Itaewon — less polished and touristy than Itaewon proper, with a real neighborhood-restaurant scene and rooftop views over the city. The Sinheung Market area is good for cafes and retro arcade bars. Not tracked in the app.' },
      { time: 'Late Afternoon', title: 'Noksapyeong Station elevated walkway', type: 'tip', notes: 'Free skyline view toward Namsan from the pedestrian bridge — a nice free photo stop on the way to the tower, not tracked in the app.' },
      { time: 'Sunset', title: 'Namsan Tower (N Seoul Tower)', type: 'activity', notes: 'Arrive an hour before sunset. Cable car or 20-30 min hike from Myeongdong/Chungmuro.' },
      { time: 'Dinner', title: 'Yongsan Bongsunga or Ssangmi Gopchang', type: 'food', notes: 'Korean anju/pub food or beef intestine BBQ, both Yongsan-gu.' },
      { time: 'Nightcap', title: 'Mysterious Drink Bar, or Gyeongnidan-gil for cocktails', type: 'food', notes: 'Mysterious Drink Bar: blind/mystery drink concept inside Aapex, 6:30 PM–1 AM. Alternative — Gyeongnidan-gil, just above Itaewon, is the "local" version of the same strip: noticeably fewer foreign tourists, well-made cocktail bars that draw a Korean crowd. Not tracked in the app.' },
    ],
  },
  {
    id: 'jamsil-songpa',
    title: 'Jamsil & Songpa Theme Park Day',
    tagline: 'Lotte World by day, Seokchon Lake once the tower lights up',
    neighborhood: 'Jamsil / Songpa-gu',
    bestFor: 'A weekday, arriving at open — Line 2 direct to Jamsil, no transfer',
    stops: [
      { time: 'Morning', title: 'Lotte World', type: 'activity', notes: 'Indoor "Adventure" hall + outdoor "Magic Island." Buy tickets via Klook/Trazy/KKday for a better rate than the gate.' },
      { time: 'Bonus', title: 'Lotte World Aquarium', type: 'tip', notes: "In the same mall complex — good rainy-day backup or add-on, not tracked separately in the app." },
      { time: 'Evening', title: 'Seokchon Lake', type: 'activity', notes: 'Free, open 24hrs. Walk it once Lotte World Tower is lit, sunset onward.' },
      { time: 'Dinner', title: 'Omori Jjigae or ChoKwang101/201', type: 'food', notes: 'Kimchi stew near KSPO Dome, or Dongpo pork in Songpa.' },
    ],
  },
  {
    id: 'jongno-insadong',
    title: 'Jongno & Insadong Traditional Day',
    tagline: 'Palace-adjacent history, street markets, and gold shopping',
    neighborhood: 'Jongno-gu',
    bestFor: 'A full day — this area rewards slow wandering',
    stops: [
      { time: 'Morning', title: 'Tosokchon Samgyetang', type: 'food', notes: 'Ginseng chicken soup — arrive before 11 AM, lines form fast. Near Gyeongbokgung/Seochon.' },
      { time: 'Morning', title: 'Gyeongbokgung / Bukchon Hanok Village', type: 'tip', notes: "Seoul's main palace and the historic hanok neighborhood next to it — not tracked in the app, but the obvious anchor for a Jongno day." },
      { time: 'Lunch', title: 'Jeonju Yuhalmeoni Bibimbap or Imun Seolnongtang', type: 'food', notes: '50+ yr stone-pot bibimbap, or beef bone soup since 1904.' },
      { time: 'Afternoon', title: 'Insadong shopping street', type: 'tip', notes: 'Antiques, tea houses, traditional crafts — a few minutes from Jongno 3-ga, not tracked in the app.' },
      { time: 'Afternoon', title: 'Gwangjang Market', type: 'tip', notes: "Seoul's most famous food market — bindaetteok (mung bean pancakes), mayak gimbap. Right by Jongno 3-ga, well worth the detour even though it's not in the app's data." },
      { time: 'Afternoon', title: 'Jongno 3-ga Gold Street', type: 'activity', notes: 'Gold/jewelry shopping, near Exit 1 of Jongno 3-ga Station.' },
      { time: 'Dessert', title: 'Aux Petits Verres', type: 'food', notes: 'Belgian tarts, Culinary Class Wars White Spoon.' },
      { time: 'Dinner', title: 'Seoyang Myeonok (Seosunra-gil)', type: 'food', notes: 'Korean-Italian fusion — hanwoo yukhoe perilla-oil capellini. Closed Tuesdays, break 4-5 PM.' },
      { time: 'Night', title: 'Ikseon-dong hanok bars', type: 'tip', notes: "A pocket of restored hanok (traditional houses) tucked behind Jongno, an easy walk from Seosunra-gil. Tiny cafes and hanbok-adjacent boutiques by day, small bars inside converted hanok by night that feel completely different from Gangnam-style venues. Not tracked in the app." },
    ],
  },
  {
    id: 'myeongdong-namdaemun',
    title: 'Myeongdong & Namdaemun Shopping Day',
    tagline: 'K-beauty strip, traditional market, marinated galbi',
    neighborhood: 'Myeongdong / Jung-gu',
    bestFor: 'Any day, liveliest 6-10 PM',
    stops: [
      { time: 'Breakfast', title: 'Seowon Juk', type: 'food', notes: 'Traditional porridge since 1986. Open Thu-Tue 7 AM-5 PM, closed Wed.' },
      { time: 'Morning', title: 'Shopping Myeongdong', type: 'activity', notes: 'Olive Young, Innisfree, Etude, duty-free — liveliest strip in Seoul.' },
      { time: 'Midday', title: 'Namdaemun Market', type: 'tip', notes: "Korea's oldest and largest traditional market, right next to Myeongdong — not tracked in the app but an easy walk-over." },
      { time: 'Lunch', title: 'Hadongkwan', type: 'food', notes: 'Beef bone broth since 1939, single-menu. Best before 10 AM for no line, otherwise expect a wait.' },
      { time: 'Afternoon', title: 'Myeongdong Street Food Alley', type: 'food', notes: 'Gyeran-ppang, hodugwaja, tteokbokki, corn dogs.' },
      { time: 'Dinner', title: 'Myeongdong K-Galbi', type: 'food', notes: 'Marinated Hanwoo beef galbi, MSG-free house marinade.' },
    ],
  },
  {
    id: 'han-river',
    title: 'Han River Culture Day',
    tagline: 'Seoul Forest, riverside cycling, and (if timed right) the festival',
    neighborhood: 'Seongdong-gu → Han River',
    bestFor: 'Best paired with Han River Festival (Sundays Sep 6/13) or Firework Night (Sep 5) — check the Calendar tab first',
    stops: [
      { time: 'Morning', title: 'Seoul Forest', type: 'activity', notes: 'Early morning to dodge the heat. Deer/Eco Park, Insect Garden, Mirror Lake.' },
      { time: 'Late Morning', title: 'Rufruf or Seongsu Baking Studio', type: 'food', notes: 'Both a short walk from Seoul Forest Station.' },
      { time: 'Afternoon', title: 'Ttukseom Hangang Park bike path', type: 'tip', notes: "Rent a Ddareungi public bike and ride the riverside path — not tracked in the app, but the natural way to get from Seoul Forest toward the river." },
      { time: 'Evening', title: 'Han River Festival (Jamsu Bridge & Banpo) or Firework Night (Yeouido)', type: 'activity', notes: "Already on the Calendar tab — Sep 6/13 for the festival, Sep 5 for fireworks. Both free or low-cost." },
      { time: 'Late Night', title: 'Yeouido pojangmacha (tent bar) row', type: 'tip', notes: "Only if you're at Yeouido for Firework Night — a row of orange tent bars near Yeouido Station, plastic stools, soju and street food. The classic local after-work-drinks scene, with basically nothing built for tourists. Not tracked in the app." },
    ],
  },
  {
    id: 'hannam',
    title: 'Hannam-dong Quiet Luxury Day',
    tagline: 'Designer boutiques, galleries, and a possible splurge dinner',
    neighborhood: 'Hannam-dong / Yongsan-gu',
    bestFor: 'A slower, upscale day — good option if you want a break from crowds',
    stops: [
      { time: 'Morning', title: 'Shopping Hannam-dong', type: 'activity', notes: 'Designer boutiques, premium leather, accessible-luxury brands. Access via Hangangjin or Itaewon (Line 6).' },
      { time: 'Midday', title: 'Leeum Museum of Art', type: 'tip', notes: "Major private art museum right in Hannam-dong — not tracked in the app, but one of the neighborhood's best-known landmarks." },
      { time: 'Lunch', title: 'Hannam-dong Hanbang Tongdak', type: 'food', notes: 'Herbal-marinated whole fried chicken, celebrity spot near Hangang-jin Station.' },
      { time: 'Afternoon', title: 'Buto Hannam', type: 'food', notes: 'Fusion/vegetarian, Culinary Class Wars Black Spoon — good for a lighter afternoon bite.' },
      { time: 'Dinner', title: 'Mosu', type: 'food', notes: 'Michelin 3★, Asia\'s 50 Best #41 — book 3-4 weeks out if you want the splurge option. Otherwise treat this as a browsing/window-shopping evening.' },
    ],
  },
  {
    id: 'euljiro-newtro',
    title: 'Euljiro Newtro Night',
    tagline: 'Old hardware alleys by day, hidden speakeasies by night',
    neighborhood: 'Euljiro 3-ga / Jung-gu',
    bestFor: 'Evening — this neighborhood is built for after-dark wandering; go in with an appetite for exploring, not a fixed plan. Many of the best bars are marked only by a small sticker on an unmarked door.',
    stops: [
      { time: 'Afternoon', title: 'Wander the Euljiro alley maze', type: 'tip', notes: "Decades-old hardware and printing shops sit right next to hidden bars — the contrast is the whole point. Some shopfronts hide art galleries up unmarked staircases. Not tracked in the app; best explored on foot with no fixed route." },
      { time: 'Early Evening', title: 'Eulji OB Bear or Wonjo Manseon Hof', type: 'tip', notes: "Old-school outdoor beer halls — dried pollack, draft beer, plastic stools on the sidewalk. Very local, not dressed up for tourists. Not tracked in the app." },
      { time: 'Dinner', title: 'Eulji-O-deng Do-ru-muk', type: 'tip', notes: "Pocha-style stall for fish cakes (odeng) and soju — classic Euljiro street-drinking food. Not tracked in the app." },
      { time: 'Night', title: 'Chin & Nose', type: 'tip', notes: "Speakeasy-style cocktail bar with a deliberately hidden entrance — look for the unmarked door rather than a sign. Not tracked in the app." },
      { time: 'Nightcap', title: 'Le Temple', type: 'tip', notes: "Whiskey bar styled after an old European temple — a quieter close to the night than the beer-hall stops earlier. Not tracked in the app." },
    ],
  },
  {
    id: 'yeonnam-mangwon',
    title: 'Yeonnam-dong & Mangwon-dong Local Day',
    tagline: 'Park-side reading, indie bookshops, and a market lunch by the river',
    neighborhood: 'Yeonnam-dong & Mangwon-dong / Mapo-gu',
    bestFor: 'A slower, walkable day — best on a weekday morning before market crowds build. Both neighborhoods reward ducking into residential alleys rather than sticking to the main streets.',
    stops: [
      { time: 'Morning', title: 'Gyeongui Line Forest Park (Yeonnam-dong section)', type: 'tip', notes: "A former rail line turned linear park — independent bookshops and small boutiques line the alleys just off the main path. Not tracked in the app; enter from Hongik Univ. Station Exit 3 area, just north of Hongdae." },
      { time: 'Late Morning', title: 'Yeonnam-dong alley cafes', type: 'tip', notes: "A real weekend brunch/cafe culture among locals — best found by ducking into the residential alleys rather than following the main street. Not tracked in the app." },
      { time: 'Midday', title: 'Travel to Mangwon-dong', type: 'tip', notes: 'Short subway/walk west, ~15-20 min — both neighborhoods sit on the Mapo-gu side near Hongik University.' },
      { time: 'Lunch', title: 'Mangwon Market', type: 'activity', notes: "40+ year old neighborhood market — Q's Dakgangjeong and Hwanginho croquettes are the reasons people line up. Less touristy and more of a locals' market than Gwangjang." },
      { time: 'Afternoon', title: 'Mangwon Hangang Park riverside', type: 'tip', notes: "The local habit: grab crispy fried chicken from the market and eat it down by the river. A quieter, less crowded stretch of the Han than the more central parks. Not tracked in the app." },
      { time: 'Bonus', title: 'Independent bookstores', type: 'tip', notes: "Both neighborhoods are dotted with small owner-run bookshops — worth a browse if you stumble on one open. Not tracked in the app." },
    ],
  },
  {
    id: 'mullae-dong',
    title: 'Mullae-dong Industrial Arts Day',
    tagline: 'Metal shops and galleries by day, craft beer and makgeolli by night',
    neighborhood: 'Mullae-dong / Yeongdeungpo-gu',
    bestFor: 'Late afternoon into evening — shopfronts flip from working metal shops to bars as the sun sets. Access via Mullae Station, Line 2.',
    stops: [
      { time: 'Afternoon', title: 'Mullae-dong', type: 'activity', notes: "Former ironworks district turned arts quarter — working metal shops sit right next to galleries, indie bars, and studios built into the old machine works. Seoul's answer to a Brooklyn/Berlin industrial-arts neighborhood, rougher and less polished than Seongsu." },
      { time: 'Afternoon', title: 'Indie bakeries and galleries', type: 'tip', notes: "Small owner-run bakeries and gallery spaces tucked directly between the active metal shops — the industrial noise-and-sparks backdrop next to a good flat white is the appeal. Not tracked in the app." },
      { time: 'Evening', title: 'Craft beer bars', type: 'tip', notes: "As the machine shops close for the day, their storefronts turn into casual craft beer spots — a distinctly local, low-key evening scene. Not tracked in the app." },
      { time: 'Night', title: 'Vintage-poster makgeolli bars', type: 'tip', notes: "Rice-wine bars decorated with vintage posters — a good, distinctly local drinking option instead of the usual soju-bar cliché. Not tracked in the app." },
    ],
  },
  {
    id: 'busan',
    title: 'Busan 3-Day Escape',
    tagline: 'Beaches, culture village, and the night market by the water',
    neighborhood: 'Busan (already on the Wishlist as a 3-day trip)',
    bestFor: 'Early-to-mid September — still swimmable, uncrowded beach weather',
    stops: [
      { time: 'Day 1 — Morning', title: 'KTX from Seoul Station', type: 'tip', notes: '2h15-2h40 direct, ~₩59,800 one-way. Add 20-30 min to get from Gangnam to Seoul Station first.' },
      { time: 'Day 1 — Afternoon', title: 'Haeundae Beach', type: 'activity', notes: 'Check in, settle in, first swim.' },
      { time: 'Day 2 — Morning', title: 'Gamcheon Culture Village', type: 'activity', notes: 'Budget a half day — colorful hillside village, murals, small galleries.' },
      { time: 'Day 2 — Lunch', title: 'Jagalchi Market', type: 'food', notes: "Korea's largest seafood market — pick your own catch, have it prepared right there." },
      { time: 'Day 2 — Night', title: 'Gwangalli Beach', type: 'activity', notes: 'Best at night for the Gwangan Bridge lighting.' },
      { time: 'Day 3 — Morning', title: 'Haeundae Blueline Park', type: 'tip', notes: "Scenic coastal sky-capsule/beach-train ride along the old rail line — not tracked in the app, a nice half-day closer before heading back." },
      { time: 'Day 3 — Lunch', title: 'Moemiljip, Songheonjip, or Pyeongyangjip', type: 'food', notes: 'Busan\'s new 2026 Bib Gourmand picks — buckwheat noodles, tteokgalbi, or N. Korean-style mandu.' },
      { time: 'Day 3 — Evening', title: 'KTX back to Seoul', type: 'tip', notes: 'Note: Busan and Gangneung are on different KTX lines — route back through Seoul between them, not directly, if doing both.' },
    ],
  },
];

export function initIdeasTab() {
  const container = document.getElementById('ideas-tab');
  container.innerHTML = `
    <div class="card-notes" style="margin-bottom:12px">
      Pre-written itineraries grounded in what's already in Wishlist &amp; Nearby, with a few 💡 tips added for things not tracked elsewhere in the app. Tap a card to expand it.
    </div>
    <div id="ideas-list"></div>
  `;

  const listEl = document.getElementById('ideas-list');
  listEl.innerHTML = ITINERARY_IDEAS.map(renderIdeaCard).join('');

  ITINERARY_IDEAS.forEach((idea) => {
    const header = listEl.querySelector(`#idea-header-${idea.id}`);
    const card = listEl.querySelector(`#idea-card-${idea.id}`);
    header.addEventListener('click', () => card.classList.toggle('expanded'));
  });
}

function renderIdeaCard(idea) {
  return `
    <div class="card idea-card" id="idea-card-${idea.id}">
      <div class="idea-header" id="idea-header-${idea.id}">
        <div>
          <div class="card-title">${escapeHtml(idea.title)}</div>
          <div class="card-sub">${escapeHtml(idea.tagline)}</div>
          <div class="card-sub">📍 ${escapeHtml(idea.neighborhood)} · ${idea.stops.length} stops</div>
        </div>
        <span class="idea-toggle-icon">▾</span>
      </div>
      <div class="idea-body">
        <div class="card-notes" style="margin-bottom:8px">🗓️ ${escapeHtml(idea.bestFor)}</div>
        <div class="idea-stops">
          ${idea.stops.map(renderStop).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderStop(stop) {
  const badge =
    stop.type === 'food'
      ? '<span class="badge-type badge-food">Food</span>'
      : stop.type === 'activity'
      ? '<span class="badge-type badge-activity">Activity</span>'
      : '<span class="badge-type badge-tip">💡 Tip</span>';
  return `
    <div class="idea-stop">
      <div class="idea-stop-time">${escapeHtml(stop.time)}</div>
      <div class="idea-stop-body">
        <div class="idea-stop-title-row">${badge}<span class="idea-stop-title">${escapeHtml(stop.title)}</span></div>
        <div class="idea-stop-notes">${escapeHtml(stop.notes)}</div>
      </div>
    </div>
  `;
}
