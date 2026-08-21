// One-time seed data for Firestore, sourced from the trip planning spec (2026-08-15) plus the
// photobooth/wellness additions from 2026-08-16. Coordinates are best-effort estimates from each
// place's address/landmark (no geocoding API used) — good enough for walking/subway-scale "nearby"
// sorting, but nudge any that look off once you've actually visited.
//
// Run once from the browser console after Firebase is configured: seedAll()
// It's idempotent (deterministic doc IDs from slugified titles) but will overwrite any manual
// edits you've made to a seed item's fields, so don't re-run it after you've started editing data
// in the app.

import { db } from './firebase-config.js';
import {
  collection,
  doc,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function itin(title, date, startTime, endTime, assignedTo, notes = '', extra = {}) {
  return { title, date, startTime, endTime, location: '', notes, assignedTo, status: 'confirmed', ...extra };
}

function wish(title, category, lat, lng, opts = {}) {
  return { title, category, lat, lng, neighborhood: '', notes: '', hours: '', cost: '', bestTime: '', travelFromGangnam: '', tips: '', ...opts };
}

function food(nameEn, nameKo, neighborhood, cuisine, priceTier, source, notes, lat, lng, opts = {}) {
  return { nameEn, nameKo, neighborhood, cuisine, priceTier, source, notes, lat, lng, ...opts };
}

// ---------------------------------------------------------------------------
// 1. Confirmed itinerary (spec Section 7)
// ---------------------------------------------------------------------------
export const ITINERARY_SEED = [
  itin(
    'Lasik appointment, Bright Sungmo Eye Clinic',
    '2026-08-31',
    '10:00',
    '13:00',
    ['nick'],
    '',
    { location: 'Bright Sungmo Eye Clinic' }
  ),
  itin('ReJuel Clinic', '2026-08-31', '10:00', '11:00', ['alexus'], 'Back-to-back with Eunel Clinic — only 30 min gap, confirm no travel time needed between clinics.'),
  itin('Eunel Clinic', '2026-08-31', '11:30', '12:30', ['alexus'], 'Follows ReJuel Clinic with only a 30 min gap.'),
  itin('Eunel Clinic', '2026-09-03', '11:30', null, ['nick']),
  itin(
    'Greem Tattoo',
    '2026-09-16',
    '13:00',
    '15:30',
    ['alexus'],
    "Falls right before Gary & JiHee's Sep 16 departure — worth checking if this day was otherwise meant for a group send-off."
  ),
  itin('Musemuah', '2026-09-17', '11:00', '15:30', ['alexus']),
];

// ---------------------------------------------------------------------------
// 2. Wishlist / activities (spec Section 8 + the 2026-08-16 photobooth/wellness batch)
// ---------------------------------------------------------------------------
export const WISHLIST_SEED = [
  wish('Raccoon Cafe (Table A, Hongdae)', 'cafe', 37.5548, 126.9223, {
    neighborhood: 'Hongdae',
    notes:
      'Table A — officially registered indoor zoo under Seoul\'s 2023 exotic-animal-cafe rules, trained staff; raccoons, meerkats, fennec foxes, chinchillas.',
    hours: '~12:00 PM–9:00 PM',
    cost: '~₩18,000 / 2 hrs',
    travelFromGangnam: 'Hongik Univ. Station area (Mapo-gu)',
    tips: "Korea's Dec 2023 ban on new exotic-animal cafes gives existing venues until Dec 2027 to reregister — double check current licensing on Naver Map closer to the date.",
  }),
  wish('Dog Cafe (Da Dog In The City)', 'cafe', 37.501, 127.037, {
    neighborhood: 'Yeoksam-dong',
    notes: 'Café + dog park/hotel combo, closest good option to the stay.',
    hours: 'Mon/Thu/Sun 10:00–23:00, Fri–Sat 10:00–24:00',
    travelFromGangnam: 'Yeoksam-dong — short trip from Teheran-ro',
    tips: 'Alternative: Cafe Bite Me in Sinsa-dong (near Garosu-gil), 12:00–21:00.',
  }),
  wish('Fox Cafe (Table A, Hongdae)', 'cafe', 37.5548, 126.9223, {
    neighborhood: 'Hongdae',
    notes: 'Same venue as the Raccoon Cafe — also houses fennec foxes, same registered-zoo legitimacy.',
    tips: 'Fox Village Cafe (Sinchon/Ihwa) has unconfirmed 2026 status — treat as unverified. "Maison Fox Cafe" in Sinsa-dong is a fashion coffee shop, not a live-animal cafe — easy to mix up by name.',
  }),
  wish('Lotte World', 'theme-park', 37.5111, 127.098, {
    neighborhood: 'Jamsil',
    notes: 'Jamsil, Songpa-gu. Indoor "Adventure" hall + outdoor "Magic Island" — good hybrid for hot/rainy days.',
    hours: '~10 AM–9 PM',
    cost: '₩45,000–62,000 at gate, cheaper via Klook/Trazy/KKday',
    bestTime: 'Weekday, at open or after 5 PM',
    travelFromGangnam: 'Line 2 direct to Jamsil, ~20–25 min, no transfer',
  }),
  wish('Everland', 'theme-park', 37.2941, 127.2029, {
    neighborhood: 'Yongin',
    notes: 'Yongin, ~40km south of Seoul.',
    hours: '10 AM–9 PM (10 PM weekends)',
    cost: '₩59,000 gate, ~₩39,000 via discount vendors',
    bestTime: 'Tue–Thu, arrive by 9:30 AM',
    travelFromGangnam: 'Shuttle bus 50–70 min (₩3-5k, best value); Bundang Line + local shuttle 90-110 min',
    tips: 'Halloween decor starts in September but peaks mid-October, after the trip ends — expect early-season decor only.',
  }),
  wish('Busan (3-day trip)', 'trip', 35.1587, 129.1604, {
    neighborhood: 'Busan',
    notes: 'Recommend 3 days. Highlights: Haeundae Beach, Gamcheon Culture Village (half day), Jagalchi Market, Gwangalli Beach (best at night for bridge lighting).',
    cost: 'KTX ~₩59,800 one-way',
    bestTime: 'Early-to-mid September — still swimmable, uncrowded beach weather',
    travelFromGangnam: 'KTX from Seoul Station, 2h15–2h40 (+20-30 min Gangnam→Seoul Station)',
  }),
  wish('Seoul Forest', 'park', 37.5443, 127.0374, {
    neighborhood: 'Seongdong-gu',
    notes: 'Seongdong-gu, along the Han River. Deer/Eco Park, Insect Garden, Mirror Lake.',
    hours: 'Free, open 24/7',
    bestTime: 'Early morning or late afternoon to dodge midday heat',
    travelFromGangnam: 'Line 2 to Ttukseom, Exit 8, ~20-25 min, no transfer',
  }),
  wish('Seoul Botanic Park', 'park', 37.568, 126.8309, {
    neighborhood: 'Magok',
    notes: 'Magok, Gangseo-gu. Big glass dome/greenhouse plus lake and wetland zones.',
    hours: 'Mar–Oct 9:30 AM–6 PM (themed gardens closed Mondays)',
    cost: '₩5,000 adult',
    travelFromGangnam: 'Line 9 or Airport Railroad to Magongnaru, ~50-65 min with a transfer',
    tips: 'Consider pairing with the Yeouido shopping stop — similar westward route.',
  }),
  wish('Seokchon Lake', 'park', 37.5111, 127.1023, {
    neighborhood: 'Songpa-gu',
    notes: 'Songpa-gu, right next to Lotte World Tower. Great evening walk once the tower is lit.',
    hours: 'Free, open 24 hours',
    bestTime: 'Sunset–~midnight',
    travelFromGangnam: 'Same Jamsil stop as Lotte World — easy to combine same day',
    tips: 'Cherry blossom festival (late Mar–Apr) won\'t apply to this trip.',
  }),
  wish('Arte Museum, Gangneung', 'museum', 37.772, 128.933, {
    neighborhood: 'Gangneung',
    notes: 'Nearest Arte Museum to Seoul (also a Yeosu location) — Gangwon-do coast.',
    hours: '~10 AM–8 PM',
    cost: '~₩18,000–20,000',
    travelFromGangnam: 'KTX from Seoul Station ~2 hrs direct — doable as a long day trip, more relaxed overnight',
    tips: 'Gangneung and Busan are on different KTX lines — route back through Seoul between them, not directly.',
  }),
  wish('Namsan Tower (N Seoul Tower)', 'landmark', 37.5512, 126.9882, {
    neighborhood: 'Yongsan-gu',
    notes: "Seoul's iconic hilltop tower — panoramic 360° city views from the observatory deck, plus the famous rows of couples' padlocks along the terrace fences. The cable car ride up is scenic in its own right, especially at sunset.",
    hours: '10 AM–10:30 PM weekdays, 11 PM weekends (weather dependent)',
    cost: 'Observatory ~₩29,000 gate / ~₩18,400 online; cable car ~₩15,000 RT; combos ~₩35-38k',
    bestTime: 'Sunset into night (sunset ~7–7:30 PM) — arrive an hour early',
    travelFromGangnam: 'No direct subway — Line 2/3 to Myeongdong or Chungmuro, then cable car or 20-30 min hike, ~35-45 min total',
  }),
  wish('Shopping — Myeongdong', 'shopping', 37.5636, 126.9834, {
    neighborhood: 'Myeongdong',
    notes: 'Dense K-beauty/fashion strip (Olive Young, Innisfree, Etude, duty-free) plus street food.',
    hours: '~10 AM–10 PM, liveliest 6–10 PM',
  }),
  wish('Shopping — Seongsu-dong', 'shopping', 37.5445, 127.0559, {
    neighborhood: 'Seongsu-dong',
    notes: '"Brooklyn of Seoul": converted warehouses, Korean indie/design brands, Tamburins (Gentle Monster perfume concept store), rotating pop-ups.',
    hours: '~11 AM–8/9 PM',
    travelFromGangnam: 'Enter via Seongsu Station Exit 3',
  }),
  wish('Shopping — Hannam-dong', 'shopping', 37.5347, 127.0007, {
    neighborhood: 'Hannam-dong',
    notes: 'Quieter "quiet luxury" contrast to Gangnam: designer boutiques, premium leather/accessible-luxury, high-end beauty.',
    hours: '~11 AM–8 PM',
    travelFromGangnam: 'Hangangjin or Itaewon (Line 6)',
  }),
  wish('Shopping — Yeouido', 'shopping', 37.5257, 126.9255, {
    neighborhood: 'Yeouido',
    notes: 'Financial-district shopping: IFC Mall (underground, at Yeouido Station), The Hyundai Seoul/Parc.1, Don Quijote.',
    hours: '~10:30 AM–8/10 PM',
  }),
  wish('Pixx Toy Box Photobooth (Hongdae)', 'photobooth', 37.5563, 126.9238, {
    neighborhood: 'Hongdae',
    notes: '1st & 2nd floor, near Hongik University Station Exit 3.',
    travelFromGangnam: '44 Yanghwa-ro 23-gil, Mapo-gu',
  }),
  wish('Pixx Toy Box Photobooth (Seongsu)', 'photobooth', 37.5445, 127.0575, {
    neighborhood: 'Seongsu-dong',
    notes: 'Same toy-box concept as the Hongdae branch — retro props and colorful backdrops for the photo strips. Handy to pair with a Seongsu shopping stop rather than crossing town to Hongdae.',
    travelFromGangnam: '275-88 Seongsu-dong 2-ga',
  }),
  wish('Photolab Library (Sinsa)', 'photobooth', 37.5218, 127.0223, {
    neighborhood: 'Sinsa-dong',
    notes: 'Keyring photos. Sinsa Branch, Gangnam-gu.',
    travelFromGangnam: '515-8 Sinsa-dong',
  }),
  wish('50 Page Photobook Flip Page (Hongdae)', 'photobooth', 37.558, 126.9255, {
    neighborhood: 'Hongdae',
    notes: 'Photobook flip-page format.',
    travelFromGangnam: '42 Donggyo-ro 38-gil, Mapo-gu',
  }),
  wish('Wellness House Seoul — Free Skin Analysis', 'wellness', 37.4956, 127.0286, {
    neighborhood: 'Gangnam / Seocho-gu',
    notes: 'Block77, Floors 1F–B2F, ~2 min walk from Gangnam Station Exit 10.',
    travelFromGangnam: '17 Seocho-daero 77-gil, Seocho-gu',
  }),
];

// ---------------------------------------------------------------------------
// 3. Food places (spec Section 9)
// ---------------------------------------------------------------------------
export const FOOD_SEED = [
  // Jongno & Insadong
  food('Imun Seolnongtang', '이문설농탕', 'Jongno 5-ga, Jongno-gu', 'Beef bone soup', '~₩15,000', 'Neighborhood Guide', 'Since 1904; arrive before noon.', 37.5721, 126.9902),
  food('Tosokchon Samgyetang', '토속촌', 'Seochon (Chebu-dong), Jongno-gu', 'Ginseng chicken soup', '₩17-20k', 'Neighborhood Guide', 'Lines by 11am. 서울 종로구 자하문로5길 5 (Chebu-dong, Seochon, near Gyeongbokgung).', 37.5758, 126.97),
  food('Jeonju Yuhalmeoni Bibimbap', '전주유할머니', 'Insadong, Jongno-gu', 'Bibimbap', '₩12-15k', 'Neighborhood Guide', '50+ yrs; stone-pot crispy rice; Korean menu only.', 37.573, 126.985),
  food('Aux Petits Verres', '', 'Jongno-gu', 'Pastry/desserts', '', 'Culinary Class Wars (White Spoon — Park Joonwoo)', 'Belgian tarts.', 37.573, 126.985),

  // Hongdae & Mapo
  food('Jeongdaepo', '정대포', 'Hongdae, Mapo-gu', 'Thick-cut pork belly BBQ', '₩40-60k for 2', 'Neighborhood Guide', 'Charcoal at table.', 37.553, 126.9236),
  food('Hongdae Walkable Street', '', 'Hongdae, Mapo-gu', 'Street food market', '₩3-7k items', 'Neighborhood Guide', 'Open to 2am weekends.', 37.5563, 126.9238),
  food('Tutu Chicken', '투투치킨', 'Hongdae, Mapo-gu', 'Fried chicken & beer', 'Under ₩30k for 2', 'Neighborhood Guide', 'Walk-in only.', 37.5527, 126.9236),
  food('Noorungji Tongdak', '누룽지통닭', 'Hongdae, Mapo-gu', 'Fried chicken & beer', '₩30k for 2', 'Neighborhood Guide', 'Crispy coating.', 37.5527, 126.9236),
  food('Lee Buk Bang', '', 'Mapo-gu', 'North Korean', '', 'Culinary Class Wars (White Spoon — Choi Jihyung)', 'N. Korean sundae, Michelin-rated 5 yrs; Mapo.', 37.556, 126.942),
  food('Jinjin', '', 'Mapo-gu', 'Korean-Chinese', '', 'Culinary Class Wars (White Spoon — Hwang Jinseon)', 'Menbosha; Mapo.', 37.556, 126.942),
  food('Toledo Pasta Bar', '', 'Mapo-gu', 'Italian/Sicilian', '', 'Culinary Class Wars (Black Spoon, season winner — Kwon Sungjoon)', 'Mapo.', 37.556, 126.942),

  // Myeongdong & Sinchon
  food('Hadongkwan', '하동관', 'Myeongdong, Jung-gu', 'Beef bone broth', '≤₩15,000', 'Neighborhood Guide', 'Since 1939; single-menu; lines before 10am.', 37.5636, 126.9834),
  food('Myeongdong Street Food Alley', '', 'Myeongdong, Jung-gu', 'Street snacks', '', 'Neighborhood Guide', 'Gyeran-ppang, hodugwaja, tteokbokki, corn dogs.', 37.5636, 126.9834),
  food("Yonsei-area student restaurants", '', 'Sinchon, Seodaemun-gu', 'Korean set meals', '₩8-12k', 'Neighborhood Guide', 'Cheap, filling home-style set meals (백반) aimed at students — unlimited banchan refills, no-frills seating, near Yonsei/Sogang/Ewha campuses.', 37.5665, 126.9385),

  // Gangnam & Apgujeong
  food('Yeontabal', '연탄발', 'Gangnam-gu', 'Charcoal-grilled beef', '', 'Neighborhood Guide', 'Charcoal-grilled bulgogi and short ribs cooked tableside over real coals — the smoky char is the whole point. Smart-casual, good for a proper sit-down dinner rather than a quick bite.', 37.5172, 127.0473),
  food('Han Chu', '한추', 'Gangnam-gu', 'Fried chicken & beer', '₩20-30k for 2', 'Neighborhood Guide', 'Neighborhood institution for 20+ years — Korean-style double-fried chicken (extra-crackly skin, less greasy than a single fry) with beer. Casual, loud, and reliably good.', 37.4979, 127.0276),
  food('Mingles', '', 'Cheongdam-dong, Gangnam-gu', 'Fine dining', 'Lunch ₩88k / dinner ₩220k', 'Michelin 3★ — Korea\'s first', 'Chef Kang Mingoo, modern Korean rooted in jang (fermented sauces), grain, and seasonal produce. Book 2-4 wks out.', 37.5245, 127.0359),
  food('Choi Dot', '', 'Apgujeong-dong, Gangnam-gu', 'Haute cuisine', '', 'Culinary Class Wars (White Spoon — Choi Hyunseok)', 'From celebrity chef Choi Hyunseok (Culinary Class Wars White Spoon). Signature is the Jang Trio Steak — a steak built around three different fermented Korean sauces (jang), showing how far modern Korean fine dining has pushed a very old ingredient.', 37.5245, 127.0359),
  food('Tian Mi Mi', '', 'Gangnam-gu', 'Chinese/HK, dim sum', '', 'Culinary Class Wars (White Spoon — Jung Jisun)', 'Chinese/Hong Kong-style dim sum from chef Jung Jisun (Culinary Class Wars White Spoon) — has both a Gangnam and a Hongdae branch, so check which is closer before booking.', 37.5172, 127.0286),
  food('Yun Seoul / Myeon Seoul', '', 'Gangnam-gu', 'Noodles', '', 'Culinary Class Wars (White Spoon — Kim Doyun)', 'Noodle-focused restaurant from chef Kim Doyun (Culinary Class Wars White Spoon), known for perilla-oil noodles — a nuttier, earthier take on cold noodles than the usual sesame-oil version.', 37.5172, 127.0286),
  food('EVETT', '', 'Apgujeong-dong, Gangnam-gu', 'Korean-Western fusion', '', 'Culinary Class Wars (White Spoon — Joseph Lidgerwood)', 'Korean-Western fusion from chef Joseph Lidgerwood (Culinary Class Wars White Spoon) — one of the show\'s more adventurous kitchens; the lemongrass ants dish is the one people talk about, so come open-minded.', 37.5245, 127.0359),
  food('Hong Bo Gak', '', 'Gangnam-gu', 'Chinese', '', 'Culinary Class Wars (Yeo Gyeongrae / Park Eunyoung)', 'Chinese restaurant from chefs Yeo Gyeongrae and Park Eunyoung (Culinary Class Wars) — the moja shrimp (spicy, Sichuan-leaning) is the dish to order.', 37.5172, 127.0286),
  food('Bistro Spark', '', 'Gangnam-gu', 'Italian, pasta', '', 'Culinary Class Wars (Black Spoon — Shawn Park)', 'Italian, pasta-focused, from chef Shawn Park (Culinary Class Wars Black Spoon) — a smaller, more intimate bistro setting than most of the other Gangnam Culinary Class Wars spots.', 37.5172, 127.0286),
  food('Pono Buono', '', 'Gangnam-gu', 'Italian fusion', '', 'Culinary Class Wars (Black Spoon — Kim Taesung)', 'Italian fusion from chef Kim Taesung (Culinary Class Wars Black Spoon) — black truffle risotto is the headline dish.', 37.5172, 127.0286),
  food('Trid Seoul', '', 'Cheongdam-dong, Gangnam-gu', 'Fine dining', '', 'Michelin-starred, Culinary Class Wars (Black Spoon — Kang Seungwon)', 'Michelin-starred, from chef Kang Seungwon (Culinary Class Wars Black Spoon) — the triple choux dessert (three variations on choux pastry in one dish) is a good reason to save room.', 37.5172, 127.0286),

  // Sindang & Jamsil
  food('Sindang Tteokbokki Town', '', 'Sindang-dong, Jung-gu', 'Spicy rice cakes', '₩5-10k', 'Neighborhood Guide', 'Since 1970s; pot-served at table.', 37.5657, 127.0177),
  food('Omori Jjigae', '오모리찌개', 'Bangi-dong, Songpa-gu', 'Kimchi stew', '₩10-12k', 'Neighborhood Guide', 'Aged-cabbage broth; near KSPO Dome.', 37.5206, 127.1218),
  food('Gosari Express', '', 'Jungang Market, Jung-gu', 'Plant-based, gosari sauce', '', 'Michelin Bib Gourmand 2026 (new)', 'Jungang Market, Jung-gu.', 37.5657, 126.9976),
  food('Andongjip Son Kalguksi / Cheerful Drinking Table', '', 'Dongdaemun-gu', 'Hand-cut noodles', '', 'Culinary Class Wars (Black Spoon — Kim Miryung)', 'Dongdaemun & Dobong.', 37.5744, 127.0098),
  food('ChoKwang101 / 201', '', 'Songpa-gu', 'Chinese, Dongpo pork', '', 'Culinary Class Wars (Black Spoon — Cho Kwangho)', 'Songpa.', 37.5145, 127.1058),
  food('Neo', '', 'Songpa-gu', 'Japanese, buckwheat gimbap', '', 'Culinary Class Wars (White Spoon — Choi Kangrok)', 'Songpa.', 37.5145, 127.1058),

  // Elsewhere in Seoul
  food('Fabri Kitchen', '', 'Yongsan-gu', 'Italian seafood', '', 'Culinary Class Wars (White Spoon — Fabrizio Ferrari)', 'PPP pasta; Yongsan-gu.', 37.5326, 126.9905),
  food('Touch the Sky', '', 'Yeongdeungpo-gu', 'French', '', 'Culinary Class Wars (White Spoon — Cho Eunju)', 'Seafood course; Yeongdeungpo.', 37.5219, 126.9026),
  food('Edamame Namyoung', '', 'Namyeong-dong, Yongsan-gu', 'Chinese-Japanese', '', 'Culinary Class Wars (Black Spoon — Jacob Hyun)', 'Spicy yuringi; Yongsan.', 37.5326, 126.9705),
  food('Buto Hannam', '', 'Hannam-dong, Yongsan-gu', 'Fusion, vegetarian', '', 'Culinary Class Wars (Black Spoon — Lim Heewon)', 'Yongsan/Hannam.', 37.5347, 127.0007),
  food('Deepin Oksu / Deepin Sindang', '', 'Oksu-dong, Seongdong-gu', 'Bistro/Italian', '', 'Culinary Class Wars (Black Spoon — Yoon Namno)', 'Chitarra mussel pasta; Seongdong/Jung.', 37.5447, 127.0165),

  // Fine dining / special occasion
  food('Mosu', '', 'Hannam-dong, Yongsan-gu', 'Haute cuisine', 'Dinner ₩300k+', 'Michelin 2★ (down from 3★ in 2024)', 'Chef Ahn Sung-jae. Reservations open ~1 month out and go fast — the restaurant has also had periods of temporary closure/relocation, so confirm it\'s currently open before counting on it. Address: 4 Hoenamu-ro 41-gil, Yongsan-gu, between Itaewon and Hangangjin stations (Line 6).', 37.5347, 127.0007, { confidence: 'best-guess', flagNote: 'Michelin rating and address confirmed via web search (2026 guide); the restaurant has a history of temporary closures, so double-check current status before booking.' }),
  food('Onjium', '', 'Hyoja-dong, Jongno-gu', 'Research-based historical Korean cuisine', '', 'Michelin 1★, Asia\'s 50 Best #10 (2025)', 'Chef Cho Eun-hee reinterprets Joseon-dynasty royal-court recipes; intimate 25-seat dining room. Address: 49 Hyoja-ro, 4F, Jongno-gu. Tue-Fri, lunch 12-3 PM / dinner 6-10 PM.', 37.585, 126.988, { confidence: 'best-guess', flagNote: 'Michelin rating corrected via web search — was previously listed as 2★.' }),
  food('La Yeon', '', 'Jangchung-dong, Jung-gu', 'Kaiseki-style', 'Dinner ₩260k', 'Michelin 2★ (down from 3★) — Shilla Hotel, 23rd floor', 'Book 4 wks out. Address: 249 Dongho-ro, Jangchung-dong, Jung-gu.', 37.5575, 127.0055, { confidence: 'best-guess', flagNote: 'Michelin rating corrected via web search — was previously listed as 3★.' }),
  food('7th Door', '', 'Cheongdam-dong, Gangnam-gu', 'Fermentation-focused', 'Lunch ₩68k', 'Michelin 1★, Asia\'s 50 Best #49', 'Chef Kim Dae-chun\'s modern Korean, built around fermentation and aging. Address: 4F, 41 Hakdong-ro 97-gil, Gangnam-gu, near Cheongdam Park.', 37.5245, 127.0359),

  // New Michelin Bib Gourmand 2026 (outside Seoul core)
  food('3rd Samgyetang', '', 'Seocho-gu', 'Ginseng chicken soup', '', 'Michelin Bib Gourmand 2026', 'Since 1973; 40+ ingredient broth. Seocho-gu.', 37.4837, 127.0324),
  food('Sobakeeri Suzu', '', 'Seoul (exact neighborhood unknown)', 'Korean buckwheat soba', '', 'Michelin Bib Gourmand 2026', 'Japan-trained chef reinterprets soba using Korean-grown buckwheat and a less common "sotoichi" flour ratio — chilled noodles with dipping sauce, or alongside tempura and braised dishes.', 37.5665, 126.978, { confidence: 'unverified', flagNote: 'Could not find a street address via web search, even checking the Michelin Guide listing directly (blocked from this environment) — only a phone number turned up. Coordinates are a rough Seoul-center placeholder, not a real location — confirm before relying on this one.' }),
  food('Andeok', '', 'Jongno-gu', 'Beef naengguksu, mandutguk', '', 'Michelin Bib Gourmand 2026', 'Jongno-gu.', 37.573, 126.985),
  food('Oilje', '', 'Yongsan-gu', 'Perilla seed miyeokguk, cast-iron pot rice', '', 'Michelin Bib Gourmand 2026', 'Yongsan-gu.', 37.5326, 126.9905),
  food('Moemiljip / Songheonjip / Pyeongyangjip', '', 'Busan', 'Buckwheat noodles / tteokgalbi / N. Korean mandu', '', 'Michelin Bib Gourmand 2026', 'Busan — good picks if you\'re there.', 35.1156, 129.0403),

  // User-submitted additions (Aug 16 batch)
  food('Shin Sikdang', '신식당', 'Outside Seoul', 'Tteok-galbi + bamboo-tube rice', '', 'User submission', '100-yr-old restaurant. Damyang, Jeollanam-do — not Seoul, ~4hr away. 전남 담양군 담양읍 담주2길 18-13.', 35.3211, 126.988),
  food('Rufruf', '러프러프', 'Seongsu-dong', 'Cheesecake/dessert café', '', 'User submission', 'Also a Bukchon branch. 서울 성동구 연무장길 81, 남경빌딩 4층 401호.', 37.5445, 127.0575),
  food('Bongcheon Central Market vendor (unnamed)', '', 'Gwanak-gu', 'Unknown', '', 'User submission', '서울특별시 관악구 관악로 211.', 37.4784, 126.9414, {
    confidence: 'unverified',
    flagNote: 'This address is Bongcheon Central Market (봉천중앙시장) itself, not a single restaurant — need a stall name/number to pin down a specific vendor.',
  }),
  food('Kyochon Pilbang', '교촌필방', 'Itaewon-dong', 'Kyochon Chicken flagship "chimakase" concept store', '', 'User submission', 'Menu not sold at regular branches. 서울 용산구 보광로 127, 유영빌딩.', 37.5326, 126.9945),
  food('Cafe Pokpo', '카페폭포', 'Hongeun-dong', 'Café beside an artificial waterfall', '', 'User submission', 'Built beside the Hongje Stream waterfall. 서울특별시 서대문구 연희로 262-24.', 37.5859, 126.9345),
  food('Atta', '아따', 'Euljiro-3ga', 'Trendy Korean pub-style eatery (한식주점)', '', 'User submission', '"Hipjiro" scene. 서울 중구 충무로5길 14.', 37.5663, 126.9925),
  food('Jeokpo', '적포', 'Jongno-gu (near Gwangjang Market)', 'Unknown', '', 'User submission', '서울 종로구 수표로 94, 8층.', 37.5701, 126.9895, {
    confidence: 'unverified',
    flagNote: 'Could not confirm this business exists after two search passes — likely needs the original Instagram post/screenshot to pin down.',
  }),
  food('Seodamheon Hongdae', '서담헌 홍대본점', 'Donggyo-dong', 'Hanok-style Korean-Chinese fusion', '', 'User submission', 'Dosakmyeon jjajangmyeon, jjamppong, tangsuyuk. 서울 마포구 연희로1길 40-3, 1층.', 37.559, 126.9255),
  food('Hansik Wangbijib', '한식 왕비집', 'Myeongdong', 'Traditional Korean — bibimbap/yukhoe-bibimbap, juk, galbitang', '', 'User submission', '서울 중구 명동6길 15, 지하1층.', 37.5636, 126.9834, {
    confidence: 'best-guess',
    flagNote: 'Several similarly-named 왕비집 branches exist nearby serving pork-galbi instead.',
  }),
  food('Sungsimdang (Daejeon main branch)', '성심당', 'Outside Seoul', 'Legendary bakery — tuigim-soboro', '', 'User submission', 'Daejeon (Eunhaeng-dong) — not Seoul, ~1hr KTX. 대전 중구 대종로 480번길 15.', 36.3283, 127.4265),
  food('Jayeondo Salt Bread (Seongsu)', '자연도소금빵', 'Seongsu-dong', 'Salt-bread bakery chain', '', 'User submission', 'One of the most popular locations. 서울 성동구 연무장길 56-1, 1층.', 37.5443, 127.0568),
  food('Gangnam Kyoja (main branch)', '강남교자', 'Seocho-dong', 'Kalguksu & mandu', '', 'User submission', 'Near Gangnam Station. 서울 서초구 강남대로69길 11.', 37.4959, 127.0278),
  food('Hannam-dong Hanbang Tongdak', '한남동한방통닭', 'Hannam-dong', 'Herbal-marinated whole fried chicken', '', 'User submission', 'Celebrity spot, near Hangang-jin Station. 서울 용산구 대사관로34길 12, 1-2층.', 37.5347, 127.0007),
  food('Seowon Juk', '서원죽', 'Myeongdong', 'Traditional porridge (juk)', '', 'User submission', 'Breakfast institution since 1986; open Thu-Tue 7am-5pm, closed Wed. 서울 중구 퇴계로 141.', 37.5605, 126.9835),
  food("Sonyeo Bangatgan (Yongsan I'Park Mall)", '소녀방앗간', 'Hangangno-dong', 'Grain/rice bakery chain — injeolmi croissants', '', 'User submission', "서울 용산구 한강대로23길 55, 용산아이파크몰 테이스트파크 4층 602-001호.", 37.5298, 126.9648),
  food('Seongsu Baking Studio', '성수베이킹스튜디오', 'Seongsu-dong', 'French bakery — baguettes, croissants', '', 'User submission', '~0.5km from Seoul Forest Station; open 8am-6pm. 서울특별시 성동구 서울숲2길 46, B1.', 37.546, 127.041),
  food("Yoo's BBQ Lab", '유용욱 바베큐연구소', 'Namyeong-dong', 'BBQ, run by a well-known Korean meat authority', '', 'User submission', 'Notoriously hard to book. 서울 용산구 한강대로84길 5-7, 남영아케이드.', 37.5417, 126.9705),
  food('Milbit', '밀빛', 'Songpa-gu', 'Bakery — "mammoth bread" and cream-filled breads', '', 'User submission', '서울 송파구 오금로16길 18, 1층.', 37.5045, 127.1155, {
    confidence: 'best-guess',
    flagNote: 'Address differs from what was originally sent ("37-5 Songpa-dong") — the business is real, confirm which address is current.',
  }),
  food('Yongsan Bongsunga', '용산봉숭아', 'Yongsan-gu', 'Korean anju/pub food — Gwangju-style duck-potato jjigae', '', 'User submission', 'Aged sashimi platters; popular outdoor seating. 서울 용산구 한강대로15길 18, 1층.', 37.5326, 126.9705),
  food('Manbae Arirang Bossam (Deungchon branch)', '만배아리랑보쌈', 'Deungchon-dong', 'Bossam (boiled pork wrap)', '', 'User submission', '서울 강서구 등촌로51길 17, 1층.', 37.5563, 126.8556, {
    confidence: 'unverified',
    flagNote: 'Original source said "마장면 등촌본점" (a noodle place) — this address actually matches a bossam restaurant. Also checked "강서면옥" (a real naengmyeon chain) but its branches are in Apgujeong/Chungbuk/City Hall, not here — recommend re-checking the source.',
  }),
  food('Byeollan-ori (Dongdaemun)', '별난오리', 'Jongno-gu', 'Electric-smoked duck & spicy duck stew', '', 'User submission', '100% domestic duck — featured by Seoul Tourism Org as the "Dongdaemun special duck" spot. Near Dongdaemun Station Exit 6. 서울 종로구 종로46길 12, 2층.', 37.5714, 127.0098, {
    confidence: 'best-guess',
    flagNote: 'Strong name/theme match via Seoul Tourism Org feature, not independently confirmed.',
  }),
];

// ---------------------------------------------------------------------------
// 4. Additions made after the initial seed/deploy — the 2026-08-16 "Korea 2026" PDF,
//    Nick's calendar items (relatives visit, PTO), and later batches of Instagram
//    food-post screenshots (see FOOD_ADDITIONS below). Duplicates of anything already
//    in the arrays above were skipped throughout. A few items had no address in their
//    source at all; those are flagged `confidence: 'unverified'`/`'best-guess'` with a
//    `flagNote`, and stay out of the Nearby feed (no lat/lng) until one is confirmed.
// ---------------------------------------------------------------------------
export const ITINERARY_ADDITIONS = [
  itin('Han River Festival', '2026-09-06', '13:00', '21:00', ['everyone'], 'Free. Recurs every Sunday through the festival run — also falls on Sep 13 within the trip window.', {
    location: 'Jamsu Bridge & Banpo Hangang Park',
    status: 'tentative',
  }),
  itin('Han River Festival', '2026-09-13', '13:00', '21:00', ['everyone'], 'Free. Second Sunday of the festival within the trip window.', {
    location: 'Jamsu Bridge & Banpo Hangang Park',
    status: 'tentative',
  }),
  itin('Firework Night', '2026-09-05', '20:00', '21:10', ['everyone'], 'Gates open 1 PM. Free general admission or paid seating.', {
    location: 'Yeouido Hangang Park',
    status: 'tentative',
  }),
  itin('Seeing Nick\'s relatives', '2026-08-30', null, null, ['nick'], 'No specific time given yet.', {
    status: 'confirmed',
  }),
  itin('Nick\'s PTO', '2026-08-31', null, null, ['nick'], 'Approved PTO — 3 days (24h).', {
    endDate: '2026-09-02',
    status: 'confirmed',
  }),
  itin('Nick\'s PTO', '2026-09-11', null, null, ['nick'], 'Approved PTO — 7 business days (56h): off Sep 11 through Sun Sep 20, back to work Mon Sep 21. Only the portion through Sep 19 (this calendar\'s current range) will show in the day-list — Sep 20-21 are recorded here but fall outside it.', {
    endDate: '2026-09-21',
    status: 'confirmed',
  }),
];

export const WISHLIST_ADDITIONS = [
  wish('Rain Report', 'cafe', 37.5344, 126.9942, {
    neighborhood: 'Itaewon',
    notes: 'Themed café where it "always rains" indoors.',
    hours: '11 AM–9:30 PM',
    travelFromGangnam: '258-63 Itaewon-dong (85 Sowol-ro 40-gil), Yongsan-gu',
  }),
  wish('Saeraul', 'cafe', 37.5665, 126.933, {
    neighborhood: 'Yeonhui-dong',
    notes: 'Foggy waterfall café.',
    hours: '10 AM–9 PM (10 PM weekends)',
    travelFromGangnam: '99 Yeonhui-ro 27-gil, Seodaemun-gu',
  }),
  wish('Shiba Inu Cafe (The Mi Three)', 'cafe', 37.5347, 126.9877, {
    neighborhood: 'Itaewon',
    notes: 'No-kids-zone Shiba Inu café, 4 dogs on site, Namsan Tower views. Closed Tue/Wed.',
    hours: 'Mon, Thu–Sun 1–9 PM',
    travelFromGangnam: '31 Noksapyeong-daero 40-gil, Yongi Building 2F, Yongsan-gu — near Noksapyeong Station Exit 1 or 3',
    confidence: 'best-guess',
    flagNote: 'Source just said "Shiba Inu Cafe" with no address — matched to The Mi Three (더미쓰리), the best-known Shiba Inu café in Seoul, via web search. Worth a quick confirm before relying on it.',
  }),
  wish('Mysterious Drink Bar', 'bar', 37.53, 126.965, {
    neighborhood: 'Yongsan-gu',
    notes: 'Blind/mystery drink concept bar, inside Aapex.',
    hours: '6:30 PM–1 AM',
    travelFromGangnam: '17-13 Hangang-daero 21-gil, Yongsan-gu',
  }),
  wish('Bulgwangcheon Stream', 'park', 37.6096, 126.9294, {
    neighborhood: 'Eunpyeong-gu',
    notes: 'Stream walkway, similar vibe to Cheonggyecheon.',
  }),
  wish('ODT.mode', 'photobooth', 37.4975, 127.0273, {
    neighborhood: 'Seocho-gu',
    notes: 'Self photobooth — more formal, full-body shots.',
    hours: 'Mon–Thu 1–9 PM, Fri 11 AM–9 PM, Sat–Sun 10 AM–9 PM',
    travelFromGangnam: 'B120 Taeyang Desian Louvre, 455 Gangnam-daero, Seocho-gu',
  }),
  wish('Whipped Official — Keychain Hand Cream', 'diy', 37.5432, 127.0548, {
    neighborhood: 'Seongsu-dong',
    notes: 'Make your own keychain hand cream.',
    hours: '11 AM–8 PM',
    cost: '₩15,000–25,000 (~$11–18)',
    travelFromGangnam: '16 Seongsui-ro 20-gil, Seongdong-gu',
  }),
  wish('Adidas Hongdae Brand Center', 'diy', 37.5555, 126.9235, {
    neighborhood: 'Hongdae',
    notes: 'Customize Nike and Adidas shoes/clothes.',
    hours: '10:30 AM–10 PM',
    cost: '₩60,000–75,000 (~$43–53)',
    travelFromGangnam: 'Mapo-gu, Donggyo-dong, Yanghwa-ro 148, 1-3층',
  }),
  wish('Titleist City Tour Van — Custom Golf Balls', 'diy', 37.544, 127.053, {
    neighborhood: 'Seongsu-dong',
    notes: 'Custom golf balls, sleeve of 3.',
    hours: '10 AM–7 PM (closed 12–1 PM)',
    cost: '₩25,000–35,000 per sleeve of 3 (~$18–25)',
    travelFromGangnam: '91 Seongsui-ro, Seongdong-gu',
  }),
  wish('Rettere — Custom Brainwave Fragrance', 'diy', 37.555, 126.937, {
    neighborhood: 'Hongdae',
    notes: 'Custom fragrance based on a brainwave reading, standard 50 mL bottle.',
    hours: '12–8 PM',
    cost: '₩33,000–35,000 per person (~$25–35)',
    travelFromGangnam: '2nd Floor, 22-8 Sinchon-ro 4-gil, Mapo-gu',
  }),
  wish('Pharmacy Skin Analysis — Optima Wellness Museum', 'wellness', 37.5045, 127.0255, {
    neighborhood: 'Gangnam-gu',
    notes: 'Pharmacy-style skin analysis.',
    hours: '10 AM–10 PM',
    travelFromGangnam: 'B1-1F, 42 Gangnam-daero 102-gil, Gangnam-gu',
    confidence: 'best-guess',
    flagNote: 'Source labeled this "Seongsu" but gave a Gangnam-daero/Gangnam-gu address — used the address as given.',
  }),
  wish('Free Color Analysis — Olive Young Central Gangnam Town', 'wellness', 37.4983, 127.0278, {
    neighborhood: 'Seocho-gu',
    notes: 'Free color analysis. Dongil Building, B1–4F, near Gangnam Station Exit 10.',
    hours: '10 AM–10:30 PM',
    travelFromGangnam: '403 Gangnam-daero, Seocho-gu',
  }),
  wish('Yonsei Pain Clinic', 'wellness', 37.5172, 127.0413, {
    neighborhood: 'Gangnam-gu',
    notes: 'Clinic mentioned without a confirmed appointment date.',
    travelFromGangnam: '3F Cheongdam Building, 413 Hakdong-ro, Gangnam-gu — 3 min walk from Gangnam-gu Office Station Exit 4',
    confidence: 'best-guess',
    flagNote: '"Yonsei Pain Clinic" is a generic name shared by several unrelated real clinics (Gwangjin-gu, Bucheon, and this one) — used Yonsei SM Pain Clinic since it\'s the closest to the accommodation. Confirm this is the right one, and get an appointment date, before relying on it.',
  }),
  wish('Verish (Seongsu flagship)', 'shopping', 37.5443, 127.057, {
    neighborhood: 'Seongsu-dong',
    notes: 'Undergarments flagship store.',
    hours: '11 AM–8 PM',
    travelFromGangnam: '36 Yeonmujang-gil (310-63 Seongsu-dong 2-ga), Seongdong-gu',
  }),
  wish('Nyu Nyu (Seongsu)', 'shopping', 37.5445, 127.0568, {
    neighborhood: 'Seongsu-dong',
    notes: 'Trendy fashion accessories & clothing, multiple floors.',
    hours: '10 AM–11 PM',
    travelFromGangnam: '89 Yeonmujang-gil, Seongdong-gu — same street as Verish',
    confidence: 'best-guess',
    flagNote: 'Source gave no address; matched to the Seongsu branch since it was listed right next to Verish, which is on the same street (Yeonmujang-gil). Nyu Nyu also has Myeongdong and Dongdaemun branches — confirm this is the intended one.',
  }),
  wish('Ssil', 'shopping', 37.5245, 127.0359, {
    neighborhood: 'Gangnam-gu',
    notes: 'Jewelry. Closed Sun & Mon.',
    hours: '12–8 PM',
    travelFromGangnam: '3rd Floor, 71 Apgujeong-ro 46-gil, Gangnam-gu',
  }),
  wish('Numbering', 'shopping', 37.5248, 127.0362, {
    neighborhood: 'Gangnam-gu',
    notes: 'Minimalist, everyday-wearable fine jewelry — rings, necklaces, and stacking pieces rather than statement jewelry. A quieter shopping stop than the Apgujeong flagship boutiques nearby.',
    hours: '11 AM–8 PM',
    travelFromGangnam: '38 Apgujeong-ro 48-gil, Gangnam-gu',
  }),
  wish('Jongno 3-ga Gold Street', 'shopping', 37.5703, 126.9919, {
    neighborhood: 'Jongno-gu',
    notes: 'Gold/jewelry shopping street.',
    hours: '10 AM–8 PM',
    travelFromGangnam: 'Near Exit 1, Jongno 3-ga Station (Lines 1, 3, 5)',
  }),
  wish('Gwangjang Market', 'market', 37.5701, 126.9996, {
    neighborhood: 'Jongno-gu',
    notes: "Seoul's most famous traditional market — legendary for bindaetteok (mung bean pancakes) and mayak gimbap (tiny, addictively good seaweed rice rolls), plus a huge secondhand/vintage silk and hanbok fabric section upstairs.",
    hours: 'Most food stalls ~9 AM–10 PM (varies by vendor)',
    travelFromGangnam: 'Near Jongno 5-ga Station, Line 1',
  }),
  wish('Mangwon Market', 'market', 37.5563, 126.9027, {
    neighborhood: 'Mangwon-dong, Mapo-gu',
    notes: "40+ year old neighborhood market, famous for Q's Dakgangjeong (sweet-spicy fried chicken bites) and Hwanginho croquettes — less touristy and more of a locals' market than Gwangjang.",
    hours: 'Daily 10 AM–9 PM (varies by store)',
    travelFromGangnam: '27 Poeun-ro 6-gil, Mapo-gu — west of Hongdae along the Han River side',
  }),
  wish('Bukchon Hanok Village', 'landmark', 37.5826, 126.9832, {
    neighborhood: 'Jongno-gu',
    notes: 'Historic hanok (traditional house) neighborhood on the hillside between Gyeongbokgung and Changdeokgung — narrow alleys, photogenic rooflines, small tea houses and craft shops tucked into converted hanoks. Still a residential area, so keep noise down.',
    bestTime: 'Morning, before tour groups arrive',
  }),
  wish('Mullae-dong', 'landmark', 37.5159, 126.8949, {
    neighborhood: 'Yeongdeungpo-gu',
    notes: "Former ironworks district turned arts quarter — working metal shops sit right next to galleries, indie bars, and studios built into the old machine works. Seoul's answer to a Brooklyn/Berlin industrial-arts neighborhood, with a rougher, less polished feel than Seongsu.",
    travelFromGangnam: 'Mullae Station, Line 2',
  }),
  wish('Hwaseong Fortress', 'landmark', 37.2857, 127.0108, {
    neighborhood: 'Suwon, Gyeonggi-do',
    notes: 'UNESCO World Heritage 18th-century fortress wall encircling old Suwon — ~5.7km of walkable ramparts, gates, and watchtowers with good city views. Can easily fill a half-day; a fortress train/shuttle covers the loop if you don\'t want to walk all of it.',
    travelFromGangnam: '~40-50 min via subway (Bundang/Suin-Bundang Line to Hwaseo or Suwon Station)',
    tips: 'Note: "Hwasung" is the same place (alternate romanization) — no need to plan for it separately.',
  }),
  wish('Starfield Library', 'landmark', 37.5111, 127.059, {
    neighborhood: 'Samseong-dong, Gangnam-gu (COEX Mall)',
    notes: 'Two-story, ~13m-tall bookshelf atrium inside COEX Mall — one of the most photographed indoor spots in Seoul. Free to visit, browse, or read; attached to the whole COEX underground mall/aquarium complex.',
    hours: 'Mall hours, typically 10 AM–10 PM',
    cost: 'Free',
    travelFromGangnam: 'Samseong Station, Line 2 — one stop from Yeoksam',
  }),
  wish('Daejeon (day trip)', 'trip', 36.3504, 127.3845, {
    neighborhood: 'Daejeon',
    notes: 'Compact enough for a day trip from Seoul — pair Daejeon Jungang Market and Jangtaesan Forest with a stop at Sungsimdang (the famous bakery, already on the food list) for tuigim-soboro bread.',
    cost: 'KTX ~₩23,000-33,000 one-way depending on train type',
    travelFromGangnam: 'KTX from Seoul Station, ~50 min direct',
  }),
  wish('Jangtaesan Recreational Forest', 'park', 36.3033, 127.3283, {
    neighborhood: 'Seo-gu, Daejeon',
    notes: "Metasequoia (redwood) tree-lined pathway plus the Skyway observation deck looking out over the forest canopy — one of Daejeon's best-known nature spots, especially striking in the golden-hour light.",
    travelFromGangnam: '461 Jangan-ro, Seo-gu, Daejeon — pairs naturally with a Daejeon day trip',
  }),
  wish('Daejeon Jungang Market', 'market', 36.3283, 127.4297, {
    neighborhood: 'Dong-gu, Daejeon',
    notes: 'One of Korea\'s most famous traditional markets — actually several markets combined, with distinct dried-seafood, hardware, fish, herbal-medicine, hanbok, and food streets. Near Daejeon Station.',
    hours: 'Daily 9 AM–7 PM',
    travelFromGangnam: '783 Daejeon-ro, Dong-gu, Daejeon',
  }),
  wish('JCM Spa Sauna (Yeoksam)', 'wellness', 37.4995, 127.0365, {
    neighborhood: 'Yeoksam-dong, Gangnam-gu',
    notes: 'A genuine local jjimjilbang, not a tourist-facing luxury spa — sauna, bathhouse, salt room, yellow clay steam room, massage chairs, and an on-site restaurant, a few minutes from the apartment.',
    hours: '24 hours',
    cost: '~₩12,000-15,000 entry',
    travelFromGangnam: '16 Nonhyeon-ro 63-gil, Gangnam-gu — inside the Yeoksam Jonghap Market "The Blue" building, short walk from Yeoksam or Seolleung Station',
    confidence: 'best-guess',
    flagNote: 'Address and facility list found via web search (local blog/business listings), not independently verified — confirm current hours and pricing before going.',
  }),
  wish('Dragon Hill Spa', 'wellness', 37.5297, 126.9648, {
    neighborhood: 'Yongsan-gu',
    notes: "One of Seoul's largest, most famous jjimjilbangs — a 7-story all-in-one complex with hot/cold pools, medicinal baths, an ice room, infrared rooms, a mini cinema, and even a golf practice range. On-site massage available (women's floor is 3F). More of a full-day \"attraction\" than a quiet neighborhood sauna, but still mid-range pricing, not a luxury day-spa.",
    hours: '24 hours',
    cost: '~₩15,000-25,000 entry (extra for massage/treatments)',
    travelFromGangnam: "40 Hangang-daero 21na-gil, Yongsan-gu — next to Yongsan Station / I'Park Mall, ~25-30 min from Gangnam via Line 2 → Line 1",
  }),
  wish('Jeongyeon Foot Massage (Gangnam)', 'wellness', 37.5175, 127.0405, {
    neighborhood: 'Gangnam-gu',
    notes: '28 years of reflexology experience — traditional Korean acupressure foot massage starting with a warm herbal foot soak. A well-established specialist rather than a hotel spa.',
    cost: 'Foot massage packages typically ₩40,000-60,000+',
    travelFromGangnam: '3F Unit 311, Gangnam Paragon, 338 Hakdong-ro, Gangnam-gu — ~5 min from Gangnam Station',
    confidence: 'best-guess',
    flagNote: "Address and details from the business's own site; coordinates estimated from the Hakdong-ro address, not geocoded — confirm before relying on it.",
  }),
];

// From two batches of Instagram food-post screenshots. Places that came with a full
// address in the source are used as-is; the 3 that didn't (Myeongdong K-Galbi, Sangsu
// Sogul, smob) were web-searched and matched — smob couldn't be confidently matched at
// all (search only turned up an unrelated sports-park chain of the same name), so it's
// unverified with no coordinates until there's more to go on.
export const FOOD_ADDITIONS = [
  food('Bouquet de Pain', '부케 드 팽', 'Sinsa-dong / Apgujeong', 'French bakery', '', 'Instagram (_withhelen)', 'Known for salt bread (소금빵). 653-18 Sinsa-dong, Gangnam-gu. Hours 10 AM–9 PM daily.', 37.527, 127.04),
  food('Myeongdong K-Galbi', '명동케이갈비', 'Myeongdong', 'Korean BBQ — marinated Hanwoo beef galbi', '', 'Instagram', 'Marinated Hanwoo beef galbi, cold noodles, dumplings; MSG-free house marinade.', 37.5636, 126.9834, {
    confidence: 'best-guess',
    flagNote: 'Source only tagged "Seoul, Korea" — address (5 Myeongdong 3-gil, Jung-gu) found via web search.',
  }),
  food('LAVACRO Cafe', '라바크로 카페', 'Eumseong-gun, Chungbuk — not Seoul', 'Themed café (bathroom-fixture décor)', '', 'Instagram (soulseoulfood)', 'Quirky café by bathroom brand Interbath — toilets/tiles as décor, wood-fired pizza & pasta. ~100km south of Seoul, roughly 1.5–2 hrs away, not a quick trip. 충북 음성군 대소면 대동로537번길 102. Hours 10 AM–8 PM.', 36.96, 127.523),
  food('Sangsu Sogul', '상수소굴', 'Sangsu-dong, Mapo-gu', 'Pub/tavern (anju) — arancini, pho, grilled gamjeori-sal', '', 'Instagram (sangsuhangout)', 'Near Sangsu Station Exit 4. Hours 6 PM–2 AM daily.', 37.5478, 126.9227, {
    confidence: 'best-guess',
    flagNote: 'Source tag "sangsuhangout" had no address — matched via web search to 상수소굴 at 24 Dongmak-ro 14-gil, Mapo-gu.',
  }),
  food('Ssangmi Gopchang (Yongsan)', '쌍미곱창 용산점', 'Yongsan-gu', 'Korean BBQ — beef intestine (gopchang), hanwoo', '', 'Instagram', 'Minari mixed grill ₩27,000, same-day-butchered hanwoo mungtigi (medium) ₩33,000, fried rice ₩5,500. 서울 용산구 한강대로15길 19-20 1층.', 37.5305, 126.9655),
  food('smob (스몹)', '스몹', 'Unknown', 'Unknown', '', 'Instagram', 'Name given with no address or other detail.', null, null, {
    confidence: 'unverified',
    flagNote: 'Could not confidently identify this as a food venue — web search only turned up "SMOB," an unrelated sports/entertainment park chain (Starfield malls in Hanam/Goyang/Suwon/Anseong/Daejeon), not a restaurant. Needs the original post or an address to pin down.',
  }),
  food('Cheongsudang (Gimpo)', '청수당 김포', 'Gurae-dong, Gimpo-si — not Seoul', 'Bakery / dessert café', '', 'Instagram', 'Large (~825㎡) bakery café, Japanese-style seating, rated 4.4. ~30–40 min from Gangnam by car, in Gimpo (Gyeonggi-do), not Seoul proper. 경기도 김포시 김포한강10로133번길 75. Hours 10 AM–10 PM (last order 9:30 PM).', 37.6404, 126.6274),
  food('Seoyang Myeonok (Seosunra-gil)', '서양면옥 서순라길점', 'Jongno-gu', 'Korean-Italian fusion', '', 'Instagram (@seoyangmyunok.seoul)', 'Hanwoo yukhoe perilla-oil capellini ₩22,000; spicy tomato soft-tofu pasta ₩22,000. 서울 종로구 율곡로8길 45 1층. Hours 12–9:30 PM (break 4–5 PM), closed Tuesdays.', 37.5735, 126.9915),
  food('Soigné', '', 'Sinsa-dong, Gangnam-gu', 'French-Italian-Korean fine dining', '', 'Michelin 2★', "Chef Jun Lee's contemporary tasting menus blend French and Italian technique with Korean sensibility. 2F Sinsa Square, 652 Gangnam-daero — ~500m from Garosu-gil.", 37.5202, 127.0229),
  food('London Bagel Museum (Anguk)', '런던베이글뮤지엄', 'Anguk-dong, Jongno-gu', 'Bagel bakery café', '', 'User request', "Seoul's original, most-hyped bagel spot — long queues (often 1-2 hrs) for cream-cheese-loaded bagels in a vintage-London-styled space. Pairs naturally with a Bukchon/Gwangjang day. Other branches: Dosan (Gangnam), Jamsil (Lotte World Tower), Suwon.", 37.5765, 126.985, {
    confidence: 'best-guess',
    flagNote: 'Multiple branches exist (Anguk, Dosan, Jamsil, Suwon) — picked Anguk since it\'s the original and pairs with the Bukchon/Gwangjang Market area. Swap the address if a different branch is more convenient.',
  }),
  // Restaurant-critic batch (2026-08-21): 10 quality/local-favorite restaurants for each of
  // Gangnam, Hongdae, Seocho, Yangjae, Gangdong, Noryangjin, Seongdong, Seongsu, and Dosan —
  // favoring long-running local institutions and genuine flavor over social-media hype.
  // Sourced via web search (Diningcode/Siksin/Naver/Michelin Guide Korea listings); addresses
  // without an independently-confirmed exact street address carry a `confidence`/`flagNote`.
  // Gangnam
  food('Seowon Jeongyuk Sikdang', '서원정육식당', 'Yeoksam-dong, Gangnam-gu', 'Korean BBQ (chadolbagi)', '₩20-30k', 'Local recommendation (hotplacehunter/siksin roundups)', "A no-frills, 30-plus-year butcher-shop-style grill with exactly three things on the menu: hanwoo chadolbagi (thin-sliced beef brisket), fresh pork belly, and doenjang-jjigae. Office workers have kept it alive for decades on the strength of the meat alone.", 37.5030, 127.0345),
  food('Motungi-jip', '모퉁이집', 'Yeoksam-dong, Gangnam-gu', 'Bunsik (ramyeon, gimbap)', '₩3-6k', 'Local recommendation (Seoul "old shop" designation)', "Holding down its Yeoksam-dong corner since 1988, this humble bunsik spot serves ramyeon, gimbap, and jumeokbap to generations of nearby office workers. Officially recognized by the city as a long-standing neighborhood shop.", 37.4988, 127.0355),
  food('Pyongyang Myeonok Nonhyeon', '평양면옥 논현점', 'Nonhyeon-dong, Gangnam-gu', 'Pyongyang naengmyeon', '₩14-25k', 'Local recommendation / naengmyeon "big 6" list', "A branch of the historic Pyongyang Myeonok naengmyeon lineage (same family as the Jangchung-dong original), known for delicate mul-naengmyeon and the pricier eobokjaengban (beef tripe hot pot) shared at the table.", 37.5145, 127.0227),
  food('Hyun Udon', '현우동', 'Nonhyeon-dong, Gangnam-gu', 'Japanese udon (housemade noodles)', '₩10-16k', 'Michelin Guide Seoul Bib Gourmand', "Udon master chef Park Sang-hyun's own noodle mill and shop, beloved since his earlier Samjeon-dong days. Housemade noodles and clean dashi have earned it both a Blue Ribbon and a Michelin Bib Gourmand.", 37.5140, 127.0223),
  food('Hansung Kalguksu', '한성칼국수 논현본점', 'Nonhyeon-dong, Gangnam-gu', 'Kalguksu / seafood pancake', '₩10-26k', 'Local recommendation (Naver review consensus)', "An old-school hanjeongsik-style kalguksu house known especially for its saeu-jeon (shrimp pancake) and moduem-jeon platter alongside classic knife-cut noodle soup — a fixture for Nonhyeon-dong regulars.", 37.5168, 127.0333),
  food('Imoga Itneun Jip', '이모가있는집', 'Nonhyeon-dong, Gangnam-gu', 'Budae-jjigae', '₩10-13k', 'Local recommendation (50-year institution)', "A 50-year-old Songtan-style budae-jjigae institution near Apgujeong Rodeo exit, famous for its cheese-topped version. A genuine neighborhood veteran that also happens to have a celebrity following.", 37.5215, 127.0325),
  food('Somunnan-jip', '소문난집', 'Samseong-dong, Gangnam-gu', 'Silnae pojangmacha (Korean tapas/anju)', '₩15-30k', 'Local recommendation (35-year indoor pojangmacha)', "An indoor pojangmacha that has poured drinks for Gangnam office workers for 35-plus years near Gangnam-gu Office station — the after-work institution locals mean when they say 'let's go to Somunnan-jip.'", 37.5093, 127.0555),
  food('Busan Agu', '부산아구', 'Nonhyeon-dong, Gangnam-gu', 'Agu-jjim (braised monkfish)', '₩35-55k', 'Local recommendation (45-year institution)', "A spicy agu-jjim (braised monkfish) specialist near Sinsa Station with roughly 45 years of history, known for the mixed agu-and-kkotge (monkfish and blue crab) steam pot.", 37.5163, 127.0203),
  food('Hamheung Myeonok', '함흥면옥', 'Sinsa-dong, Gangnam-gu', 'Hamheung-style naengmyeon', '₩13-18k', 'Local recommendation (Naver review consensus)', "A long-running Hamheung-style naengmyeon house near the Hyundai department store stretch of Sinsa, prized for its chewy hoe-naengmyeon (raw-fish cold noodles) and deep-flavored galbi-tang.", 37.5186, 127.0203),
  food('Kkokki Kkokki Chicken Hof', '꼬끼꼬끼치킨호프', 'Yeoksam-dong, Gangnam-gu', 'Retro fried chicken / hof', '₩15-25k', 'Local recommendation (40-year retro hof)', "A retro-style hof that has held its Yeoksam-dong spot for roughly 40 years, serving thin-battered old-fashioned fried chicken and crispy fried gizzards (ttongjip) alongside cold beer.", 37.4975, 127.0340),

  // Dosan
  food('Dak-euro-ga Apgujeong', '닭으로가 압구정본점', 'Sinsa-dong (Apgujeong Rodeo), Gangnam-gu', 'Dakgalbi', '₩13-17k', 'Local recommendation (Apgujeong Rodeo institution)', "A dakgalbi veteran near Apgujeong Rodeo Station exit 5 using only Korean chicken thigh meat, remembered fondly by locals as an 'old taste' hangout amid the area's constant turnover of trendy shops.", 37.5280, 127.0405),
  food('Mokro Pyeongyang Manduguk', '목로 평양만두국', 'Apgujeong-dong, Gangnam-gu', 'Pyongyang-style mandu-guk', '₩10-16k', 'Local recommendation (since 1987)', "Open since 1987, this Apgujeong noodle-and-dumpling shop has quietly outlasted the neighborhood's many fashion boutiques with hand-pleated Pyongyang-style mandu-guk.", 37.5270, 127.0290),
  food('Choiga-ne Mushroom Shabu', '최가네버섯전골', 'Sinsa-dong (Dosan-daero), Gangnam-gu', 'Mushroom shabu-shabu hot pot', '₩12-18k', 'Local recommendation (Dosan-daero 45-gil)', "An unpretentious mushroom-shabu hot pot spot tucked into the alleys near Dosan Park, serving spicy mushroom jeongol with hand-cut noodles — a low-key local favorite among the area's flashier openings.", 37.5238, 127.0343),
  food('Uga Enjoy Yukhoe Bibimbap', '우가엔조이', 'Sinsa-dong (Dosan-daero), Gangnam-gu', 'Yukhoe bibimbap', '₩15-20k', 'Local recommendation (Dosan-daero 49-gil)', "A lunch-only basement spot near Dosan Park built around a single dish — yukhoe bibimbap (raw beef tartare over rice) — that draws a steady mix of nearby office workers and regulars.", 37.5245, 127.0353),
  food('Son Guksi', '손국시', 'Nonhyeon-dong (Dosan-daero), Gangnam-gu', 'Kalguksu / kaljebi', '₩12-16k', 'Local recommendation (Dosan Park intersection)', "A tidy noodle house right at the Dosan Park intersection specializing in kalguksu and kaljebi (torn dough soup) — the kind of unfussy, honest bowl locals duck into between errands on Dosan-daero.", 37.5232, 127.0347),
  food('Woodfire Grill Steak', '우드파이어 그릴', 'Sinsa-dong (Dosan-daero), Gangnam-gu', 'Steak (wood-fired)', '₩40-70k', 'Local recommendation (Dosan-daero 49-gil)', "A low-lit, wood-fire grill steakhouse off Dosan-daero known for its L-bone steak, clam chowder, and mashed potatoes — favored for anniversaries and dates over flashier tasting-menu spots nearby.", 37.5240, 127.0348, { confidence: 'best-guess', flagNote: 'Business name reconstructed from a Korean listing describing it only as a "wood-fire grill steak specialist" on Dosan-daero 49-gil; exact signage name not independently confirmed.' }),
  food('Izakaya Jun', '이자카야 준', 'Sinsa-dong (Dosan-daero), Gangnam-gu', 'Japanese izakaya', '₩30-50k', 'Local recommendation (Naver review consensus)', "A private-room izakaya near the Dosan-daero end of Garosugil known for sashimi moriawase, spicy hormone jeongol (offal hot pot), and beef tendon oden nabe — a solid, unshowy drinking-and-dining spot.", 37.5192, 127.0218),
  food('Sinmi Sikdang', '신미식당', 'Apgujeong-dong, Gangnam-gu', 'Gamjatang / saeng-samgyeopsal', '₩12-18k', 'Local recommendation (20-year institution, featured on Sung Si-kyung\'s show)', "A 20-plus-year Apgujeong institution serving hearty gamjatang (pork-bone stew) loaded with perilla leaves and scallion, plus fresh pork belly — an old-guard comfort-food address among Apgujeong's polished storefronts.", 37.5268, 127.0287),
  food('Papis Taco', '파삐쓰 타코', 'Apgujeong-dong (Rodeo), Gangnam-gu', 'Tacos (Mexican)', '₩8-16k', 'Local recommendation (family-run Rodeo institution)', "A small, family-run taco counter a five-minute walk from Apgujeong Rodeo Station, made distinctive by all-housemade salsas — regarded locally as the area's most established taco spot, predating the recent taco trend.", 37.5265, 127.0395, { confidence: 'best-guess', flagNote: 'Exact street address not found in search results — location approximated as "near Apgujeong Rodeo Station" per multiple reviews.' }),
  food('Yakitori Chori', '야키토리 초리', 'Apgujeong-dong (Rodeo), Gangnam-gu', 'Yakitori (Japanese skewers)', '₩16k+ (set)', 'Local recommendation (Naver/Diningcode review consensus)', "A casual, no-bottle-minimum yakitori counter in the Apgujeong Rodeo backstreets offering a five-skewer omakase set — an accessible, craft-driven alternative to the area's pricier izakaya scene.", 37.5270, 127.0400, { confidence: 'best-guess', flagNote: 'Search sources gave two different addresses for this name; location approximated to the Apgujeong Rodeo area where it is consistently described as being.' }),

  // Seocho
  food('Jindaegam Gyodae', '진대감 교대점', 'Seocho-dong, Seocho-gu', 'Korean BBQ (chadol samhap)', '₩30-45k', 'Local recommendation (Naver review consensus)', "The Gyodae branch of the well-regarded Jindaegam chain, built around chadol samhap — thin-sliced beef brisket griddled with scallop and king oyster mushroom, finished with a flying-fish-roe fried rice.", 37.4935, 127.0140),
  food('Minami', '미나미', 'Seocho-dong, Seocho-gu', 'Japanese soba', '₩12-18k', 'Local recommendation (near Gyodae Station)', "A quiet, craft-focused soba specialist near Gyodae Station serving housemade buckwheat noodles — a low-key lunch favorite for Seocho office workers who want something more considered than a quick bibimbap.", 37.4928, 127.0163),
  food('Gyodae Gopchang', '교대곱창', 'Seocho-dong, Seocho-gu', 'Gopchang (grilled beef intestine)', '₩20-35k', 'Local recommendation (anchor of the Gyodae gopchang-street)', "The anchor restaurant of Gyodae's small gopchang alley near exit 14, known for its house 'teuk-yang' platter mixing tripe, beef brisket, mille-feuille tripe, and large intestine.", 37.4923, 127.0128),
  food('Jin Ododolppyeo Gyodae', '진오돌뼈 교대점', 'Seocho-dong, Seocho-gu', 'Dakbal / ododolppyeo (spicy grilled snacks)', '₩15-25k', 'Local recommendation (Naver/Daangn review consensus)', "A late-night grilled-cartilage and spicy chicken-feet specialist near Gyodae — a neighborhood drinking-food fixture rather than a destination restaurant, and better for it.", 37.4885, 126.9975),
  food('Sigol Yachae Doenjang', '시골야채된장', 'Seocho-dong, Seocho-gu', 'Doenjang-jjigae / cheonggukjang', '₩9-13k', 'Local recommendation ("old shop" listings for Seocho-dong)', "A rustic, vegetable-heavy doenjang and cheonggukjang (fermented soybean stew) specialist that has built a loyal Seocho-dong lunch crowd on simple, well-made home-style cooking.", 37.4985, 127.0270),
  food('Hansin Chicken Hof', '한신치킨호프', 'Jamwon-dong (Banpo), Seocho-gu', 'Electric-roasted chicken / hof', '₩20-25k', 'Local recommendation (Banwon market institution)', "A Banwon-sangga fixture in Jamwon-dong serving electric-roasted whole chicken with a punchy garlic sauce — the kind of unglamorous neighborhood hof residents have quietly loved for decades.", 37.5163, 127.0128),
  food('Banwon Kalguksu', '반원칼국수', 'Jamwon-dong (Banpo), Seocho-gu', 'Kalguksu', '₩8-11k', 'Local recommendation (Banwon market institution)', "Sharing the same Banwon-sangga block as Hansin Chicken Hof, this modest kalguksu counter is a Jamwon-dong lunchtime staple for hot, handmade knife-cut noodle soup.", 37.5163, 127.0128),
  food('Banpo Chicken', '반포치킨', 'Banpo-dong (Gubanpo), Seocho-gu', 'Electric-roasted garlic chicken', '₩20-25k', 'Local recommendation (47-year institution, "Seoul\'s 3 great chickens")', "Operating since 1977 in the Gubanpo shopping complex, this is frequently cited as one of Seoul's great old-guard chicken houses, known for garlic-forward electric-roasted whole chicken with the fat rendered out.", 37.5053, 126.9975),
  food('La Saveur', '라싸브어', 'Banpo-dong (Seorae Village), Seocho-gu', 'French (owner-chef bistro)', '₩50-100k', 'Local recommendation (Seorae Village institution)', "An owner-chef French restaurant in Seorae Village where the same chef handles cooking and service, built around escargot, foie gras, and prime hanwoo steak — understated technique over spectacle.", 37.4975, 126.9945),
  food('Nops Seorae', '놉스 서래마을점', 'Bangbae-dong (Seorae Village), Seocho-gu', 'American steakhouse', '₩50-90k', 'Local recommendation (Seorae Village steakhouse)', "A Brooklyn-style steakhouse ('No-Problem Steak House') in the Seorae Village/Bangbae area centered on a well-aged T-bone and a serious wine list — a straightforward carnivore's address among the area's French cafes.", 37.4940, 126.9930),
  // Hongdae
  food('Ilpyeon Jangeo', '일편장어 홍대본점', 'Hongdae, Mapo-gu', 'Grilled eel (jangeo-gui)', '₩35-55k', 'Naver review consensus', 'A sister restaurant to a Hongdae eel institution, serving live Japanese eel butchered to order and grilled tableside — prized by locals for freshness over the touristy galbi joints nearby.', 37.5533, 126.9208),
  food('Ttalbujane Bulbaek', '딸부자네불백', 'Hongdae, Mapo-gu', 'Korean bulbaek (grilled marinated meat over rice)', '₩10-15k', 'Diningcode review consensus', 'A no-frills neighborhood bulbaek joint serving thin-sliced marinated pork or beef over rice — the cheap, fast, flavor-forward lunch spot Hongdae office workers and students actually eat at.', 37.5540, 126.9255),
  food('Muwol Sikdak', '무월식탁', 'Hongdae, Mapo-gu', 'Korean home-style set meals', '₩12-18k', 'Local recommendation', 'A well-regarded Korean home-cooking table near Hongik University serving rotating banchan-heavy set meals in a calm space that locals return to for comfort food done right.', 37.5545, 126.9220),
  food('Udon Kaden', '우동카덴 합정점', 'Hapjeong, Mapo-gu (Hongdae area)', 'Japanese udon', '₩9-14k', 'Diningcode review consensus / TV feature', 'A clean, unfussy udon specialist near Hapjeong known for cold udon and rich dashi broth — a solid solo-dining lunch pick locals rely on rather than a tourist noodle shop.', 37.5498, 126.9145),
  food('Narae Hamburg Yeonnam', '나래함박 연남', 'Yeonnam-dong, Mapo-gu (Hongdae area)', 'Korean-style hamburg steak (hamubagu)', '₩13-18k', 'Diningcode review consensus', 'A Yeonnam-dong hamburg-steak specialist serving thick, juicy patties in sizzling sauce — a hearty, unpretentious stop locals hit before or after a walk through Yeonnam-dong.', 37.5645, 126.9255),
  food('Amazing Nongkhai', '어메이징 농카이', 'Hongdae/Seogyo-dong, Mapo-gu', 'Thai', '₩12-20k', 'Thai government-certified restaurant / local recommendation', 'A Thai-government-certified restaurant between Hongdae and Hapjeong that draws a genuinely Thai clientele — locals point to it as the real-deal alternative to Hongdae\'s diluted "Thai fusion" spots.', 37.5568, 126.9245),
  food('Yeongdong Gamjatang', '영동 감자탕', 'Mapo-gu (near Hongdae/Mangwon)', 'Gamjatang (pork bone & potato stew)', '₩10-14k', 'Diningcode/Siksin listing', 'A long-running gamjatang and kongbiji (soybean stew) spot near Hongdae serving deeply seasoned pork-bone soup — a cold-weather local staple rather than a photogenic hotspot.', 37.5590, 126.9130, { confidence: 'best-guess', flagNote: 'General area confirmed (Mapo-gu, near Hongdae) but exact street address not found in search results; coordinates approximate.' }),
  food('Yukjeon Gukbap Hongdae', '육전국밥 홍대점', 'Hongdae, Mapo-gu', 'Beef gukbap with pan-fried yukjeon', '₩10-13k', 'Diningcode review consensus', 'A 24-hour beef-and-yukjeon gukbap counter on the Hongdae strip, serving rich broth and pan-fried beef slices to local night owls long after the club crowds move on.', 37.5563, 126.9236, { confidence: 'best-guess', flagNote: 'Located on/near the main Hongdae strip per sources but exact street address not confirmed.' }),
  food('Uwa Hongdae', '우와 홍대본점', 'Hongdae, Mapo-gu', 'Okonomiyaki & yakisoba', '₩12-18k', 'Local recommendation / TV feature', 'A Japanese-style okonomiyaki spot using Andong mountain yam instead of flour for a lighter batter; its tomato okonomiyaki and shio yakisoba have made it a genuine local favorite rather than a tourist-menu Japanese place.', 37.5518, 126.9270),
  food('Yeonnam Geugot', '연남그곳', 'Yeonnam-dong, Mapo-gu (Hongdae area)', 'Jeyuk-bokkeum (spicy stir-fried pork)', '₩10-14k', 'Diningcode review consensus', 'A modest Yeonnam-dong jeyuk-bokkeum house popular with residents for spicy stir-fried pork and simple banchan — the everyday Korean lunch spot that never shows up on Instagram roundups.', 37.5645, 126.9250, { confidence: 'best-guess', flagNote: 'Exact street address not found in search results; general Yeonnam-dong location only.' }),

  // Seongsu
  food('Seongsu Jokbal', '성수족발', 'Seongsu-dong, Seongdong-gu', 'Jokbal (braised pork trotters)', '₩28-38k', 'Local/press consensus ("Top 3 Jokbal in Seoul")', 'A roughly 30-year-old jokbal institution widely cited as one of Seoul\'s top three, known for tender, glossy, sweet-savory braised pork trotters — a neighborhood fixture that predates Seongsu\'s café boom.', 37.5460, 127.0543),
  food('Horangi Siktak', '호랑이식탁', 'Seongsu-dong, Seongdong-gu', 'Korean rice bowls (donburi-style)', '₩11-16k', 'Diningcode review consensus', 'Tucked near Ttukdo Market away from the main café strip, this rice-bowl counter serves office workers and residents rather than tourists — hearty, generous bowls built for a fast lunch.', 37.5450, 127.0480),
  food('Dojo', '도죠', 'Seongsu-dong, Seongdong-gu', 'Japanese karaage (fried chicken)', '₩13-19k', 'Local recommendation', 'A karaage specialist set back from Seongsu\'s trendy main drag, serving generous chicken with crackling, non-greasy batter — locals\' pick over the flashier bar-and-grill spots near the station.', 37.5455, 127.0515),
  food('Tendon Sikdang', '텐동식당', 'Seongsu-dong, Seongdong-gu', 'Japanese tendon (tempura rice bowl)', '₩12-17k', 'Diningcode/Visit Korea listing', 'A tempura-rice-bowl specialist on the old shoemakers\' street, known for crisp, hot tendon at accessible prices — a reliable, quality-first lunch pick amid Seongsu\'s pop-up churn.', 37.5445, 127.0555),
  food('Solsot Seongsu', '솔솥 성수', 'Seongsu-dong, Seongdong-gu', 'Korean stone-pot rice with seafood', '₩18-28k', 'Local recommendation (community "all-time favorite")', 'A stone-pot (dolsot) specialist serving bubbling rice topped with premium seafood like snapper, scallop, and abalone — consistently named an all-time favorite by people who actually live and work in Seongsu.', 37.5446, 127.0556),
  food("Halmeoni's Recipe", '할머니의 레시피', 'Seongsu-dong, Seongdong-gu', 'Korean home-style cooking', '₩12-18k', 'Local recommendation (community "all-time favorite")', "A homestyle Korean kitchen near Seoul Forest leaning on grandmother-style recipes and seasonal banchan — beloved by residents as an antidote to Seongsu's ever-changing café scene.", 37.5445, 127.0410),
  food('Seongsubudo', '성수부도', 'Seongsu-dong, Seongdong-gu', 'Korean tofu dishes', '₩10-15k', 'Local worker recommendation', 'A tofu-focused Korean kitchen recommended by Seongsu office workers as an everyday lunch spot — simple, well-made food rather than anything built for photos.', 37.5445, 127.0559, { confidence: 'best-guess', flagNote: 'Named in local "recommended by workers" roundups but exact street address not found; coordinates are a general Seongsu-dong estimate.' }),
  food('Le Prique', '르프리크', 'Seongsu-dong, Seongdong-gu', 'Nashville-style hot chicken burger', '₩13-17k', 'Local recommendation', 'A Nashville hot chicken burger specialist in the basement of Blue Stone Tower near Seongsu Station — a flavor-driven fried chicken sandwich spot with a loyal following distinct from the area\'s dessert-café crowd.', 37.5445, 127.0560),
  food('Neungdong Minari', '능동미나리', 'Seongsu-dong, Seongdong-gu', 'Minari-gomtang (water celery beef soup)', '₩13-18k', 'Michelin Guide-listed / Diningcode consensus', 'Known for minari-gomtang — a clean, herbal beef bone broth loaded with water celery — this spot draws long local waits for its distinctive palate-cleansing soup rather than viral plating.', 37.5445, 127.0563),
  food('Han Jung Sun', '한정선', 'Seongsu-dong, Seongdong-gu', 'Korean rice cake & mochi desserts', '₩3-6k', 'Local recommendation', 'A queue-worthy fresh-fruit chapssaltteok (mochi rice cake) stand locals cite for genuinely well-made traditional Korean dessert — a rare exception among Seongsu\'s dessert spots for old-school technique over Instagram styling.', 37.5445, 127.0559, { confidence: 'best-guess', flagNote: 'Exact street address not found in search results; general Seongsu-dong estimate. Included as a dessert exception given its cited quality/technique.' }),

  // Seongdong
  food('Choi Younghee Eonyang Bulgogi', '최영희언양불고기', 'Wangsimni, Seongdong-gu', 'Eonyang-style bulgogi', '₩15-20k', 'TV-featured / Diningcode consensus', 'A verified Eonyang-style bulgogi specialist that has appeared on multiple Korean food-TV segments, serving thin-cut grilled beef and a well-priced lunch set — a genuine Wangsimni institution rather than a tourist BBQ spot.', 37.5645, 127.0370),
  food('Jeil Gopchang', '제일곱창', 'Wangsimni, Seongdong-gu', 'Gopchang (grilled beef intestine)', '₩20-28k', 'Local queue consensus', "The anchor of Wangsimni's gopchang alley, where locals queue for smoky grilled beef intestine — an old-school, meat-market-adjacent institution with zero pretense.", 37.5613, 127.0377, { confidence: 'best-guess', flagNote: 'Located in the well-documented Wangsimni gopchang alley but exact street address not found; coordinates approximate.' }),
  food('Insaeng Hanwoo', '인생한우', 'Majang-dong, Seongdong-gu', 'Hanwoo (Korean beef butcher-restaurant)', '₩30-50k', 'Local recommendation / travel blog consensus', 'A butcher-restaurant in the Majang-dong meat market where diners pick their own cut of hanwoo at near-wholesale prices, then have it grilled tableside — the meat-market dining experience Seoul carnivores seek out.', 37.5665, 127.0430),
  food('Hanwoo Gohyang', '한우고향', 'Majang-dong, Seongdong-gu', 'Hanwoo (1++ grade Korean beef)', '₩35-55k', 'Local/press consensus', 'Operating in the Majang-dong cattle market since 1978 and selling only 1++ grade hanwoo, this butcher-restaurant is a genuine multi-generational institution for serious beef eaters.', 37.5670, 127.0435, { confidence: 'best-guess', flagNote: 'Long operating history (since 1978) well documented but exact street address not found; coordinates are a Majang-dong market-area estimate.' }),
  food('Daegu-jip', '대구집', 'Majang-dong, Seongdong-gu', 'Beef yukhoe & specialty cuts', '₩25-45k', 'Local recommendation', "A beef specialist tucked in Majang-dong's meat-market alley known for yukhoe (raw beef) alongside less common cuts like ggotsal and yangkkitmeori — a destination for locals who know their beef.", 37.5670, 127.0435, { confidence: 'best-guess', flagNote: 'Located in the Majang-dong meat-market alley but exact street address not found; coordinates approximate.' }),
  food('Sushi Dokugen Wangsimni', '스시도쿠겐 왕십리본점', 'Wangsimni, Seongdong-gu', 'Japanese sushi omakase', '₩49-119k', 'Diningcode/press consensus', 'A high-volume premium sushi omakase near Wangsimni Station offering lunch and dinner tasting courses — locals treat it as a serious, quality-driven omakase rather than a trendy one-off.', 37.5615, 127.0370),
  food('Pujutgan Saenggogijeom', '푸줏간생고기점', 'Haengdang-dong, Seongdong-gu', 'Samgyeopsal (grilled pork belly)', '₩13-18k', 'Local recommendation / model restaurant designation', 'A designated "model restaurant" near Haengdang Market grilling certified Korean pork belly on a dome-shaped griddle with onion, potato, and kimchi around the edge — an unpretentious neighborhood grill locals trust.', 37.5595, 127.0330),
  food('Mandu Jeonppang', '만두전빵', 'Haengdang-dong, Seongdong-gu', 'Mandu-jeongol (dumpling hotpot) & mandu', '₩9-15k', 'Local recommendation', 'A modest Haengdang-dong dumpling house serving homemade mandu-jeongol (dumpling hot pot) and mung-bean pancakes with the "mom\'s cooking" character that keeps a neighborhood coming back.', 37.5590, 127.0320),
  food('Jogae Changgo', '왕십리 조개창고', 'Wangsimni, Seongdong-gu', 'Grilled shellfish (jogae-gui)', '₩25-40k (often all-you-can-eat)', 'Diningcode review consensus', 'An all-you-can-eat grilled shellfish spot near Wangsimni Station popular for group dinners — a straightforward, ingredient-driven seafood grill rather than a trendy small-plates concept.', 37.5615, 127.0395),
  food('Hongneung Jokbal', '홍능족발1977 왕십리', 'Wangsimni, Seongdong-gu', 'Jokbal, specializing in crispy fried-style jokbal', '₩25-35k', 'Local recommendation', 'Operating since 1977, this Wangsimni jokbal shop is known for its crispy fried-style jokbal — a genuine multi-decade neighborhood institution distinct from the more famous Seongsu jokbal row.', 37.5613, 127.0377, { confidence: 'best-guess', flagNote: "Name and 'since 1977' claim found in local sources but exact street address not confirmed; coordinates approximate (Wangsimni area)." }),
  // Yangjae
  food('Imbyeongju Sandong Kalguksu', '임병주산동칼국수', 'Yangjae-dong, Seocho-gu', 'Kalguksu (noodles)', '₩9-13k', 'Naver/Michelin review consensus', "Running since 1988 with the founder's name and hometown on the sign; hand-cut noodles in a clean clam broth. A Michelin Bib Gourmand pick every year from 2017-2025 — the rare Yangjae spot locals and critics agree on.", 37.4841, 127.0347),
  food('Bruce Lee', '브루스리', 'Yangjae-dong, Seocho-gu', 'Chinese (dim sum)', '₩15-30k', 'Local recommendation', 'A fixture on Yangjaecheon cafe street for authentic Chinese cooking — dim sum, wontons, stir-fried noodles, and beef noodle soup — deliberately skipping the jjajangmyeon/jjamppong playbook. Groups of 5+ only for reservations.', 37.4780, 127.0365),
  food('Byeokje Galbi (Yangjae branch)', '벽제갈비 양재점', 'Yangjae-dong, Seocho-gu', 'Korean BBQ (hanwoo)', '₩60k+', 'Local recommendation', 'Branch of the premium hanwoo institution that sources beef from daily auctions; the flagship brand behind it is Michelin-recognized. Genuine quality-over-flash Korean BBQ, not a photo-op grill.', 37.4860, 127.0300, {
    confidence: 'best-guess',
    flagNote: 'This is the branded Yangjae branch at Gangnam-daero 283; the main/flagship Byeokje Galbi location is actually in Bangi-dong, Songpa-gu, not Yangjae-dong — exact coordinates approximated.',
  }),
  food('Bongpiyang (Yangjae)', '봉피양 양재점', 'Yangjae-dong, Seocho-gu', 'Korean BBQ / Pyongyang naengmyeon', '₩14-30k', 'Naver review consensus', 'Charcoal-grilled bone-in pork galbi paired with a tangy, well-regarded Pyongyang-style naengmyeon — the broth gets its edge from a splash of mul-kimchi brine. A lunch set with ribs plus naengmyeon or doenjang-jjigae is the local move.', 37.4890, 127.0295),
  food('Hwangjaebeol', '황재벌', 'Yangjae-dong, Seocho-gu', 'Kkomjangeo (grilled conger eel) / jjukkumi', '₩20-35k', 'Local recommendation', 'Charcoal-grilled conger eel and spicy stir-fried webfoot octopus a few minutes from Yangjae Station Exit 1 — smoky, chewy, and built for drinking. Order the soft egg custard alongside to cut the heat.', 37.4845, 127.0345),
  food('Hanguk Sundae (main branch)', '한국순대 본점', 'Yangjae-dong, Seocho-gu', 'Sundae-guk (blood sausage soup)', '₩9-12k', 'Local recommendation', 'A 24-hour, no-holiday sundae-guk institution near Yangjae Station — old-school original-recipe sausage in a hearty, spicy broth. The kind of place locals default to at 2am.', 37.4790, 127.0375),
  food('Sandeulhae (Yangjae)', '샌들해 양재', 'Yangjae-dong, Seocho-gu', 'Hanjeongsik (Korean set meal)', '₩20-35k', 'Local recommendation', 'A multi-dish hanjeongsik spread near Yangjae Station, favored for lunch meetings and family visits over trend-chasing tasting menus.', 37.4835, 127.0350, {
    confidence: 'best-guess',
    flagNote: 'Found via limited English-language listings (Tripadvisor/Autoreserve); exact address not independently confirmed.',
  }),
  food('Yangjae Dakjip', '양재닭집', 'Yangjae-dong, Seocho-gu', 'Dak-jjim / chicken stew', '₩25-40k', 'Local recommendation', 'Neighborhood comfort food built around a slow-braised chicken stew with vegetables — the kind of unfussy, flavor-first spot that keeps regulars rather than tourists.', 37.4838, 127.0355, {
    confidence: 'best-guess',
    flagNote: 'Only one substantive source found (EatingSeoul); exact address not independently verified.',
  }),
  food('Doeji Yeonguso (Yangjae)', '돼지연구소 양재직영점', 'Yangjae-dong, Seocho-gu', 'Grilled pork (samgyeopsal/gabrisal)', '₩17-25k', 'Local recommendation', 'A pork-specialty grill near the Bangbae intersection known for skirt meat (gabrisal) and pork belly platters plus a well-regarded doenjang-guk side. Expect a wait; phone reservations only.', 37.4890, 127.0295),
  food('Hanyang Tonkatsu', '한양돈까스', 'Yangjae-dong, Seocho-gu', 'Tonkatsu (Korean-style)', '₩12-18k', 'Local recommendation', 'The best-known tonkatsu shop on Yangjaecheon cafe street, an old-school Korean-style cutlet spot that also pours draft beer — a local hangout more than a destination.', 37.4780, 127.0370),

  // Gangdong
  food('Cheonho Jjukkumi', '천호쭈꾸미', 'Seongnae-dong, Gangdong-gu', 'Jjukkumi (spicy webfoot octopus)', '₩13-20k', 'Local recommendation', 'A Cheonho neighborhood staple for fiery stir-fried webfoot octopus, the kind of unpretentious spot residents return to rather than something built for visitors.', 37.5305, 127.1260),
  food('Choe Naengmyeon (main branch)', '최냉면 본점', 'Seongnae-dong, Gangdong-gu', 'Mulhoe-naengmyeon (raw fish cold noodles)', '₩12-16k', 'Naver review consensus', 'A tight, focused menu built around squid mulhoe-naengmyeon — cold noodles in a sashimi-broth style rarely seen outside coastal towns, with a live squid tank by the entrance.', 37.5305, 127.1250),
  food('Lee Hanjin Sukseonghoe', '이한진 숙성회', 'Cheonho-dong, Gangdong-gu', 'Sukseonghoe (aged flounder sashimi)', '₩25-45k', 'Naver review consensus', "Reborn after Cheonho redevelopment from the old Mungteong Hoetjip; a single-minded menu of thick-cut aged flatfish sashimi and a meat-heavy maeuntang. Constantly busy, take-out only if you can't get a table.", 37.5380, 127.1230, {
    confidence: 'best-guess',
    flagNote: 'Exact street address not found in search results; located in Cheonho-dong per multiple sources.',
  }),
  food('Deunggalbi Dalin (main branch)', '등갈비달인 본점', 'Seongnae-dong, Gangdong-gu', 'Deunggalbi (spicy pork back ribs)', '₩16-25k', 'Local recommendation', 'A Cheonho-area specialist in spicy grilled/braised pork back ribs — a heartier, more local alternative to the trendier galbi chains near the station.', 37.5310, 127.1270),
  food('Gupo Guksu', '구포국수', 'Amsa-dong, Gangdong-gu', 'Busan-style wheat noodles', '₩6-9k', 'Local recommendation', 'A Busan-style noodle counter in Amsa-dong serving cheap, fast bibim-guksu and broth noodles — resolutely a neighborhood lunch spot, not a destination.', 37.5500, 127.1300),
  food('Songwol Naengmyeon', '송월냉면', 'Cheonho-dong, Gangdong-gu', 'Naengmyeon (cold noodles)', '₩10-14k', 'Naver review consensus', "Part of Cheonho-dong's cold-noodle alley, known for generous portions of yeolmu-naengmyeon (young radish greens) alongside standard mul- and bibim-naengmyeon.", 37.5410, 127.1260),
  food('Goyanjip Son Kalguksu', '고향집손칼국수', 'Myeongil-dong, Gangdong-gu', 'Kalguksu (hand-cut noodles)', '₩8-11k', 'Local recommendation', 'A modest, homestyle hand-cut noodle shop near Godeok/Myeongil that locals reach for on a cold day — no branding, no queue theater, just broth and noodles done right.', 37.5520, 127.1470),
  food('Bongi-ppyeo Haejangguk', '봉이뼈해장국', 'Cheonho-dong, Gangdong-gu', 'Ppyeo-haejangguk (pork bone hangover soup)', '₩9-13k', 'Naver review consensus', 'A pork-bone hangover soup specialist on Olympic-ro in Cheonho — deep, long-simmered broth that regulars rely on the morning after.', 37.5380, 127.1260),
  food('Sonmunnan Tojong Sundaeguk', '소문난토종순대국', 'Gil-dong, Gangdong-gu', 'Sundae-guk (native-breed blood sausage soup)', '₩9-12k', 'Local recommendation', "Sits right at the entrance to Gildong Market, using native-breed pork for a richer sundae-guk than the mass-market versions nearby — a market-worker's lunch spot that outsiders rarely find.", 37.5380, 127.1430),
  food('Hwanggung Jjampong', '황궁짬뽕', 'Cheonho-dong, Gangdong-gu', 'Chinese-Korean (jjajangmyeon/jjampong)', '₩4-8k', 'Naver review consensus', 'An unpretentious neighborhood Chinese-Korean joint near Cheonho known for rock-bottom prices — jjampong from around ₩4,000 — and consistent ganjjajang, not flash.', 37.5410, 127.1280),

  // Noryangjin
  food('Jaguemseong', '자금성', 'Noryangjin-dong, Dongjak-gu', 'Chinese-Korean (jjampong/jjajangmyeon)', '₩4-9k', 'Naver review consensus', 'A cheap, vegetable-forward jjampong behind Samik Plaza that locals and exam-prep students swear by — clean broth over the usual oily versions, ganjjajang and tangsuyuk also solid.', 37.5120, 126.9410),
  food('Jinju Sikdang', '진주식당', 'Noryangjin-dong, Dongjak-gu', 'Sukseonghoe (kelp-aged raw fish)', '₩20-40k', 'Naver review consensus', 'A 35-year-old restaurant on the fish market\'s 5th floor with a river-and-mountain view; fish is kelp-aged (dasima-sukseong) before serving, giving the sashimi extra umami over a straight raw cut.', 37.5086, 126.9391, {
    confidence: 'best-guess',
    flagNote: 'Located inside the Noryangjin Fisheries Wholesale Market building; exact stall/unit address not confirmed, coordinates approximate the market center.',
  }),
  food('Jeolla Sanghoe', '전라상회', 'Noryangjin-dong, Dongjak-gu', 'Daebang-eo (winter amberjack)', '₩25-45k', 'Naver review consensus', 'A market-floor specialist in daebang-eo — large winter amberjack over 10kg, prized for well-marbled belly cuts — sought out by regulars during amberjack season rather than casual tourists.', 37.5086, 126.9391, {
    confidence: 'best-guess',
    flagNote: 'Located inside the Noryangjin Fisheries Wholesale Market; exact stall address not confirmed, coordinates approximate the market center.',
  }),
  food('Daraesikdang', '다래식당', 'Noryangjin-dong, Dongjak-gu', 'Cheonggukjang (fermented soybean stew) / baekban', '₩8-11k', 'Local recommendation', "A generous, cheap jumulleok-cheonggukjang baekban that's sustained generations of Noryangjin exam-prep students — the definitive non-seafood local lunch here.", 37.5130, 126.9420),
  food('Wangwang Imone Cupbap', '왕왕이모네컵밥', 'Noryangjin-dong, Dongjak-gu', 'Cupbap (rice bowl street food)', '₩3-5k', 'Local recommendation', 'A five-minute walk from Noryangjin Station on the famous cupbap street; the loaded 16-topping "imo-pyo wangteuk" is the order that built the reputation among gongsi students for decades.', 37.5138, 126.9428),
  food('Cheongnok Minari Sikdang', '청록미나리식당', 'Noryangjin-dong, Dongjak-gu', 'Minari shabu-shabu', '₩15-25k', 'Naver review consensus', "A station-area shabu-shabu spot built around fresh minari (water celery) — a lighter, herbaceous local counterpoint to the market's heavier raw-fish spreads.", 37.5140, 126.9430),
  food('Dadogine Sutbulgui', '다독이네숯불구이', 'Noryangjin-dong, Dongjak-gu', 'Charcoal-grilled samgyeopsal', '₩13-18k', 'Naver review consensus', 'A well-reviewed charcoal pork belly grill near Noryangjin Station, popular with locals for straightforward grilled pork over market seafood.', 37.5140, 126.9425),
  food('Oijingeoya', '오징어야', 'Noryangjin-dong, Dongjak-gu', 'Live seafood / squid sashimi', '₩15-30k', 'Naver review consensus', "A market-adjacent seafood spot specializing in live squid and whatever's in season, priced well below the tourist-facing chojang restaurants inside the main market building.", 37.5100, 126.9400),
  food('Yumena Ramen', '유메나라멘', 'Noryangjin-dong, Dongjak-gu', 'Tonkotsu ramen', '₩7-10k', 'Local recommendation', "A cupbap-street ramen shop serving generous, cheap tonkotsu bowls — a rare non-Korean comfort-food anchor for the neighborhood's exam-prep crowd.", 37.5136, 126.9429),
  food('Nodeulnaru Bapsang', '노들나루밥상', 'Noryangjin-dong, Dongjak-gu', 'Hanjeongsik / baekban', '₩10-16k', 'Local recommendation', 'A proper multi-banchan Korean set-meal restaurant in the Noryangjin hagwon district — a real home-style alternative to the neighborhood\'s cupbap stalls and market crowds.', 37.5128, 126.9415),
];

async function seedBatch(entries) {
  let batch = writeBatch(db);
  let pending = 0;

  const stage = (colName, id, data) => {
    batch.set(doc(collection(db, colName), slug(id)), data);
    pending++;
  };
  const flush = async () => {
    if (pending === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    pending = 0;
  };

  for (const { col, idSeed, data } of entries) {
    stage(col, idSeed, data);
    if (pending >= 400) await flush();
  }
  await flush();
}

export async function seedAll() {
  await seedBatch([
    ...ITINERARY_SEED.map((item) => ({ col: 'itineraryItems', idSeed: `${item.title}-${item.date}`, data: item })),
    ...WISHLIST_SEED.map((item) => ({ col: 'wishlistItems', idSeed: item.title, data: { scheduled: false, ...item } })),
    ...FOOD_SEED.map((item) => ({ col: 'foodPlaces', idSeed: item.nameEn || item.nameKo, data: item })),
  ]);

  console.info(
    `Seeded ${ITINERARY_SEED.length} itinerary items, ${WISHLIST_SEED.length} wishlist items, ${FOOD_SEED.length} food places.`
  );
}

// Run once (safe to re-run — same idempotent slug-based IDs) to add just the newer
// items (PDF batch + Instagram screenshots + calendar additions) without touching
// anything already seeded via seedAll().
export async function seedAdditions() {
  await seedBatch([
    ...ITINERARY_ADDITIONS.map((item) => ({ col: 'itineraryItems', idSeed: `${item.title}-${item.date}`, data: item })),
    ...WISHLIST_ADDITIONS.map((item) => ({ col: 'wishlistItems', idSeed: item.title, data: { scheduled: false, ...item } })),
    ...FOOD_ADDITIONS.map((item) => ({ col: 'foodPlaces', idSeed: item.nameEn || item.nameKo, data: item })),
  ]);

  console.info(
    `Seeded ${ITINERARY_ADDITIONS.length} new itinerary items, ${WISHLIST_ADDITIONS.length} new wishlist items, and ${FOOD_ADDITIONS.length} new food places.`
  );
}
