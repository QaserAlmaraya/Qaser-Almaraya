// Flight fares shown in the "fares from your city" board (components/home/FareBoard.jsx).
//
// Source: the customer-care flights sheet «اكسل طيران خدمة العملاء», read on
// FARES_UPDATED. Iraqi Airways fares are fixed; every other airline's fare is
// a "starts from" price that moves with the date and seat availability, so
// each row keeps the day it was last checked.
//
// Amounts are stored exactly as the sheet gives them (IQD or USD). The site
// never shows USD: fareIqd() converts with the dashboard rate and rounds up
// to the next 1,000 dinars.

export const FARES_UPDATED = '2026-11-15';

export const ORIGINS = [
  { code: 'BGW', ar: 'بغداد', en: 'Baghdad', airportAr: 'مطار بغداد الدولي', airportEn: 'Baghdad International Airport' },
  { code: 'EBL', ar: 'أربيل', en: 'Erbil', airportAr: 'مطار أربيل الدولي', airportEn: 'Erbil International Airport' },
  { code: 'BSR', ar: 'البصرة', en: 'Basra', airportAr: 'مطار البصرة الدولي', airportEn: 'Basra International Airport' },
  { code: 'NJF', ar: 'النجف', en: 'Najaf', airportAr: 'مطار النجف الدولي', airportEn: 'Najaf International Airport' },
  { code: 'KIK', ar: 'كركوك', en: 'Kirkuk', airportAr: 'مطار كركوك الدولي', airportEn: 'Kirkuk International Airport' },
];

// code = IATA designator, shown on the chip when the airline has no logo file.
// logo = basename in /assets/airlines-color/. shortAr = the name
// people say, used where space is tight. fixed = published fare that does
// not move (Iraqi Airways).
export const AIRLINES = {
  IA: { code: 'IA', logo: 'iraqi-airways', shortAr: 'العراقية', ar: 'الخطوط الجوية العراقية', en: 'Iraqi Airways', fixed: true },
  IF: { code: 'IF', logo: 'flybaghdad', shortAr: 'فلاي بغداد', ar: 'فلاي بغداد', en: 'Fly Baghdad' },
  TK: { code: 'TK', logo: 'turkish', shortAr: 'التركية', ar: 'الخطوط الجوية التركية', en: 'Turkish Airlines' },
  VF: { code: 'VF', logo: 'ajet', shortAr: 'أجيت', ar: 'أجيت', en: 'AJet' },
  PC: { code: 'PC', logo: 'pegasus', shortAr: 'بيغاسوس', ar: 'بيغاسوس', en: 'Pegasus' },
  FE: { code: '', shortAr: 'فلاي أربيل', ar: 'فلاي أربيل', en: 'Fly Erbil' },
  MS: { code: 'MS', logo: 'egyptair', shortAr: 'مصر للطيران', ar: 'مصر للطيران', en: 'EgyptAir' },
  NP: { code: 'NP', logo: 'nileair', shortAr: 'النيل للطيران', ar: 'النيل للطيران', en: 'Nile Air' },
  RJ: { code: 'RJ', logo: 'royal-jordanian', shortAr: 'الملكية الأردنية', ar: 'الملكية الأردنية', en: 'Royal Jordanian' },
  SN: { code: '6Q', logo: 'chamwings', shortAr: 'أجنحة الشام', ar: 'أجنحة الشام', en: 'Cham Wings' },
  UD: { code: 'UD', shortAr: 'أور للطيران', ar: 'أور للطيران', en: 'Ur Airlines' },
  FZ: { code: 'FZ', logo: 'flydubai', shortAr: 'فلاي دبي', ar: 'فلاي دبي', en: 'flydubai' },
  EK: { code: 'EK', logo: 'emirates', shortAr: 'الإماراتية', ar: 'طيران الإمارات', en: 'Emirates' },
  G9: { code: 'G9', logo: 'airarabia', shortAr: 'العربية للطيران', ar: 'العربية للطيران', en: 'Air Arabia' },
  ME: { code: 'ME', logo: 'mea', shortAr: 'الشرق الأوسط', ar: 'طيران الشرق الأوسط', en: 'Middle East Airlines' },
  OV: { code: 'OV', logo: 'salamair', shortAr: 'طيران السلام', ar: 'طيران السلام', en: 'SalamAir' },
  QR: { code: 'QR', logo: 'qatar', shortAr: 'القطرية', ar: 'الخطوط الجوية القطرية', en: 'Qatar Airways' },
  XY: { code: 'XY', logo: 'flynas', shortAr: 'طيران ناس', ar: 'طيران ناس', en: 'flynas' },
  GF: { code: 'GF', logo: 'gulfair', shortAr: 'طيران الخليج', ar: 'طيران الخليج', en: 'Gulf Air' },
};

// Airports. Two airports of one city share `city`, so the board lists the
// city once and the detail names the airport.
export const PLACES = {
  IST: { city: 'ist', ar: 'إسطنبول', en: 'Istanbul', countryAr: 'تركيا', countryEn: 'Türkiye', airportAr: 'مطار إسطنبول', airportEn: 'Istanbul Airport' },
  SAW: { city: 'ist', ar: 'إسطنبول', en: 'Istanbul', countryAr: 'تركيا', countryEn: 'Türkiye', airportAr: 'مطار صبيحة', airportEn: 'Sabiha Gökçen' },
  ESB: { city: 'esb', ar: 'أنقرة', en: 'Ankara', countryAr: 'تركيا', countryEn: 'Türkiye' },
  SZF: { city: 'szf', ar: 'سامسون', en: 'Samsun', countryAr: 'تركيا', countryEn: 'Türkiye' },
  AYT: { city: 'ayt', ar: 'أنطاليا', en: 'Antalya', countryAr: 'تركيا', countryEn: 'Türkiye' },
  CAI: { city: 'cai', ar: 'القاهرة', en: 'Cairo', countryAr: 'مصر', countryEn: 'Egypt' },
  AMM: { city: 'amm', ar: 'عمّان', en: 'Amman', countryAr: 'الأردن', countryEn: 'Jordan' },
  VKO: { city: 'mow', ar: 'موسكو', en: 'Moscow', countryAr: 'روسيا', countryEn: 'Russia' },
  PEK: { city: 'pek', ar: 'بكين', en: 'Beijing', countryAr: 'الصين', countryEn: 'China' },
  CAN: { city: 'can', ar: 'كوانزو', en: 'Guangzhou', countryAr: 'الصين', countryEn: 'China' },
  DEL: { city: 'del', ar: 'دلهي', en: 'Delhi', countryAr: 'الهند', countryEn: 'India' },
  KHI: { city: 'khi', ar: 'كراتشي', en: 'Karachi', countryAr: 'باكستان', countryEn: 'Pakistan' },
  ISB: { city: 'isb', ar: 'إسلام آباد', en: 'Islamabad', countryAr: 'باكستان', countryEn: 'Pakistan' },
  KUL: { city: 'kul', ar: 'كوالالمبور', en: 'Kuala Lumpur', countryAr: 'ماليزيا', countryEn: 'Malaysia' },
  IKA: { city: 'thr', ar: 'طهران', en: 'Tehran', countryAr: 'إيران', countryEn: 'Iran' },
  MHD: { city: 'mhd', ar: 'مشهد', en: 'Mashhad', countryAr: 'إيران', countryEn: 'Iran' },
  DAM: { city: 'dam', ar: 'دمشق', en: 'Damascus', countryAr: 'سوريا', countryEn: 'Syria' },
  DXB: { city: 'dxb', ar: 'دبي', en: 'Dubai', countryAr: 'الإمارات', countryEn: 'UAE' },
  SHJ: { city: 'shj', ar: 'الشارقة', en: 'Sharjah', countryAr: 'الإمارات', countryEn: 'UAE' },
  AUH: { city: 'auh', ar: 'أبو ظبي', en: 'Abu Dhabi', countryAr: 'الإمارات', countryEn: 'UAE' },
  BEY: { city: 'bey', ar: 'بيروت', en: 'Beirut', countryAr: 'لبنان', countryEn: 'Lebanon' },
  MCT: { city: 'mct', ar: 'مسقط', en: 'Muscat', countryAr: 'عُمان', countryEn: 'Oman' },
  DOH: { city: 'doh', ar: 'الدوحة', en: 'Doha', countryAr: 'قطر', countryEn: 'Qatar' },
  JED: { city: 'jed', ar: 'جدة', en: 'Jeddah', countryAr: 'السعودية', countryEn: 'Saudi Arabia' },
  BAH: { city: 'bah', ar: 'البحرين', en: 'Bahrain', countryAr: 'البحرين', countryEn: 'Bahrain' },
  DUS: { city: 'dus', ar: 'دوسلدورف', en: 'Düsseldorf', countryAr: 'ألمانيا', countryEn: 'Germany' },
  BER: { city: 'ber', ar: 'برلين', en: 'Berlin', countryAr: 'ألمانيا', countryEn: 'Germany' },
  MUC: { city: 'muc', ar: 'ميونخ', en: 'Munich', countryAr: 'ألمانيا', countryEn: 'Germany' },
  FRA: { city: 'fra', ar: 'فرانكفورت', en: 'Frankfurt', countryAr: 'ألمانيا', countryEn: 'Germany' },
  CPH: { city: 'cph', ar: 'كوبنهاغن', en: 'Copenhagen', countryAr: 'الدنمارك', countryEn: 'Denmark' },
  BGW: { city: 'bgw', ar: 'بغداد', en: 'Baghdad', countryAr: 'رحلة داخلية', countryEn: 'Domestic' },
  EBL: { city: 'ebl', ar: 'أربيل', en: 'Erbil', countryAr: 'رحلة داخلية', countryEn: 'Domestic' },
  BSR: { city: 'bsr', ar: 'البصرة', en: 'Basra', countryAr: 'رحلة داخلية', countryEn: 'Domestic' },
  ISU: { city: 'isu', ar: 'السليمانية', en: 'Sulaymaniyah', countryAr: 'رحلة داخلية', countryEn: 'Domestic' },
};

const DAILY = ['يومياً', 'Daily'];
const D = (ar, en) => [ar, en];

// [from, to, airline, one-way, return leg, round trip, currency, departure time(s), [days ar, days en]]
// 0 = the sheet has no figure for that column.
const ROWS = [
  // ---- Istanbul
  ['BGW', 'IST', 'IA', 349000, 512000, 638000, 'IQD', '07:00', DAILY],
  ['BGW', 'SAW', 'IA', 329000, 473000, 597000, 'IQD', '11:00', D('الأحد، الاثنين، الأربعاء، الخميس، السبت', 'Sun, Mon, Wed, Thu, Sat')],
  ['BGW', 'IST', 'IF', 140, 140, 250, 'USD', '17:25', D('الأحد، الخميس', 'Sun, Thu')],
  ['BGW', 'IST', 'TK', 199, 222, 342, 'USD', '02:00 · 05:25 · 10:25', DAILY],
  ['BGW', 'SAW', 'VF', 142, 129, 329, 'USD', '10:55', DAILY],
  ['BGW', 'SAW', 'PC', 105, 105, 195, 'USD', '09:50', DAILY],
  ['EBL', 'SAW', 'PC', 120, 100, 220, 'USD', '08:35 · 11:15', DAILY],
  ['EBL', 'IST', 'IA', 331000, 499000, 492000, 'IQD', '10:00', D('الأحد، الاثنين، الجمعة', 'Sun, Mon, Fri')],
  ['EBL', 'SAW', 'VF', 124, 188, 302, 'USD', '02:20 · 04:20', DAILY],
  ['EBL', 'IST', 'TK', 199, 202, 333, 'USD', '05:40 · 09:25', DAILY],
  ['EBL', 'IST', 'FE', 115, 130, 270, 'USD', '14:30', D('الاثنين، الثلاثاء، السبت', 'Mon, Tue, Sat')],
  ['BSR', 'IST', 'IA', 414000, 610000, 528000, 'IQD', '14:45', D('الاثنين، الأربعاء، الخميس، الجمعة', 'Mon, Wed, Thu, Fri')],
  ['BSR', 'IST', 'TK', 230, 242, 372, 'USD', '07:45', D('يومياً عدا الاثنين', 'Daily except Mon')],
  ['KIK', 'IST', 'IA', 382000, 567000, 494000, 'IQD', '09:00 · 10:00', D('الأحد، الثلاثاء، الخميس، الجمعة', 'Sun, Tue, Thu, Fri')],
  ['KIK', 'IST', 'TK', 195, 200, 290.2, 'USD', '11:15', D('الأحد، الأربعاء', 'Sun, Wed')],
  // ---- Türkiye
  ['BGW', 'ESB', 'IA', 327000, 475000, 539000, 'IQD', '06:00', D('يومياً عدا الخميس والسبت', 'Daily except Thu and Sat')],
  ['BGW', 'SZF', 'IA', 321000, 455000, 492000, 'IQD', '10:10', D('الأربعاء، الجمعة', 'Wed, Fri')],
  ['BGW', 'AYT', 'IA', 349000, 504000, 460000, 'IQD', '18:00', D('يومياً عدا الاثنين والسبت', 'Daily except Mon and Sat')],
  // ---- Cairo
  ['BGW', 'CAI', 'IA', 367000, 553000, 602000, 'IQD', '10:00', DAILY],
  ['BGW', 'CAI', 'MS', 185, 340, 480, 'USD', '07:00', DAILY],
  ['BGW', 'CAI', 'NP', 176, 330, 525, 'USD', '22:30', D('الثلاثاء', 'Tue')],
  ['EBL', 'CAI', 'MS', 199.49, 365.79, 415, 'USD', '04:00', D('يومياً عدا الخميس والجمعة', 'Daily except Thu and Fri')],
  // ---- Amman
  ['BGW', 'AMM', 'IA', 320000, 549000, 596000, 'IQD', '17:00', DAILY],
  ['EBL', 'AMM', 'IA', 312000, 549000, 475000, 'IQD', '17:00', D('الاثنين، الجمعة', 'Mon, Fri')],
  ['BSR', 'AMM', 'IA', 210000, 374000, 592000, 'IQD', '08:00', D('الخميس، السبت', 'Thu, Sat')],
  ['BGW', 'AMM', 'RJ', 150, 170, 325, 'USD', '06:20 · 13:10 · 21:00', D('ثلاث رحلات يومياً', 'Three flights a day')],
  ['EBL', 'AMM', 'RJ', 303, 360, 462, 'USD', '04:20 · 21:00', DAILY],
  ['BSR', 'AMM', 'RJ', 190, 230, 372, 'USD', '05:35', D('الاثنين، الجمعة', 'Mon, Fri')],
  // ---- Other destinations
  ['BGW', 'VKO', 'IA', 528000, 745000, 954000, 'IQD', '07:00', D('الثلاثاء، السبت', 'Tue, Sat')],
  ['BGW', 'PEK', 'IA', 732000, 1070000, 1308000, 'IQD', '12:30', D('السبت', 'Sat')],
  ['BGW', 'CAN', 'IA', 1488000, 2204000, 1235000, 'IQD', '13:00', D('الأحد، الأربعاء', 'Sun, Wed')],
  ['BGW', 'DEL', 'IA', 647000, 992000, 860000, 'IQD', '08:00', D('الأحد، الاثنين، الثلاثاء، الخميس، الجمعة', 'Sun, Mon, Tue, Thu, Fri')],
  ['BGW', 'KHI', 'IA', 367000, 597000, 477000, 'IQD', '23:10', D('الأحد', 'Sun')],
  ['BGW', 'KUL', 'IA', 1002000, 1489000, 1381000, 'IQD', '21:00', D('الخميس', 'Thu')],
  ['BGW', 'ISB', 'IA', 266640, 438635, 538955, 'IQD', '07:00', D('الأربعاء', 'Wed')],
  // ---- Iran
  ['BGW', 'IKA', 'IA', 161040, 204458, 273098, 'IQD', '17:00', DAILY],
  ['BGW', 'MHD', 'IA', 225720, 302138, 389258, 'IQD', '07:30', DAILY],
  // ---- Syria
  ['BGW', 'DAM', 'SN', 275, 225, 360, 'USD', '', D('الاثنين، الخميس', 'Mon, Thu')],
  ['BGW', 'DAM', 'UD', 146000, 161000, 438000, 'IQD', '', D('الثلاثاء، الجمعة', 'Tue, Fri')],
  ['EBL', 'DAM', 'SN', 300, 300, 485, 'USD', '', D('الأحد، الاثنين، الخميس', 'Sun, Mon, Thu')],
  ['NJF', 'DAM', 'SN', 210, 224.39, 321.39, 'USD', '', D('يومياً عدا الثلاثاء', 'Daily except Tue')],
  // ---- UAE
  ['BGW', 'DXB', 'IA', 373000, 563000, 700000, 'IQD', '10:05', DAILY],
  ['BGW', 'DXB', 'FZ', 310, 635, 477, 'USD', '18:55', DAILY],
  ['BGW', 'DXB', 'EK', 437.4, 665.1, 642.5, 'USD', '', DAILY],
  ['BGW', 'SHJ', 'G9', 206, 247, 291.87, 'USD', '', D('ثلاث رحلات يومياً', 'Three flights a day')],
  ['BGW', 'AUH', 'G9', 141.97, 142.08, 246.05, 'USD', '11:10', D('الثلاثاء، الخميس', 'Tue, Thu')],
  ['EBL', 'DXB', 'IA', 320000, 489000, 581000, 'IQD', '08:00 · 09:35', D('الثلاثاء، الخميس، السبت', 'Tue, Thu, Sat')],
  ['BSR', 'DXB', 'IA', 349000, 526000, 375000, 'IQD', '08:35', D('الأحد، الاثنين، الأربعاء، الجمعة', 'Sun, Mon, Wed, Fri')],
  ['BSR', 'DXB', 'EK', 655, 970, 925.5, 'USD', '10:30', D('يومياً عدا الجمعة', 'Daily except Fri')],
  ['BGW', 'SHJ', 'IA', 266000, 401000, 442000, 'IQD', '14:30', D('الأربعاء، الخميس، الجمعة، السبت', 'Wed, Thu, Fri, Sat')],
  // ---- Beirut
  ['BGW', 'BEY', 'IA', 252000, 382000, 419000, 'IQD', '10:00', DAILY],
  ['BGW', 'BEY', 'ME', 185, 156, 300, 'USD', '14:25', DAILY],
  ['EBL', 'BEY', 'IA', 215000, 332000, 340000, 'IQD', '08:00 · 13:30', D('الأحد، الأربعاء', 'Sun, Wed')],
  ['EBL', 'BEY', 'ME', 269.78, 181, 505, 'USD', '15:15', D('الأحد، الثلاثاء، الخميس، السبت', 'Sun, Tue, Thu, Sat')],
  ['NJF', 'BEY', 'IA', 219000, 382000, 578000, 'IQD', '21:15', D('الأحد، الثلاثاء، الخميس، السبت', 'Sun, Tue, Thu, Sat')],
  ['NJF', 'BEY', 'ME', 165, 191, 318, 'USD', '', D('الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس', 'Sun to Thu')],
  // ---- Muscat
  ['BGW', 'MCT', 'IA', 350000, 527000, 386000, 'IQD', '06:35', D('الثلاثاء', 'Tue')],
  ['BGW', 'MCT', 'OV', 79, 78, 0, 'USD', '12:55 · 16:55 · 17:15 · 18:20', D('يومياً عدا الجمعة', 'Daily except Fri')],
  // ---- Gulf
  ['BGW', 'DOH', 'QR', 558, 644, 760, 'USD', '11:45 · 21:45', D('رحلتان يومياً', 'Two flights a day')],
  ['BGW', 'JED', 'XY', 172, 177, 410, 'USD', '09:35', DAILY],
  ['BGW', 'BAH', 'GF', 459.51, 309.54, 728.13, 'USD', '12:55', D('الثلاثاء، الخميس، الجمعة، السبت', 'Tue, Thu, Fri, Sat')],
  ['EBL', 'DOH', 'QR', 596, 530, 788, 'USD', '04:20 · 22:00', DAILY],
  ['BSR', 'DOH', 'QR', 587, 645, 759, 'USD', '11:20', DAILY],
  // ---- Domestic (both directions of the same Iraqi Airways fare)
  ['BGW', 'EBL', 'IA', 107000, 106000, 193000, 'IQD', '', DAILY],
  ['EBL', 'BGW', 'IA', 106000, 107000, 193000, 'IQD', '', DAILY],
  ['BGW', 'ISU', 'IA', 107000, 102000, 189000, 'IQD', '', DAILY],
  ['BGW', 'BSR', 'IA', 84000, 84000, 151000, 'IQD', '', DAILY],
  ['BSR', 'BGW', 'IA', 84000, 84000, 151000, 'IQD', '', DAILY],
  ['EBL', 'BSR', 'IA', 162000, 161000, 288000, 'IQD', '', DAILY],
  ['BSR', 'EBL', 'IA', 161000, 162000, 288000, 'IQD', '', DAILY],
  ['BSR', 'ISU', 'IA', 162000, 156000, 286000, 'IQD', '14:00 · 20:15', D('الثلاثاء، الخميس', 'Tue, Thu')],
  // ---- Europe
  ['BGW', 'DUS', 'IA', 373560, 606747, 738747, 'IQD', '08:05', D('الثلاثاء', 'Tue')],
  ['BGW', 'BER', 'IA', 370311, 583870, 715262, 'IQD', '08:35', D('الجمعة', 'Fri')],
  ['BGW', 'MUC', 'IA', 363000, 597963, 726003, 'IQD', '08:45', D('السبت', 'Sat')],
  ['BGW', 'CPH', 'IA', 386760, 579611, 715571, 'IQD', '07:00', D('الأحد', 'Sun')],
  ['BGW', 'FRA', 'IA', 366960, 624315, 753675, 'IQD', '08:15', D('الاثنين', 'Mon')],
  ['EBL', 'BER', 'IA', 366275, 584237, 711592, 'IQD', '10:25', D('الجمعة', 'Fri')],
  ['EBL', 'CPH', 'IA', 362920, 549467, 676107, 'IQD', '08:35', D('الأربعاء', 'Wed')],
  ['EBL', 'FRA', 'IA', 362920, 624905, 750225, 'IQD', '10:05', D('الاثنين', 'Mon')],
  ['EBL', 'MUC', 'IA', 358960, 598448, 722448, 'IQD', '10:35', D('السبت', 'Sat')],
  ['EBL', 'DUS', 'IA', 369520, 607195, 735155, 'IQD', '09:55', D('الثلاثاء', 'Tue')],
];

export const FARES = ROWS.map(([from, to, airline, oneWay, back, round, currency, time, days]) => ({
  from, to, airline, oneWay, back, round, currency, time, daysAr: days[0], daysEn: days[1], updated: FARES_UPDATED,
}));

// What the customer sees: always dinars, rounded up to the next thousand.
export function fareIqd(amount, currency, rate) {
  const n = Number(amount) || 0;
  if (n <= 0) return 0;
  const iqd = currency === 'USD' ? n * (Number(rate) || 0) : n;
  return Math.ceil(iqd / 1000 - 1e-9) * 1000;
}

// Destinations served from one origin for the chosen trip type ('one' or
// 'round'), cheapest first. Each destination carries its airline offers,
// also cheapest first.
export function destinationsFrom(originCode, trip, rate) {
  const byCity = new Map();
  for (const f of FARES) {
    if (f.from !== originCode) continue;
    const price = fareIqd(trip === 'round' ? f.round : f.oneWay, f.currency, rate);
    if (!price) continue;
    const place = PLACES[f.to];
    if (!place) continue;
    if (!byCity.has(place.city)) byCity.set(place.city, { key: place.city, place, offers: [] });
    byCity.get(place.city).offers.push({ ...f, price, place, carrier: AIRLINES[f.airline] });
  }
  const list = [...byCity.values()].map((d) => {
    d.offers.sort((a, b) => a.price - b.price);
    return { ...d, from: d.offers[0].price, best: d.offers[0] };
  });
  list.sort((a, b) => a.from - b.from || a.place.ar.localeCompare(b.place.ar, 'ar'));
  return list;
}

export function destinationCount(originCode) {
  const s = new Set();
  for (const f of FARES) if (f.from === originCode && PLACES[f.to]) s.add(PLACES[f.to].city);
  return s.size;
}
