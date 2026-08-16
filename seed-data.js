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
    notes: 'Yongsan-gu.',
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
    notes: 'Second Pixx location.',
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
  food('Imun Seolnongtang', '이문설농탕', 'Jongno / Insadong', 'Beef bone soup', '~₩15,000', 'Neighborhood Guide', 'Since 1904; arrive before noon.', 37.5721, 126.9902),
  food('Tosokchon Samgyetang', '토속촌', 'Jongno / Insadong', 'Ginseng chicken soup', '₩17-20k', 'Neighborhood Guide', 'Lines by 11am. 서울 종로구 자하문로5길 5 (Chebu-dong, Seochon, near Gyeongbokgung).', 37.5758, 126.97),
  food('Jeonju Yuhalmeoni Bibimbap', '전주유할머니', 'Jongno / Insadong', 'Bibimbap', '₩12-15k', 'Neighborhood Guide', '50+ yrs; stone-pot crispy rice; Korean menu only.', 37.573, 126.985),
  food('Aux Petits Verres', '', 'Jongno / Insadong', 'Pastry/desserts', '', 'Culinary Class Wars (White Spoon — Park Joonwoo)', 'Belgian tarts.', 37.573, 126.985),

  // Hongdae & Mapo
  food('Jeongdaepo', '정대포', 'Hongdae / Mapo', 'Thick-cut pork belly BBQ', '₩40-60k for 2', 'Neighborhood Guide', 'Charcoal at table.', 37.553, 126.9236),
  food('Hongdae Walkable Street', '', 'Hongdae / Mapo', 'Street food market', '₩3-7k items', 'Neighborhood Guide', 'Open to 2am weekends.', 37.5563, 126.9238),
  food('Tutu Chicken', '투투치킨', 'Hongdae / Mapo', 'Fried chicken & beer', 'Under ₩30k for 2', 'Neighborhood Guide', 'Walk-in only.', 37.5527, 126.9236),
  food('Noorungji Tongdak', '누룽지통닭', 'Hongdae / Mapo', 'Fried chicken & beer', '₩30k for 2', 'Neighborhood Guide', 'Crispy coating.', 37.5527, 126.9236),
  food('Lee Buk Bang', '', 'Hongdae / Mapo', 'North Korean', '', 'Culinary Class Wars (White Spoon — Choi Jihyung)', 'N. Korean sundae, Michelin-rated 5 yrs; Mapo.', 37.556, 126.942),
  food('Jinjin', '', 'Hongdae / Mapo', 'Korean-Chinese', '', 'Culinary Class Wars (White Spoon — Hwang Jinseon)', 'Menbosha; Mapo.', 37.556, 126.942),
  food('Toledo Pasta Bar', '', 'Hongdae / Mapo', 'Italian/Sicilian', '', 'Culinary Class Wars (Black Spoon, season winner — Kwon Sungjoon)', 'Mapo.', 37.556, 126.942),

  // Myeongdong & Sinchon
  food('Hadongkwan', '하동관', 'Myeongdong / Sinchon', 'Beef bone broth', '≤₩15,000', 'Neighborhood Guide', 'Since 1939; single-menu; lines before 10am.', 37.5636, 126.9834),
  food('Myeongdong Street Food Alley', '', 'Myeongdong / Sinchon', 'Street snacks', '', 'Neighborhood Guide', 'Gyeran-ppang, hodugwaja, tteokbokki, corn dogs.', 37.5636, 126.9834),
  food("Yonsei-area student restaurants", '', 'Myeongdong / Sinchon', 'Korean set meals', '₩8-12k', 'Neighborhood Guide', 'Unlimited banchan.', 37.5665, 126.9385),

  // Gangnam & Apgujeong
  food('Yeontabal', '연탄발', 'Gangnam / Apgujeong', 'Charcoal-grilled beef', '', 'Neighborhood Guide', 'Bulgogi, short ribs; smart casual.', 37.5172, 127.0473),
  food('Han Chu', '한추', 'Gangnam / Apgujeong', 'Fried chicken & beer', '₩20-30k for 2', 'Neighborhood Guide', '20+ yrs; double-fried.', 37.4979, 127.0276),
  food('Mingles', '', 'Gangnam / Apgujeong', 'Fine dining', 'Lunch ₩88k / dinner ₩220k', 'Michelin 2★, Asia\'s 50 Best #4', 'Book 2-4 wks out.', 37.5245, 127.0359),
  food('Choi Dot', '', 'Gangnam / Apgujeong', 'Haute cuisine', '', 'Culinary Class Wars (White Spoon — Choi Hyunseok)', 'Jang Trio Steak.', 37.5245, 127.0359),
  food('Tian Mi Mi', '', 'Gangnam / Apgujeong', 'Chinese/HK, dim sum', '', 'Culinary Class Wars (White Spoon — Jung Jisun)', 'Gangnam & Hongdae branches.', 37.5172, 127.0286),
  food('Yun Seoul / Myeon Seoul', '', 'Gangnam / Apgujeong', 'Noodles', '', 'Culinary Class Wars (White Spoon — Kim Doyun)', 'Perilla oil noodles.', 37.5172, 127.0286),
  food('EVETT', '', 'Gangnam / Apgujeong', 'Korean-Western fusion', '', 'Culinary Class Wars (White Spoon — Joseph Lidgerwood)', 'Lemongrass ants.', 37.5245, 127.0359),
  food('Hong Bo Gak', '', 'Gangnam / Apgujeong', 'Chinese', '', 'Culinary Class Wars (Yeo Gyeongrae / Park Eunyoung)', 'Moja shrimp.', 37.5172, 127.0286),
  food('Bistro Spark', '', 'Gangnam / Apgujeong', 'Italian, pasta', '', 'Culinary Class Wars (Black Spoon — Shawn Park)', '', 37.5172, 127.0286),
  food('Pono Buono', '', 'Gangnam / Apgujeong', 'Italian fusion', '', 'Culinary Class Wars (Black Spoon — Kim Taesung)', 'Black truffle risotto.', 37.5172, 127.0286),
  food('Trid Seoul', '', 'Gangnam / Apgujeong', 'Fine dining', '', 'Michelin-starred, Culinary Class Wars (Black Spoon — Kang Seungwon)', 'Triple choux.', 37.5172, 127.0286),

  // Sindang & Jamsil
  food('Sindang Tteokbokki Town', '', 'Sindang / Jamsil', 'Spicy rice cakes', '₩5-10k', 'Neighborhood Guide', 'Since 1970s; pot-served at table.', 37.5657, 127.0177),
  food('Omori Jjigae', '오모리찌개', 'Sindang / Jamsil', 'Kimchi stew', '₩10-12k', 'Neighborhood Guide', 'Aged-cabbage broth; near KSPO Dome.', 37.5206, 127.1218),
  food('Gosari Express', '', 'Sindang / Jamsil', 'Plant-based, gosari sauce', '', 'Michelin Bib Gourmand 2026 (new)', 'Jungang Market, Jung-gu.', 37.5657, 126.9976),
  food('Andongjip Son Kalguksi / Cheerful Drinking Table', '', 'Sindang / Jamsil', 'Hand-cut noodles', '', 'Culinary Class Wars (Black Spoon — Kim Miryung)', 'Dongdaemun & Dobong.', 37.5744, 127.0098),
  food('ChoKwang101 / 201', '', 'Sindang / Jamsil', 'Chinese, Dongpo pork', '', 'Culinary Class Wars (Black Spoon — Cho Kwangho)', 'Songpa.', 37.5145, 127.1058),
  food('Neo', '', 'Sindang / Jamsil', 'Japanese, buckwheat gimbap', '', 'Culinary Class Wars (White Spoon — Choi Kangrok)', 'Songpa.', 37.5145, 127.1058),

  // Elsewhere in Seoul
  food('Fabri Kitchen', '', 'Elsewhere in Seoul', 'Italian seafood', '', 'Culinary Class Wars (White Spoon — Fabrizio Ferrari)', 'PPP pasta; Yongsan-gu.', 37.5326, 126.9905),
  food('Touch the Sky', '', 'Elsewhere in Seoul', 'French', '', 'Culinary Class Wars (White Spoon — Cho Eunju)', 'Seafood course; Yeongdeungpo.', 37.5219, 126.9026),
  food('Edamame Namyoung', '', 'Elsewhere in Seoul', 'Chinese-Japanese', '', 'Culinary Class Wars (Black Spoon — Jacob Hyun)', 'Spicy yuringi; Yongsan.', 37.5326, 126.9705),
  food('Buto Hannam', '', 'Elsewhere in Seoul', 'Fusion, vegetarian', '', 'Culinary Class Wars (Black Spoon — Lim Heewon)', 'Yongsan/Hannam.', 37.5347, 127.0007),
  food('Deepin Oksu / Deepin Sindang', '', 'Elsewhere in Seoul', 'Bistro/Italian', '', 'Culinary Class Wars (Black Spoon — Yoon Namno)', 'Chitarra mussel pasta; Seongdong/Jung.', 37.5447, 127.0165),

  // Fine dining / special occasion
  food('Mosu', '', 'Fine dining', 'Haute cuisine', 'Dinner ₩300k+', 'Michelin 3★, Asia\'s 50 Best #41', 'Book 3-4 wks out.', 37.5347, 127.0007),
  food('Onjium', '', 'Fine dining', 'Research-based historical Korean cuisine', '', 'Michelin 2★, Asia\'s 50 Best #14', '', 37.585, 126.988),
  food('La Yeon', '', 'Fine dining', 'Kaiseki-style', 'Dinner ₩260k', 'Michelin 3★ (Shilla Hotel)', 'Book 4 wks out.', 37.5575, 127.0055),
  food('7th Door', '', 'Fine dining', 'Fermentation-focused', 'Lunch ₩68k', 'Michelin ★, Asia\'s 50 Best #49', '', 37.5245, 127.0359),

  // New Michelin Bib Gourmand 2026 (outside Seoul core)
  food('3rd Samgyetang', '', 'Bib Gourmand 2026', 'Ginseng chicken soup', '', 'Michelin Bib Gourmand 2026', 'Since 1973; 40+ ingredient broth. Seocho-gu.', 37.4837, 127.0324),
  food('Sobakeeri Suzu', '', 'Bib Gourmand 2026', 'Korean buckwheat soba', '', 'Michelin Bib Gourmand 2026', 'Japan-trained chef.', 37.5665, 126.978, { confidence: 'unverified', flagNote: 'Location within Seoul not specified in source.' }),
  food('Andeok', '', 'Bib Gourmand 2026', 'Beef naengguksu, mandutguk', '', 'Michelin Bib Gourmand 2026', 'Jongno-gu.', 37.573, 126.985),
  food('Oilje', '', 'Bib Gourmand 2026', 'Perilla seed miyeokguk, cast-iron pot rice', '', 'Michelin Bib Gourmand 2026', 'Yongsan-gu.', 37.5326, 126.9905),
  food('Moemiljip / Songheonjip / Pyeongyangjip', '', 'Bib Gourmand 2026', 'Buckwheat noodles / tteokgalbi / N. Korean mandu', '', 'Michelin Bib Gourmand 2026', 'Busan — good picks if you\'re there.', 35.1156, 129.0403),

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
// 4. Additions from the 2026-08-16 "Korea 2026" PDF — unique items only,
//    duplicates of anything already in the arrays above were skipped.
//    Two items carry no address at all in the source (Shiba Inu Cafe, Nyu Nyu),
//    plus a mentioned-but-unscheduled clinic (Yonsei Pain Clinic) — all three
//    are flagged `confidence: 'unverified'` and have no lat/lng, so they show
//    up in Wishlist but not in the Nearby feed until an address is added.
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
  wish('Shiba Inu Cafe', 'cafe', null, null, {
    notes: 'Shiba Inu dog café.',
    confidence: 'unverified',
    flagNote: 'No address was given in the source — add a location before this will show up in Nearby.',
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
  wish('Yonsei Pain Clinic', 'wellness', null, null, {
    notes: 'Clinic mentioned without a confirmed date or address.',
    confidence: 'unverified',
    flagNote: 'No address or appointment date given in the source — confirm both before scheduling.',
  }),
  wish('Verish (Seongsu flagship)', 'shopping', 37.5443, 127.057, {
    neighborhood: 'Seongsu-dong',
    notes: 'Undergarments flagship store.',
    hours: '11 AM–8 PM',
    travelFromGangnam: '36 Yeonmujang-gil (310-63 Seongsu-dong 2-ga), Seongdong-gu',
  }),
  wish('Nyu Nyu', 'shopping', null, null, {
    notes: 'Clothing shop mentioned without further detail.',
    confidence: 'unverified',
    flagNote: 'No address provided in the source.',
  }),
  wish('Ssil', 'shopping', 37.5245, 127.0359, {
    neighborhood: 'Gangnam-gu',
    notes: 'Jewelry. Closed Sun & Mon.',
    hours: '12–8 PM',
    travelFromGangnam: '3rd Floor, 71 Apgujeong-ro 46-gil, Gangnam-gu',
  }),
  wish('Numbering', 'shopping', 37.5248, 127.0362, {
    neighborhood: 'Gangnam-gu',
    notes: 'Jewelry.',
    hours: '11 AM–8 PM',
    travelFromGangnam: '38 Apgujeong-ro 48-gil, Gangnam-gu',
  }),
  wish('Jongno 3-ga Gold Street', 'shopping', 37.5703, 126.9919, {
    neighborhood: 'Jongno-gu',
    notes: 'Gold/jewelry shopping street.',
    hours: '10 AM–8 PM',
    travelFromGangnam: 'Near Exit 1, Jongno 3-ga Station (Lines 1, 3, 5)',
  }),
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

// Run once (safe to re-run — same idempotent slug-based IDs) to add just the new
// 2026-08-16 PDF items without touching anything already seeded via seedAll().
export async function seedAdditions() {
  await seedBatch([
    ...ITINERARY_ADDITIONS.map((item) => ({ col: 'itineraryItems', idSeed: `${item.title}-${item.date}`, data: item })),
    ...WISHLIST_ADDITIONS.map((item) => ({ col: 'wishlistItems', idSeed: item.title, data: { scheduled: false, ...item } })),
  ]);

  console.info(
    `Seeded ${ITINERARY_ADDITIONS.length} new itinerary items and ${WISHLIST_ADDITIONS.length} new wishlist items (2026-08-16 PDF batch).`
  );
}
