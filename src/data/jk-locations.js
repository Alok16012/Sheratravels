// J&K + Ladakh Location Hierarchy
// State → District → Block/Tehsil → Gram Panchayat → Village

export const STATES = ['Jammu & Kashmir', 'Ladakh', 'Other']

export const DISTRICTS = {
  'Jammu & Kashmir': [
    'Srinagar', 'Anantnag', 'Baramulla', 'Budgam', 'Bandipora',
    'Ganderbal', 'Kulgam', 'Kupwara', 'Pulwama', 'Shopian',
    'Jammu', 'Kathua', 'Doda', 'Kishtwar', 'Poonch',
    'Rajouri', 'Ramban', 'Reasi', 'Samba', 'Udhampur',
  ],
  'Ladakh': ['Leh', 'Kargil'],
  'Other': ['Other'],
}

export const BLOCKS = {
  // ── Kashmir Division ──────────────────────────────────────
  'Srinagar': [
    'Srinagar City', 'Harwan', 'Shuhama', 'Khanyar', 'Batmaloo',
    'Panta Chowk', 'Eidgah', 'Zakura', 'Nishat', 'Bemina',
  ],
  'Anantnag': [
    'Pahalgam', 'Anantnag', 'Kokernag', 'Dooru', 'Shangus',
    'Qazigund', 'Verinag', 'Bijbehara', 'Dachnipora', 'Srigufwara',
  ],
  'Baramulla': [
    'Baramulla', 'Sopore', 'Tangmarg', 'Pattan', 'Kunzer',
    'Boniyar', 'Uri', 'Rafiabad', 'Kreeri', 'Rohama',
  ],
  'Budgam': [
    'Budgam', 'Charar-i-Sharif', 'Chadoora', 'Khansahib',
    'Beerwah', 'Narbal', 'Soibugh', 'Nagam',
  ],
  'Bandipora': [
    'Bandipora', 'Gurez', 'Hajin', 'Sumbal', 'Ajas',
    'Aloosa', 'Tulail',
  ],
  'Ganderbal': [
    'Ganderbal', 'Kangan', 'Lar', 'Wakura', 'Gund',
    'Tullamulla', 'Nyapora',
  ],
  'Kulgam': [
    'Kulgam', 'Devsar', 'Frisal', 'D.H.Pora', 'Pahloo',
    'Yaripora', 'Noorabad',
  ],
  'Kupwara': [
    'Kupwara', 'Lolab', 'Handwara', 'Keran', 'Karnah',
    'Sogam', 'Langate', 'Drugmulla',
  ],
  'Pulwama': [
    'Pulwama', 'Awantipora', 'Pampore', 'Tral', 'Aripal',
    'Kakapora', 'Rajpora',
  ],
  'Shopian': [
    'Shopian', 'Kellar', 'Zainpora', 'Herman', 'Barbough',
  ],
  // ── Jammu Division ────────────────────────────────────────
  'Jammu': [
    'Jammu', 'Akhnoor', 'Nagrota', 'R.S.Pura', 'Bishnah',
    'Suchetgarh', 'Marh', 'Khour',
  ],
  'Kathua': [
    'Kathua', 'Hiranagar', 'Billawar', 'Bani', 'Basholi',
    'Dinga Amb', 'Mahanpur', 'Ramkot',
  ],
  'Doda': [
    'Doda', 'Bhaderwah', 'Thathri', 'Gandoh', 'Chiralla',
    'Bhagwah', 'Mohalla',
  ],
  'Kishtwar': [
    'Kishtwar', 'Padder', 'Nagseni', 'Dachan', 'Marwah',
    'Chatroo', 'Mughal Maidan',
  ],
  'Poonch': [
    'Poonch', 'Surankote', 'Mandi', 'Haveli', 'Mendhar',
    'Marhote', 'Balakote',
  ],
  'Rajouri': [
    'Rajouri', 'Nowshera', 'Thanamandi', 'Budhal', 'Kalakote',
    'Darhal', 'Manjakote',
  ],
  'Ramban': [
    'Ramban', 'Banihal', 'Batote', 'Gool', 'Maitra',
    'Sangaldan', 'Ukhral',
  ],
  'Reasi': [
    'Reasi', 'Katra', 'Mahore', 'Arnas', 'Chassana',
    'Pouni', 'Shankra',
  ],
  'Samba': [
    'Samba', 'Vijaypur', 'Ramgarh', 'Bari Brahmana', 'Ghagwal',
  ],
  'Udhampur': [
    'Udhampur', 'Ramnagar', 'Chenani', 'Majalta', 'Moungri',
    'Dudu', 'Latti',
  ],
  // ── Ladakh ───────────────────────────────────────────────
  'Leh': [
    'Leh City', 'Nubra', 'Diskit', 'Khaltsi', 'Nyoma',
    'Durbuk', 'Chushul', 'Tangtse', 'Sham', 'Kharu',
  ],
  'Kargil': [
    'Kargil', 'Zanskar', 'Drass', 'Suru Valley', 'Sankoo',
    'Shakar Chiktan', 'Taisuru', 'Panikhar',
  ],
  'Other': ['Other'],
}

export const GRAM_PANCHAYATS = {
  // ── Srinagar ──
  'Srinagar City':  ['Dal Lake GP', 'Hazratbal GP', 'Downtown GP', 'Lal Chowk GP', 'Rajbagh GP', 'Jawahar Nagar GP'],
  'Harwan':         ['Harwan GP', 'Dachigam GP', 'Brein GP', 'Shalimar GP'],
  'Nishat':         ['Nishat GP', 'Cheshmashahi GP', 'Pari Mahal GP'],
  'Zakura':         ['Zakura GP', 'Nagin GP', 'Hazratbal Shore GP'],
  'Shuhama':        ['Shuhama GP', 'Chattabal GP', 'Soura GP'],
  // ── Anantnag ──
  'Pahalgam':       ['Pahalgam GP', 'Aru GP', 'Betaab Valley GP', 'Chandanwari GP', 'Baisaran GP', 'Lidderwat GP'],
  'Kokernag':       ['Kokernag GP', 'Verinag GP', 'Daksum GP'],
  'Anantnag':       ['Anantnag Town GP', 'Martand GP', 'Achabal GP'],
  'Bijbehara':      ['Bijbehara GP', 'Nandimarg GP'],
  // ── Baramulla ──
  'Tangmarg':       ['Tangmarg GP', 'Gulmarg GP', 'Khilanmarg GP', 'Affarwat GP', 'Drung GP'],
  'Baramulla':      ['Baramulla Town GP', 'Watlab GP', 'Sopore Road GP'],
  'Uri':            ['Uri GP', 'Kamalkote GP', 'Boniyar GP'],
  'Sopore':         ['Sopore GP', 'Dangiwacha GP', 'Warpora GP'],
  // ── Budgam ──
  'Charar-i-Sharif':['Charar-i-Sharif GP', 'Watchi GP', 'Nandimarg Budgam GP'],
  'Chadoora':       ['Chadoora GP', 'Wathoora GP'],
  // ── Bandipora ──
  'Gurez':          ['Gurez GP', 'Dawar GP', 'Tulail GP', 'Kherbawani GP', 'Badugam GP'],
  'Bandipora':      ['Bandipora GP', 'Aloosa GP', 'Sumbal GP'],
  // ── Ganderbal ──
  'Kangan':         ['Kangan GP', 'Sonamarg GP', 'Baltal GP', 'Thajiwas GP'],
  'Ganderbal':      ['Ganderbal GP', 'Manigam GP', 'Wakura GP'],
  // ── Kulgam ──
  'Kulgam':         ['Kulgam GP', 'Frisal GP', 'Noorabad GP'],
  // ── Kupwara ──
  'Lolab':          ['Lolab GP', 'Sogam GP', 'Kupwara GP'],
  'Keran':          ['Keran GP', 'Bangus Valley GP', 'Karnah GP'],
  // ── Pulwama ──
  'Awantipora':     ['Awantipora GP', 'Pampore GP', 'Shalateng GP'],
  // ── Jammu / Reasi ──
  'Katra':          ['Katra GP', 'Banganga GP', 'Nau GP'],
  'Reasi':          ['Reasi GP', 'Salal GP', 'Mahore GP'],
  // ── Ramban ──
  'Banihal':        ['Banihal GP', 'Sangaldan GP', 'Nashri GP'],
  // ── Kishtwar ──
  'Kishtwar':       ['Kishtwar GP', 'Padder GP', 'Chatroo GP', 'Mughal Maidan GP'],
  // ── Ladakh ──
  'Leh City':       ['Leh GP', 'Chanspa GP', 'Skara GP', 'Changspa GP'],
  'Nubra':          ['Diskit GP', 'Hunder GP', 'Panamik GP', 'Sumur GP', 'Turtuk GP'],
  'Diskit':         ['Diskit GP', 'Hunder GP', 'Khalsar GP'],
  'Tangtse':        ['Pangong GP', 'Tangtse GP', 'Lukung GP', 'Spangmik GP'],
  'Durbuk':         ['Durbuk GP', 'Chushul GP', 'Rezang La GP'],
  'Nyoma':          ['Nyoma GP', 'Tsaga GP', 'Hanle GP', 'Tso Moriri GP'],
  'Sham':           ['Alchi GP', 'Lamayuru GP', 'Likir GP', 'Nimmu GP', 'Basgo GP'],
  'Zanskar':        ['Padum GP', 'Stongde GP', 'Zangla GP', 'Rangdum GP', 'Pensi La GP'],
  'Drass':          ['Drass GP', 'Dras GP', 'Minamarg GP', 'Kargil Gate GP'],
  'Kargil':         ['Kargil Town GP', 'Hunderman GP', 'Wakha GP'],
  'Suru Valley':    ['Panikhar GP', 'Sankoo GP', 'Parkachik GP'],
  'Other':          ['Other'],
}

export const VILLAGES = {
  // ── Srinagar ──
  'Dal Lake GP':         ['Dal Lake', 'Nagin Lake', 'Char Chinar', 'Nehru Park', 'Old Nehru Park', 'Khayam Chowk'],
  'Hazratbal GP':        ['Hazratbal Shrine', 'Hazratbal', 'Naseem Bagh', 'Botanical Garden'],
  'Downtown GP':         ['Lal Chowk', 'Nowhatta', 'Habba Kadal', 'Zaina Kadal', 'Shah Hamadan'],
  'Shalimar GP':         ['Shalimar Bagh', 'Nishat Bagh', 'Cheshmashahi'],
  'Harwan GP':           ['Harwan', 'Dachigam National Park', 'Brein'],
  // ── Pahalgam ──
  'Pahalgam GP':         ['Pahalgam Town', 'Lidder River', 'Golf Course', 'Pahalgam Market'],
  'Aru GP':              ['Aru Valley', 'Aru Village', 'Lidderwat', 'Sheshnag Lake'],
  'Betaab Valley GP':    ['Betaab Valley', 'Hajan', 'Satti'],
  'Chandanwari GP':      ['Chandanwari', 'Pissu Top', 'Sheshnag'],
  'Baisaran GP':         ['Baisaran (Mini Switzerland)', 'Tulian Lake Trail'],
  // ── Gulmarg ──
  'Gulmarg GP':          ['Gulmarg', 'Gondola Phase 1', 'Gondola Phase 2', 'Khilanmarg', 'St. Marys Church', 'Gulmarg Golf Course'],
  'Khilanmarg GP':       ['Khilanmarg', 'Alpather Lake', 'Ningle Nallah'],
  'Affarwat GP':         ['Affarwat Peak', 'Kongdori'],
  'Tangmarg GP':         ['Tangmarg', 'Drung Waterfall', 'Ferozpora Nallah'],
  // ── Sonamarg ──
  'Sonamarg GP':         ['Sonamarg', 'Thajiwas Glacier', 'Zero Point', 'Krishnasar Lake', 'Vishansar Lake'],
  'Baltal GP':           ['Baltal', 'Zoji La Pass', 'Amarnath Base Camp'],
  'Thajiwas GP':         ['Thajiwas Glacier', 'Sonamarg Meadows'],
  // ── Gurez ──
  'Gurez GP':            ['Gurez Valley', 'Dawar', 'Habba Khatoon Peak', 'Kishanganga River'],
  'Tulail GP':           ['Tulail', 'Sheikhpora', 'Kanzalwan'],
  // ── Keran / Lolab ──
  'Keran GP':            ['Keran', 'LoC View Point', 'Neelum River View', 'Apple Orchards Keran'],
  'Bangus Valley GP':    ['Bangus Valley', 'High Altitude Meadows Bangus'],
  'Lolab GP':            ['Lolab Valley', 'Kupwara Valley', 'Kalaroos Caves'],
  // ── Katra / Vaishno Devi ──
  'Katra GP':            ['Katra Town', 'Vaishno Devi Base Camp', 'Banganga', 'Darbar of Vaishno Devi', 'Bhairon Ghati'],
  // ── Banihal / Ramban ──
  'Banihal GP':          ['Banihal', 'Banihal Tunnel', 'Patnitop (nearby)', 'Sanasar'],
  'Nashri GP':           ['Nashri', 'Patnitop', 'Sanasar Lake'],
  // ── Kishtwar ──
  'Kishtwar GP':         ['Kishtwar Town', 'Kishtwar National Park', 'Sinthan Top', 'Nagin Lake Kishtwar'],
  'Mughal Maidan GP':    ['Mughal Maidan', 'Wadwan Valley', 'Margan Top'],
  // ── Leh / Ladakh ──
  'Leh GP':              ['Leh Palace', 'Leh Market', 'Leh Old Town', 'Sankar Gompa'],
  'Chanspa GP':          ['Chanspa', 'Shanti Stupa', 'Hall of Fame'],
  'Hunder GP':           ['Hunder Sand Dunes', 'Hunder Village', 'Nubra Valley'],
  'Diskit GP':           ['Diskit Monastery', 'Diskit Village', 'Giant Maitreya Buddha'],
  'Panamik GP':          ['Panamik Hot Springs', 'Panamik Village', 'Siachen Base (nearby)'],
  'Turtuk GP':           ['Turtuk Village', 'Turtuk Apricot Farms', 'Thang Village (Last Village)'],
  'Pangong GP':          ['Pangong Tso Lake', 'Spangmik', 'Lukung', 'Merak', '3 Idiots Point'],
  'Lukung GP':           ['Lukung', 'Pangong South Bank', 'Chushul'],
  'Chushul GP':          ['Chushul', 'Rezang La War Memorial', 'Moldo'],
  'Hanle GP':            ['Hanle', 'Indian Astronomical Observatory', 'Hanle Monastery'],
  'Tso Moriri GP':       ['Tso Moriri Lake', 'Korzok Monastery', 'Korzok Village'],
  'Alchi GP':            ['Alchi Monastery', 'Alchi Village', 'Saspol Caves'],
  'Lamayuru GP':         ['Lamayuru Monastery', 'Moonland Lamayuru', 'Yungdrung Gompa'],
  'Nimmu GP':            ['Nimmu Village', 'Nimmu Confluence', 'Zanskar Indus Confluence'],
  'Padum GP':            ['Padum', 'Zanskar Valley', 'Rangdum Monastery', 'Karsha Monastery'],
  'Zangla GP':           ['Zangla', 'Zanskar River', 'Chadar Trek Start'],
  'Drass GP':            ['Drass', 'Kargil War Memorial Drass', 'Drass River'],
  'Kargil Town GP':      ['Kargil Town', 'Kargil War Memorial', 'Hunderman'],
  'Panikhar GP':         ['Panikhar', 'Nun Kun Base', 'Parkachik Glacier'],
  // ── Kokernag / Achabal ──
  'Kokernag GP':         ['Kokernag Garden', 'Kokernag Spring', 'Achabal Garden'],
  'Verinag GP':          ['Verinag Spring', 'Verinag Garden', 'Martand Sun Temple'],
  'Daksum GP':           ['Daksum', 'Lidder Forest', 'Sinthan Pass (near)'],
  'Other':               ['Other'],
}

// Helper to get next level options
export function getDistricts(state) {
  return DISTRICTS[state] || []
}

export function getBlocks(district) {
  return BLOCKS[district] || []
}

export function getGPs(block) {
  return GRAM_PANCHAYATS[block] || []
}

export function getVillages(gp) {
  return VILLAGES[gp] || []
}
