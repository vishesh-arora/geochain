import { useState, useEffect, useRef } from "react";

// ── Letter difficulty tiers ──────────────────────────────────────────────────
const LETTER_TIERS = {
  S: 1, A: 1, C: 1, M: 1, B: 1, L: 1, R: 1, T: 1, N: 1, P: 1,
  D: 1.5, G: 1.5, H: 1.5, F: 1.5, I: 1.5, K: 1.5, E: 1.5, O: 1.5,
  J: 2, U: 2, V: 2, W: 2, Y: 2, Z: 2,
  Q: 3, X: 3,
};
const tierLabel = (l) => {
  const t = LETTER_TIERS[l?.toUpperCase()] ?? 1;
  if (t >= 3) return { label: "🔥 ULTRA RARE", color: "#ff4d4d" };
  if (t >= 2) return { label: "⚡ RARE", color: "#ffd700" };
  if (t >= 1.5) return { label: "✦ UNCOMMON", color: "#7ecfff" };
  return { label: "COMMON", color: "#a0a0a0" };
};

// ── Accent normaliser (strips diacritics so "Lome" matches "Lomé") ───────────
function stripAccents(s) {
  return s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() ?? "";
}
function normalize(s) { return s?.trim().toLowerCase() ?? ""; }

// ── Geo dataset ──────────────────────────────────────────────────────────────
// Canonical entries (may have accents). Matching is done accent-insensitively.
const GEO_DATA = [

  // ════════════════════════════════════════════════════════════
  // CONTINENTS (8)
  // ════════════════════════════════════════════════════════════
  "Africa","Antarctica","Asia","Australia","Europe",
  "North America","Oceania","South America",

  // ════════════════════════════════════════════════════════════
  // COUNTRIES (195 — all UN members + Vatican + Palestine)
  // ════════════════════════════════════════════════════════════
  "Afghanistan","Albania","Algeria","Andorra","Angola",
  "Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize",
  "Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil",
  "Brunei","Bulgaria","Burkina Faso","Burundi",
  "Cambodia","Cameroon","Canada","Cape Verde","Central African Republic",
  "Chad","Chile","China","Colombia","Comoros","Congo",
  "Costa Rica","Croatia","Cuba","Cyprus","Czechia",
  "Democratic Republic of the Congo","Denmark","Djibouti","Dominica",
  "Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia",
  "Eswatini","Ethiopia",
  "Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Ivory Coast",
  "Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein",
  "Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia",
  "Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
  "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger",
  "Nigeria","North Korea","North Macedonia","Norway",
  "Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru",
  "Philippines","Poland","Portugal",
  "Qatar",
  "Romania","Russia","Rwanda",
  "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines",
  "Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal",
  "Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan",
  "Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga",
  "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan",
  "Vanuatu","Vatican City","Venezuela","Vietnam",
  "Yemen",
  "Zambia","Zimbabwe",

  // ════════════════════════════════════════════════════════════
  // WORLD CAPITALS — one per country (195 total)
  // ════════════════════════════════════════════════════════════
  // A
  "Kabul",          // Afghanistan
  "Tirana",         // Albania
  "Algiers",        // Algeria
  "Andorra la Vella", // Andorra
  "Luanda",         // Angola
  "Saint Johns",    // Antigua and Barbuda
  "Buenos Aires",   // Argentina
  "Yerevan",        // Armenia
  "Canberra",       // Australia
  "Vienna",         // Austria
  "Baku",           // Azerbaijan
  // B
  "Nassau",         // Bahamas
  "Manama",         // Bahrain
  "Dhaka",          // Bangladesh
  "Bridgetown",     // Barbados
  "Minsk",          // Belarus
  "Brussels",       // Belgium
  "Belmopan",       // Belize
  "Porto-Novo",     // Benin
  "Thimphu",        // Bhutan
  "Sucre",          // Bolivia (constitutional)
  "La Paz",         // Bolivia (seat of govt)
  "Sarajevo",       // Bosnia and Herzegovina
  "Gaborone",       // Botswana
  "Brasilia",       // Brazil
  "Bandar Seri Begawan", // Brunei
  "Sofia",          // Bulgaria
  "Ouagadougou",    // Burkina Faso
  "Gitega",         // Burundi
  // C
  "Phnom Penh",     // Cambodia
  "Yaounde",        // Cameroon
  "Ottawa",         // Canada
  "Praia",          // Cape Verde
  "Bangui",         // Central African Republic
  "Ndjamena",       // Chad
  "Santiago",       // Chile
  "Beijing",        // China
  "Bogota",         // Colombia
  "Moroni",         // Comoros
  "Kinshasa",       // DR Congo
  "Brazzaville",    // Republic of Congo
  "San Jose",       // Costa Rica
  "Zagreb",         // Croatia
  "Havana",         // Cuba
  "Nicosia",        // Cyprus
  "Prague",         // Czechia
  // D
  "Copenhagen",     // Denmark
  "Djibouti",       // Djibouti
  "Roseau",         // Dominica
  "Santo Domingo",  // Dominican Republic
  // E
  "Quito",          // Ecuador
  "Cairo",          // Egypt
  "San Salvador",   // El Salvador
  "Malabo",         // Equatorial Guinea
  "Asmara",         // Eritrea
  "Tallinn",        // Estonia
  "Mbabane",        // Eswatini
  "Addis Ababa",    // Ethiopia
  // F
  "Suva",           // Fiji
  "Helsinki",       // Finland
  "Paris",          // France
  // G
  "Libreville",     // Gabon
  "Banjul",         // Gambia
  "Tbilisi",        // Georgia
  "Berlin",         // Germany
  "Accra",          // Ghana
  "Athens",         // Greece
  "Saint Georges",  // Grenada
  "Guatemala City", // Guatemala
  "Conakry",        // Guinea
  "Bissau",         // Guinea-Bissau
  "Georgetown",     // Guyana
  // H
  "Port-au-Prince", // Haiti
  "Tegucigalpa",    // Honduras
  "Budapest",       // Hungary
  // I
  "Reykjavik",      // Iceland
  "New Delhi",      // India
  "Jakarta",        // Indonesia
  "Tehran",         // Iran
  "Baghdad",        // Iraq
  "Dublin",         // Ireland
  "Jerusalem",      // Israel
  "Rome",           // Italy
  "Yamoussoukro",   // Ivory Coast
  // J
  "Kingston",       // Jamaica
  "Tokyo",          // Japan
  "Amman",          // Jordan
  // K
  "Astana",         // Kazakhstan
  "Nairobi",        // Kenya
  "South Tarawa",   // Kiribati
  "Kuwait City",    // Kuwait
  "Bishkek",        // Kyrgyzstan
  // L
  "Vientiane",      // Laos
  "Riga",           // Latvia
  "Beirut",         // Lebanon
  "Maseru",         // Lesotho
  "Monrovia",       // Liberia
  "Tripoli",        // Libya
  "Vaduz",          // Liechtenstein
  "Vilnius",        // Lithuania
  "Luxembourg City", // Luxembourg
  // M
  "Antananarivo",   // Madagascar
  "Lilongwe",       // Malawi
  "Kuala Lumpur",   // Malaysia
  "Male",           // Maldives
  "Bamako",         // Mali
  "Valletta",       // Malta
  "Majuro",         // Marshall Islands
  "Nouakchott",     // Mauritania
  "Port Louis",     // Mauritius
  "Mexico City",    // Mexico
  "Palikir",        // Micronesia
  "Chisinau",       // Moldova
  "Monaco",         // Monaco
  "Ulaanbaatar",    // Mongolia
  "Podgorica",      // Montenegro
  "Rabat",          // Morocco
  "Maputo",         // Mozambique
  "Naypyidaw",      // Myanmar
  // N
  "Windhoek",       // Namibia
  "Yaren",          // Nauru
  "Kathmandu",      // Nepal
  "Amsterdam",      // Netherlands
  "Wellington",     // New Zealand
  "Managua",        // Nicaragua
  "Niamey",         // Niger
  "Abuja",          // Nigeria
  "Pyongyang",      // North Korea
  "Skopje",         // North Macedonia
  "Oslo",           // Norway
  // O
  "Muscat",         // Oman
  // P
  "Islamabad",      // Pakistan
  "Ngerulmud",      // Palau
  "Ramallah",       // Palestine
  "Panama City",    // Panama
  "Port Moresby",   // Papua New Guinea
  "Asuncion",       // Paraguay
  "Lima",           // Peru
  "Manila",         // Philippines
  "Warsaw",         // Poland
  "Lisbon",         // Portugal
  // Q
  "Doha",           // Qatar
  // R
  "Bucharest",      // Romania
  "Moscow",         // Russia
  "Kigali",         // Rwanda
  // S
  "Basseterre",     // Saint Kitts and Nevis
  "Castries",       // Saint Lucia
  "Kingstown",      // Saint Vincent
  "Apia",           // Samoa
  "San Marino",     // San Marino
  "Sao Tome",       // Sao Tome and Principe
  "Riyadh",         // Saudi Arabia
  "Dakar",          // Senegal
  "Belgrade",       // Serbia
  "Victoria",       // Seychelles
  "Freetown",       // Sierra Leone
  "Singapore",      // Singapore
  "Bratislava",     // Slovakia
  "Ljubljana",      // Slovenia
  "Honiara",        // Solomon Islands
  "Mogadishu",      // Somalia
  "Pretoria",       // South Africa (admin)
  "Cape Town",      // South Africa (legislative)
  "Bloemfontein",   // South Africa (judicial)
  "Seoul",          // South Korea
  "Juba",           // South Sudan
  "Madrid",         // Spain
  "Sri Jayawardenepura Kotte", // Sri Lanka
  "Khartoum",       // Sudan
  "Paramaribo",     // Suriname
  "Stockholm",      // Sweden
  "Bern",           // Switzerland
  "Damascus",       // Syria
  // T
  "Taipei",         // Taiwan
  "Dushanbe",       // Tajikistan
  "Dodoma",         // Tanzania
  "Bangkok",        // Thailand
  "Dili",           // Timor-Leste
  "Lome",           // Togo
  "Nukualofa",      // Tonga
  "Port of Spain",  // Trinidad and Tobago
  "Tunis",          // Tunisia
  "Ankara",         // Turkey
  "Ashgabat",       // Turkmenistan
  "Funafuti",       // Tuvalu
  // U
  "Kampala",        // Uganda
  "Kyiv",           // Ukraine
  "Abu Dhabi",      // UAE
  "London",         // United Kingdom
  "Washington DC",  // United States
  "Montevideo",     // Uruguay
  "Tashkent",       // Uzbekistan
  // V
  "Port Vila",      // Vanuatu
  "Vatican City",   // Vatican City
  "Caracas",        // Venezuela
  "Hanoi",          // Vietnam
  // Y
  "Sanaa",          // Yemen
  // Z
  "Lusaka",         // Zambia
  "Harare",         // Zimbabwe

  // ════════════════════════════════════════════════════════════
  // INDIAN STATES (28) & UNION TERRITORIES (9)
  // ════════════════════════════════════════════════════════════
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  // UTs
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli",
  "Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",

  // ════════════════════════════════════════════════════════════
  // INDIAN CITIES — Tier 1 metros
  // ════════════════════════════════════════════════════════════
  "Ahmedabad","Bengaluru","Bangalore","Chennai","Delhi","Hyderabad",
  "Kolkata","Mumbai","Pune","Surat",

  // ════════════════════════════════════════════════════════════
  // INDIAN CITIES — Tier 2 (Y-class / major urban)
  // ════════════════════════════════════════════════════════════
  // Andhra Pradesh
  "Vijayawada","Visakhapatnam","Guntur","Nellore","Kurnool","Rajahmundry",
  "Tirupati","Kakinada","Kadapa","Anantapur","Eluru","Ongole","Vizianagaram",
  // Assam
  "Guwahati","Dibrugarh","Silchar","Jorhat","Tezpur","Nagaon","Tinsukia",
  // Bihar
  "Patna","Gaya","Bhagalpur","Muzaffarpur","Purnia","Darbhanga","Bihar Sharif",
  "Arrah","Begusarai","Katihar","Samastipur",
  // Chhattisgarh
  "Raipur","Bhilai","Bilaspur","Durg","Korba","Rajnandgaon",
  // Delhi / NCR
  "Noida","Gurgaon","Gurugram","Faridabad","Ghaziabad",
  // Goa
  "Panaji","Margao","Vasco da Gama",
  // Gujarat
  "Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar",
  "Gandhinagar","Anand","Nadiad","Morbi","Junagadh","Navsari","Surendranagar",
  // Haryana
  "Faridabad","Gurgaon","Gurugram","Ambala","Karnal","Rohtak","Hisar",
  "Panipat","Sonipat","Yamunanagar","Rewari","Bhiwani",
  // Himachal Pradesh
  "Shimla","Dharamsala","Solan","Mandi","Kullu","Manali",
  // Jharkhand
  "Ranchi","Jamshedpur","Dhanbad","Bokaro","Hazaribagh","Deoghar",
  // Karnataka
  "Bengaluru","Mysuru","Mysore","Hubli","Hubballi","Mangaluru","Mangalore",
  "Belagavi","Belgaum","Kalaburagi","Gulbarga","Davangere","Ballari","Bellary",
  "Shivamogga","Shimoga","Tumkur","Bidar","Raichur","Hospet","Hassan",
  "Udupi","Dharwad","Chikmagalur","Mandya","Bagalkot","Gadag","Chitradurga",
  "Bijapur","Vijayapura","Kolar","Ramanagara","Chikkaballapur",
  // Kerala
  "Thiruvananthapuram","Kochi","Ernakulam","Kozhikode","Calicut","Thrissur",
  "Kollam","Kannur","Alappuzha","Alleppey","Palakkad","Malappuram","Kottayam",
  "Kasaragod","Pathanamthitta","Idukki","Wayanad","Thalassery",
  // Madhya Pradesh
  "Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar","Rewa",
  "Satna","Dewas","Ratlam","Burhanpur","Khandwa","Chhindwara",
  "Morena","Bhind","Vidisha","Mandsaur",
  // Maharashtra
  "Mumbai","Pune","Nagpur","Nashik","Aurangabad","Solapur","Amravati",
  "Kolhapur","Nanded","Sangli","Malegaon","Akola","Latur","Dhule",
  "Ahmednagar","Chandrapur","Parbhani","Ichalkaranji","Jalna","Ambernath",
  "Bhiwandi","Navi Mumbai","Thane","Ulhasnagar","Kalyan",
  // Manipur
  "Imphal",
  // Meghalaya
  "Shillong",
  // Mizoram
  "Aizawl",
  // Nagaland
  "Kohima","Dimapur",
  // Odisha
  "Bhubaneswar","Cuttack","Rourkela","Brahmapur","Sambalpur","Puri",
  "Balasore","Baripada","Bhadrak","Jharsuguda","Berhampur",
  // Punjab
  "Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda","Mohali",
  "Pathankot","Hoshiarpur","Moga","Firozpur","Gurdaspur","Rupnagar","Sangrur",
  // Rajasthan
  "Jaipur","Jodhpur","Udaipur","Kota","Bikaner","Ajmer","Bhilwara",
  "Alwar","Bharatpur","Sikar","Pali","Barmer","Sri Ganganagar","Jhunjhunu",
  "Nagaur","Chittorgarh","Tonk","Bundi","Sawai Madhopur","Hanumangarh",
  // Sikkim
  "Gangtok",
  // Tamil Nadu
  "Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli",
  "Tiruppur","Vellore","Erode","Thoothukudi","Dindigul","Thanjavur",
  "Ranipet","Sivakasi","Karur","Udhagamandalam","Ooty","Nagercoil",
  "Kumbakonam","Hosur","Cuddalore","Villupuram","Kanchipuram","Nagapattinam",
  // Telangana
  "Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Ramagundam",
  "Mancherial","Adilabad","Nalgonda","Suryapet","Mahabubnagar","Miryalaguda",
  // Tripura
  "Agartala",
  // Uttar Pradesh
  "Lucknow","Kanpur","Ghaziabad","Agra","Meerut","Varanasi","Allahabad",
  "Prayagraj","Bareilly","Aligarh","Moradabad","Saharanpur","Gorakhpur",
  "Firozabad","Noida","Mathura","Muzaffarnagar","Ghazipur","Jhansi",
  "Shahjahanpur","Rampur","Sitapur","Hapur","Sambhal","Amroha","Bulandshahr",
  "Etawah","Fatehpur","Banda","Lakhimpur","Bahraich","Ballia","Ayodhya",
  "Sultanpur","Faizabad",
  // Uttarakhand
  "Dehradun","Haridwar","Roorkee","Haldwani","Kashipur","Rudrapur",
  "Rishikesh","Nainital",
  // West Bengal
  "Kolkata","Asansol","Siliguri","Durgapur","Bardhaman","Burdwan",
  "Howrah","Malda","Murshidabad","Berhampore","Kharagpur","Haldia",
  "Kalyani","Krishnanagar","Jalpaiguri","Cooch Behar","Purulia","Bankura",
  "Midnapore","Medinipur","Raiganj","Islampur","Balurghat",
  // Arunachal Pradesh
  "Itanagar","Naharlagun","Tawang",
  // North East
  "Imphal","Shillong","Aizawl","Kohima","Agartala","Gangtok",

  // ════════════════════════════════════════════════════════════
  // US STATES (50)
  // ════════════════════════════════════════════════════════════
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
  "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",

  // ════════════════════════════════════════════════════════════
  // AUSTRALIAN STATES & TERRITORIES (8)
  // ════════════════════════════════════════════════════════════
  "Australian Capital Territory","New South Wales","Northern Territory",
  "Queensland","South Australia","Tasmania","Victoria","Western Australia",

  // ════════════════════════════════════════════════════════════
  // CANADIAN PROVINCES & TERRITORIES (13)
  // ════════════════════════════════════════════════════════════
  "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland",
  "Northwest Territories","Nova Scotia","Nunavut","Ontario",
  "Prince Edward Island","Quebec","Saskatchewan","Yukon",

  // ════════════════════════════════════════════════════════════
  // CHINESE PROVINCES & MUNICIPALITIES (27)
  // ════════════════════════════════════════════════════════════
  "Anhui","Fujian","Gansu","Guangdong","Guizhou","Hainan","Hebei",
  "Heilongjiang","Henan","Hubei","Hunan","Inner Mongolia","Jiangsu",
  "Jiangxi","Jilin","Liaoning","Ningxia","Qinghai","Shaanxi","Shandong",
  "Shanxi","Sichuan","Tibet","Xinjiang","Yunnan","Zhejiang","Chongqing",

  // ════════════════════════════════════════════════════════════
  // MAJOR WORLD CITIES (non-capital, non-Indian)
  // ════════════════════════════════════════════════════════════
  // Europe
  "Barcelona","Bilbao","Seville","Valencia","Zaragoza","Malaga",
  "Milan","Naples","Turin","Palermo","Genoa","Bologna","Florence",
  "Marseille","Lyon","Toulouse","Nice","Bordeaux","Nantes","Strasbourg",
  "Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Dusseldorf",
  "Dortmund","Essen","Leipzig","Bremen","Dresden","Hanover","Nuremberg",
  "Rotterdam","Amsterdam","Utrecht","Eindhoven","Antwerp","Ghent","Bruges",
  "Warsaw","Krakow","Lodz","Wroclaw","Poznan","Gdansk","Gdynia","Katowice",
  "Prague","Brno","Budapest","Debrecen","Miskolc",
  "Bratislava","Kosice","Ljubljana","Maribor","Zagreb","Split","Rijeka",
  "Bucharest","Cluj-Napoca","Timisoara","Iasi","Constanta",
  "Sofia","Plovdiv","Varna","Athens","Thessaloniki","Piraeus",
  "Stockholm","Gothenburg","Malmo","Oslo","Bergen","Stavanger","Trondheim",
  "Copenhagen","Aarhus","Helsinki","Tampere","Turku","Reykjavik",
  "Dublin","Cork","Belfast","Edinburgh","Glasgow","Manchester","Birmingham",
  "Liverpool","Leeds","Sheffield","Bristol","Nottingham","Leicester",
  "Zurich","Geneva","Basel","Bern","Lausanne",
  "Kyiv","Kharkiv","Odessa","Dnipro","Donetsk","Lviv","Zaporizhzhia",
  // Russia (non-capital cities)
  "Saint Petersburg","Novosibirsk","Yekaterinburg","Nizhny Novgorod",
  "Samara","Kazan","Chelyabinsk","Omsk","Rostov-on-Don","Ufa","Krasnoyarsk",
  "Perm","Voronezh","Volgograd","Saratov","Tolyatti","Krasnodar","Irkutsk",
  // Middle East (non-capital)
  "Dubai","Abu Dhabi","Sharjah","Jeddah","Mecca","Medina","Dammam",
  "Tel Aviv","Haifa","Beersheba","Aleppo","Mosul","Basra","Kirkuk",
  "Tabriz","Isfahan","Mashhad","Shiraz","Erbil",
  // East Asia (non-capital cities)
  "Shanghai","Guangzhou","Shenzhen","Chongqing","Tianjin","Wuhan",
  "Chengdu","Nanjing","Shenyang","Xian","Harbin","Changsha","Zhengzhou",
  "Qingdao","Hefei","Jinan","Dalian","Suzhou","Hangzhou","Wuxi",
  "Osaka","Yokohama","Nagoya","Sapporo","Kobe","Kyoto","Fukuoka",
  "Kawasaki","Hiroshima","Sendai","Kitakyushu",
  "Busan","Incheon","Daegu","Daejeon","Gwangju","Ulsan","Suwon",
  "Hong Kong","Macau","Taipei","Taichung","Kaohsiung","Tainan",
  // Southeast Asia (non-capital)
  "Ho Chi Minh City","Da Nang","Hue","Can Tho","Hai Phong",
  "Siem Reap","Luang Prabang","Chiang Mai","Pattaya","Phuket",
  "Cebu","Davao","Quezon City","Makati",
  "Surabaya","Bandung","Medan","Semarang","Makassar","Palembang",
  "Johor Bahru","Penang","Ipoh","Kota Kinabalu","Kuching",
  "Mandalay","Yangon",
  // South Asia (non-Indian)
  "Lahore","Karachi","Rawalpindi","Faisalabad","Multan","Peshawar",
  "Quetta","Gujranwala","Sialkot","Bahawalpur","Sargodha","Sukkur",
  "Chittagong","Dhaka","Narayanganj","Rajshahi","Khulna","Sylhet",
  "Comilla","Mymensingh","Gazipur","Rangpur",
  "Colombo","Kandy","Galle","Jaffna",
  "Kathmandu","Pokhara","Lalitpur",
  // Americas (non-capital cities)
  "New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia",
  "San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville",
  "San Francisco","Columbus","Charlotte","Indianapolis","Seattle","Denver",
  "Nashville","Oklahoma City","El Paso","Washington DC","Boston","Portland",
  "Las Vegas","Memphis","Louisville","Baltimore","Milwaukee","Albuquerque",
  "Tucson","Fresno","Sacramento","Mesa","Omaha","Cleveland","Raleigh",
  "Toronto","Montreal","Vancouver","Calgary","Edmonton","Winnipeg","Ottawa",
  "Sao Paulo","Rio de Janeiro","Salvador","Fortaleza","Belo Horizonte",
  "Manaus","Curitiba","Recife","Porto Alegre","Belem",
  "Buenos Aires","Cordoba","Rosario","Mendoza","La Plata",
  "Guadalajara","Monterrey","Puebla","Tijuana","Leon","Juarez","Merida",
  "Medellin","Cali","Barranquilla","Cartagena",
  "Lima","Arequipa","Trujillo","Chiclayo",
  "Bogota","Santiago","Guayaquil","Quito",
  "Caracas","Maracaibo","Valencia","Barquisimeto",
  "Havana","Santo Domingo","Guatemala City","San Salvador","Tegucigalpa",
  "Panama City","Kingston","Port-au-Prince","San Juan",
  // Africa (non-capital cities)
  "Lagos","Ibadan","Kano","Abuja","Kaduna","Benin City","Port Harcourt",
  "Maiduguri","Zaria","Aba","Jos","Ilorin","Oyo","Enugu","Abeokuta",
  "Cairo","Alexandria","Giza","Luxor","Aswan",
  "Casablanca","Rabat","Fez","Marrakesh","Tangier","Agadir",
  "Tunis","Sfax","Sousse",
  "Algiers","Oran","Constantine","Annaba",
  "Tripoli","Benghazi",
  "Johannesburg","Cape Town","Durban","Pretoria","Port Elizabeth",
  "Bloemfontein","East London","Polokwane","Nelspruit",
  "Nairobi","Mombasa","Kisumu","Nakuru",
  "Dar es Salaam","Mwanza","Arusha","Zanzibar",
  "Addis Ababa","Dire Dawa","Gondar","Mekelle",
  "Accra","Kumasi","Tamale",
  "Abidjan","Bouake","Yamoussoukro",
  "Dakar","Touba","Thies",
  "Khartoum","Omdurman","Port Sudan",
  "Kampala","Gulu","Jinja","Mbarara",
  "Kigali","Butare",
  "Harare","Bulawayo","Mutare","Gweru",
  "Lusaka","Ndola","Kitwe","Livingstone",
  "Luanda","Huambo","Lobito",
  "Kinshasa","Lubumbashi","Mbuji-Mayi","Goma",
  "Antananarivo","Toamasina",
  "Maputo","Beira","Nampula",
  "Windhoek","Walvis Bay",
  "Gaborone","Francistown",
  "Hargeisa","Mogadishu",
  "Djibouti","Asmara",
  "Bangui","Brazzaville","Douala","Libreville","Lome",
  "Ouagadougou","Bamako","Conakry","Freetown","Monrovia","Bissau","Banjul",
  "Niamey","Ndjamena","Malabo",
  "Mbabane","Maseru","Lilongwe","Blantyre",
  // Oceania (non-capital cities)
  "Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast",
  "Newcastle","Wollongong","Hobart","Darwin","Canberra",
  "Auckland","Christchurch","Wellington","Hamilton","Tauranga","Dunedin",
  "Suva","Port Moresby","Honiara",
];

// ── Deduplicate + build accent-normalised lookup ──────────────────────────────
// canonical form (with proper capitalisation preserved) deduplicated
const GEO_SET = [...new Map(
  GEO_DATA.map(g => g.trim()).filter(Boolean).map(g => [stripAccents(g), g])
).values()].sort();

// Lookup: stripped accent key → canonical word
const ACCENT_MAP = new Map(GEO_SET.map(g => [stripAccents(g), g]));

function firstLetter(word) { return stripAccents(word)?.[0]?.toUpperCase(); }
function lastLetter(word) {
  const w = stripAccents(word);
  for (let i = w.length - 1; i >= 0; i--) {
    if (/[a-z]/.test(w[i])) return w[i].toUpperCase();
  }
  return w[w.length - 1]?.toUpperCase();
}
function getComputerOptions(letter, used) {
  return GEO_SET.filter(g =>
    firstLetter(g) === letter.toUpperCase() && !used.has(stripAccents(g))
  );
}
function computerPick(letter, used, difficulty) {
  const options = getComputerOptions(letter, used);
  if (!options.length) return null;
  if (difficulty === "hard") {
    const hard = options.filter(o => (LETTER_TIERS[lastLetter(o)] ?? 1) >= 2);
    if (hard.length) return hard[Math.floor(Math.random() * hard.length)];
  }
  return options[Math.floor(Math.random() * options.length)];
}
function calcScore(word, timeLeft, timerDuration) {
  const multiplier = LETTER_TIERS[firstLetter(word)] ?? 1;
  const timeBonus = Math.floor((timeLeft / timerDuration) * 100);
  return Math.round((100 + timeBonus) * multiplier);
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy: #0b0f1a; --navy2: #111827; --navy3: #1a2235;
    --gold: #c9a84c; --gold2: #e8c96a;
    --teal: #38bdf8; --red: #ef4444; --green: #22c55e;
    --text: #e2d9c8; --muted: #6b7280; --border: rgba(201,168,76,0.2);
  }
  body { background: var(--navy); color: var(--text); font-family: 'DM Mono', monospace; min-height: 100vh; overflow-x: hidden; }
  .geo-app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; position: relative; }
  .geo-app::before {
    content: ''; position: fixed; inset: 0;
    background-image: linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 48px 48px; pointer-events: none; z-index: 0;
  }
  .screen { position: relative; z-index: 1; width: 100%; max-width: 700px; padding: 24px 20px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; justify-content: center; gap: 28px; }
  .logo { text-align: center; line-height: 1; }
  .logo-main { font-family: 'Playfair Display', serif; font-size: clamp(52px, 10vw, 80px); font-weight: 900; color: var(--gold); letter-spacing: -2px; text-shadow: 0 0 60px rgba(201,168,76,0.4); }
  .logo-sub { font-size: 11px; letter-spacing: 4px; color: var(--muted); text-transform: uppercase; margin-top: 4px; }
  .card { background: var(--navy2); border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 100%; box-shadow: 0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.1); }
  .card-title { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--gold); margin-bottom: 18px; letter-spacing: 1px; }
  .settings-grid { display: flex; flex-direction: column; gap: 20px; }
  .setting-row { display: flex; flex-direction: column; gap: 8px; }
  .setting-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); }
  .setting-value { font-size: 28px; font-weight: 500; color: var(--text); letter-spacing: -1px; }
  .slider { -webkit-appearance: none; width: 100%; height: 4px; background: var(--navy3); border-radius: 2px; outline: none; cursor: pointer; }
  .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--gold); cursor: pointer; box-shadow: 0 0 12px rgba(201,168,76,0.6); }
  .diff-btns { display: flex; gap: 8px; }
  .diff-btn { flex: 1; padding: 10px 8px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
  .diff-btn.active { background: var(--gold); color: var(--navy); border-color: var(--gold); font-weight: 500; }
  .btn-primary { width: 100%; padding: 18px; border-radius: 12px; border: none; background: var(--gold); color: var(--navy); font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; cursor: pointer; transition: all 0.15s; box-shadow: 0 8px 32px rgba(201,168,76,0.3); letter-spacing: 1px; }
  .btn-primary:hover { background: var(--gold2); transform: translateY(-1px); box-shadow: 0 12px 40px rgba(201,168,76,0.4); }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 12px 24px; border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
  .btn-ghost:hover { border-color: var(--gold); color: var(--gold); }
  .hud { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; width: 100%; gap: 16px; }
  .hud-stat { display: flex; flex-direction: column; gap: 2px; }
  .hud-stat.right { text-align: right; }
  .hud-stat-label { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); }
  .hud-stat-value { font-size: 28px; font-weight: 500; color: var(--text); }
  .timer-ring-wrap { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
  .timer-ring-wrap svg { transform: rotate(-90deg); }
  .timer-ring-bg { fill: none; stroke: var(--navy3); stroke-width: 4; }
  .timer-ring-fg { fill: none; stroke-width: 4; stroke-linecap: round; transition: stroke-dashoffset 1s linear, stroke 0.3s; }
  .timer-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 500; }
  .strikes { display: flex; gap: 6px; justify-content: center; }
  .strike-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--red); transition: background 0.2s; }
  .strike-dot.used { background: var(--red); }
  .chain-display { width: 100%; background: var(--navy3); border: 1px solid var(--border); border-radius: 12px; padding: 14px; min-height: 72px; display: flex; flex-wrap: wrap; gap: 6px; align-content: flex-start; max-height: 140px; overflow-y: auto; }
  .chain-word { padding: 4px 10px; border-radius: 20px; font-size: 12px; letter-spacing: 0.5px; }
  .chain-word.player { background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.4); color: var(--teal); }
  .chain-word.computer { background: rgba(201,168,76,0.1); border: 1px solid var(--border); color: var(--gold); }
  .letter-prompt { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .letter-prompt-label { font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: var(--muted); }
  .letter-prompt-letter { font-family: 'Playfair Display', serif; font-size: 72px; font-weight: 900; color: var(--gold); line-height: 1; text-shadow: 0 0 40px rgba(201,168,76,0.5); }
  .letter-tier-badge { font-size: 10px; letter-spacing: 2px; padding: 3px 10px; border-radius: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
  .input-row { display: flex; gap: 10px; width: 100%; }
  .geo-input { flex: 1; background: var(--navy3); border: 2px solid var(--border); border-radius: 10px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 16px; padding: 14px 18px; outline: none; transition: border-color 0.15s; }
  .geo-input:focus { border-color: var(--gold); }
  .geo-input.error { border-color: var(--red); animation: shake 0.3s ease; }
  .geo-input.success { border-color: var(--green); }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  .submit-btn { background: var(--gold); border: none; border-radius: 10px; color: var(--navy); font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 2px; padding: 14px 18px; cursor: pointer; text-transform: uppercase; font-weight: 500; transition: all 0.15s; }
  .submit-btn:hover { background: var(--gold2); }
  .feedback { font-size: 12px; letter-spacing: 1px; min-height: 18px; text-align: center; color: var(--red); }
  .feedback.ok { color: var(--green); }
  .computer-turn { text-align: center; padding: 20px; color: var(--muted); font-size: 13px; letter-spacing: 2px; animation: pulse 1s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .score-pop { position: fixed; pointer-events: none; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: var(--gold); text-shadow: 0 0 20px rgba(201,168,76,0.8); animation: scoreFloat 1.2s ease forwards; z-index: 999; }
  @keyframes scoreFloat { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-80px)} }
  .end-score { text-align: center; }
  .end-score-number { font-family: 'Playfair Display', serif; font-size: 80px; font-weight: 900; color: var(--gold); line-height: 1; text-shadow: 0 0 60px rgba(201,168,76,0.4); }
  .end-score-label { font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: var(--muted); margin-top: 6px; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; width: 100%; }
  .stat-box { background: var(--navy3); border: 1px solid var(--border); border-radius: 10px; padding: 16px 12px; text-align: center; }
  .stat-box-val { font-size: 28px; font-weight: 500; color: var(--text); }
  .stat-box-lbl { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
  .chain-summary { width: 100%; display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
  .chain-summary-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; background: var(--navy3); border: 1px solid var(--border); }
  .chain-summary-idx { font-size: 10px; color: var(--muted); width: 20px; flex-shrink: 0; }
  .chain-summary-word { flex: 1; font-size: 14px; }
  .chain-summary-who { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; padding: 2px 8px; border-radius: 10px; }
  .chain-summary-who.player { background: rgba(56,189,248,0.15); color: var(--teal); }
  .chain-summary-who.computer { background: rgba(201,168,76,0.1); color: var(--gold); }
  .chain-summary-pts { font-size: 12px; color: var(--gold); width: 52px; text-align: right; }
  .end-btn-row { display: flex; gap: 10px; width: 100%; }
  .globe-deco { position: fixed; top: -120px; right: -120px; width: 320px; height: 320px; border-radius: 50%; border: 1px solid rgba(201,168,76,0.08); background: radial-gradient(circle at 35% 35%, rgba(201,168,76,0.06), transparent 70%); pointer-events: none; z-index: 0; }
  .globe-deco::before { content: ''; position: absolute; inset: 20px; border-radius: 50%; border: 1px solid rgba(201,168,76,0.05); }
  .globe-deco::after { content: ''; position: absolute; inset: 60px; border-radius: 50%; border: 1px solid rgba(201,168,76,0.04); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--navy3); border-radius: 2px; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  .cat-badges { display: flex; gap: 8px; flex-wrap: wrap; }
  .cat-badge { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border); color: var(--muted); background: rgba(255,255,255,0.03); }
  .dataset-note { font-size: 10px; color: var(--muted); letter-spacing: 1px; text-align:center; }
`;

// ── Timer Ring ────────────────────────────────────────────────────────────────
function TimerRing({ timeLeft, total }) {
  const r = 34, circ = 2 * Math.PI * r;
  const frac = Math.max(0, timeLeft / total);
  const color = frac > 0.5 ? "#c9a84c" : frac > 0.25 ? "#fb923c" : "#ef4444";
  return (
    <div className="timer-ring-wrap">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle className="timer-ring-bg" cx="40" cy="40" r={r} />
        <circle className="timer-ring-fg" cx="40" cy="40" r={r}
          stroke={color} strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} />
      </svg>
      <div className="timer-text" style={{ color }}>{timeLeft}</div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function GeoChain() {
  const [screen, setScreen] = useState("home");
  const [timerDuration, setTimerDuration] = useState(15);
  const [difficulty, setDifficulty] = useState("medium");

  const [chain, setChain] = useState([]);
  const [usedSet, setUsedSet] = useState(new Set());
  const [currentLetter, setCurrentLetter] = useState("A");
  const [strikes, setStrikes] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [inputVal, setInputVal] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackOk, setFeedbackOk] = useState(false);
  const [inputState, setInputState] = useState("");
  const [turn, setTurn] = useState("player");
  const [scorePops, setScorePops] = useState([]);
  const [endReason, setEndReason] = useState("");
  const [finalStrikes, setFinalStrikes] = useState(0);

  const timerRef = useRef(null);
  const chainEndRef = useRef(null);
  const inputRef = useRef(null);
  const popIdRef = useRef(0);
  const strikesRef = useRef(0);
  const scoreRef = useRef(0);

  useEffect(() => { strikesRef.current = strikes; }, [strikes]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  function startGame() {
    clearInterval(timerRef.current);
    setChain([]); setUsedSet(new Set()); setCurrentLetter("A");
    setStrikes(0); strikesRef.current = 0;
    setScore(0); scoreRef.current = 0;
    setTimeLeft(timerDuration); setInputVal(""); setFeedback("");
    setInputState(""); setTurn("player"); setScorePops([]); setEndReason("");
    setScreen("game");
  }

  // ── Timer ──
  useEffect(() => {
    if (screen !== "game" || turn !== "player") return;
    clearInterval(timerRef.current);
    setTimeLeft(timerDuration);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, turn, currentLetter]);

  function handleTimeout() {
    const ns = strikesRef.current + 1;
    strikesRef.current = ns; setStrikes(ns);
    setFeedback("⏱ Time's up!"); setFeedbackOk(false); setInputState("error");
    setTimeout(() => {
      if (ns >= 3) doEndGame("Time's up — 3 strikes and you're out!", ns);
      else { setInputState(""); setFeedback(""); inputRef.current?.focus(); }
    }, 1000);
  }

  function showPop(pts) {
    const id = popIdRef.current++;
    setScorePops(p => [...p, { id, score: pts, x: 200 + Math.random() * 200, y: 220 }]);
    setTimeout(() => setScorePops(p => p.filter(s => s.id !== id)), 1300);
  }

  function submitAnswer() {
    const raw = inputVal.trim();
    if (!raw) return;
    clearInterval(timerRef.current);

    const stripped = stripAccents(raw);

    // 1. Starts with correct letter?
    if (stripped[0]?.toUpperCase() !== currentLetter.toUpperCase()) {
      setFeedback(`Must start with "${currentLetter.toUpperCase()}"`);
      setFeedbackOk(false); setInputState("error");
      restartTimer();
      setTimeout(() => { setInputState(""); setFeedback(""); }, 1200);
      return;
    }

    // 2. In dataset? (accent-insensitive)
    const canonical = ACCENT_MAP.get(stripped);
    if (!canonical) {
      const ns = strikesRef.current + 1;
      strikesRef.current = ns; setStrikes(ns);
      setFeedback("Not a recognised place — try again!");
      setFeedbackOk(false); setInputState("error");
      setTimeout(() => {
        if (ns >= 3) doEndGame("3 invalid answers — game over!", ns);
        else { setInputState(""); setFeedback(""); setInputVal(""); inputRef.current?.focus(); }
      }, 1300);
      return;
    }

    // 3. Already used?
    if (usedSet.has(stripped)) {
      setFeedback("Already used!");
      setFeedbackOk(false); setInputState("error");
      restartTimer();
      setTimeout(() => { setInputState(""); setFeedback(""); }, 1000);
      return;
    }

    // ✅ Valid!
    const pts = calcScore(canonical, timeLeft, timerDuration);
    const ns = scoreRef.current + pts; scoreRef.current = ns;
    const newUsed = new Set(usedSet); newUsed.add(stripped);
    const nextLetter = lastLetter(canonical);

    setScore(ns); setUsedSet(newUsed);
    setChain(c => [...c, { word: canonical, who: "player", score: pts }]);
    setInputVal(""); setFeedback(`+${pts} pts`); setFeedbackOk(true); setInputState("success");
    showPop(pts);

    setTimeout(() => {
      setInputState(""); setFeedback(""); setCurrentLetter(nextLetter); setTurn("computer");
    }, 600);
  }

  function restartTimer() {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  // ── Computer turn ──
  useEffect(() => {
    if (screen !== "game" || turn !== "computer") return;
    const delay = difficulty === "hard" ? 1100 : difficulty === "easy" ? 450 : 700;
    const t = setTimeout(() => {
      const pick = computerPick(currentLetter, usedSet, difficulty);
      if (!pick) { doEndGame("Computer couldn't answer — you win! 🎉", strikesRef.current); return; }
      const newUsed = new Set(usedSet); newUsed.add(stripAccents(pick));
      setUsedSet(newUsed);
      setChain(c => [...c, { word: pick, who: "computer", score: 0 }]);
      setCurrentLetter(lastLetter(pick));
      setTurn("player");
    }, delay);
    return () => clearTimeout(t);
  }, [turn, screen]);

  useEffect(() => { chainEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chain]);

  function doEndGame(reason, fs) {
    clearInterval(timerRef.current);
    setFinalStrikes(fs ?? strikesRef.current);
    setEndReason(reason);
    setScreen("end");
  }

  function handleKeyDown(e) { if (e.key === "Enter") submitAnswer(); }
  const tier = tierLabel(currentLetter);

  return (
    <>
      <style>{css}</style>
      <div className="geo-app">
        <div className="globe-deco" />

        {scorePops.map(p => (
          <div key={p.id} className="score-pop" style={{ left: p.x, top: p.y }}>+{p.score}</div>
        ))}

        {/* ── HOME ── */}
        {screen === "home" && (
          <div className="screen">
            <div className="logo">
              <div className="logo-main">GeoChain</div>
              <div className="logo-sub">The Geography Chain Game</div>
            </div>
            <div className="card">
              <div className="card-title">Game Settings</div>
              <div className="settings-grid">
                <div className="setting-row">
                  <div className="setting-label">Timer per turn</div>
                  <div className="setting-value">{timerDuration}s</div>
                  <input type="range" className="slider" min={5} max={60} step={5}
                    value={timerDuration} onChange={e => setTimerDuration(Number(e.target.value))} />
                </div>
                <div className="setting-row">
                  <div className="setting-label">Computer Difficulty</div>
                  <div className="diff-btns">
                    {["easy","medium","hard"].map(d => (
                      <button key={d} className={`diff-btn${difficulty === d ? " active" : ""}`}
                        onClick={() => setDifficulty(d)}>{d}</button>
                    ))}
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-label">Valid Answers</div>
                  <div className="cat-badges">
                    {["Cities","Capitals","Countries","States","Continents"].map(c => (
                      <span key={c} className="cat-badge">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{width:"100%"}}>
              <button className="btn-primary" onClick={startGame}>Start Game</button>
            </div>
            <div className="dataset-note">
              {GEO_SET.length.toLocaleString()} valid places · accents optional · 3 strikes = game over
            </div>
          </div>
        )}

        {/* ── GAME ── */}
        {screen === "game" && (
          <div className="screen" style={{justifyContent:"flex-start",paddingTop:28,gap:18}}>
            <div className="hud">
              <div className="hud-stat">
                <div className="hud-stat-label">Score</div>
                <div className="hud-stat-value">{score.toLocaleString()}</div>
              </div>
              <TimerRing timeLeft={timeLeft} total={timerDuration} />
              <div className="hud-stat right">
                <div className="hud-stat-label">Chain</div>
                <div className="hud-stat-value">{chain.length}</div>
              </div>
            </div>
            <div className="strikes">
              {[0,1,2].map(i => (
                <div key={i} className={`strike-dot${i < strikes ? " used" : ""}`} />
              ))}
            </div>
            <div className="letter-prompt">
              <div className="letter-prompt-label">Next word starts with</div>
              <div className="letter-prompt-letter">{currentLetter}</div>
              <div className="letter-tier-badge" style={{color:tier.color,borderColor:tier.color+"44"}}>
                {tier.label}
              </div>
            </div>
            <div className="chain-display">
              {chain.map((item, i) => (
                <span key={i} className={`chain-word ${item.who}`}>{item.word}</span>
              ))}
              <div ref={chainEndRef} />
            </div>
            {turn === "player" ? (
              <>
                <div className="input-row">
                  <input ref={inputRef} autoFocus
                    className={`geo-input${inputState === "error" ? " error" : inputState === "success" ? " success" : ""}`}
                    placeholder={`City, country, state, capital starting with "${currentLetter}"…`}
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={inputState === "success"}
                  />
                  <button className="submit-btn" onClick={submitAnswer}>GO</button>
                </div>
                <div className={`feedback${feedbackOk ? " ok" : ""}`}>{feedback}</div>
              </>
            ) : (
              <div className="computer-turn">Computer is thinking…</div>
            )}
            <button className="btn-ghost" onClick={() => doEndGame("Game ended early.", strikes)}>
              Quit Game
            </button>
          </div>
        )}

        {/* ── END ── */}
        {screen === "end" && (
          <div className="screen" style={{justifyContent:"flex-start",paddingTop:36,gap:22}}>
            <div className="logo">
              <div className="logo-main" style={{fontSize:"clamp(36px,7vw,56px)"}}>GeoChain</div>
            </div>
            <div className="end-score">
              <div className="end-score-number">{score.toLocaleString()}</div>
              <div className="end-score-label">Final Score</div>
            </div>
            <div style={{fontSize:12,color:"var(--muted)",textAlign:"center",letterSpacing:"0.5px",lineHeight:1.7}}>
              {endReason}
            </div>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-box-val">{chain.filter(c=>c.who==="player").length}</div>
                <div className="stat-box-lbl">Your Answers</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-val">{chain.length}</div>
                <div className="stat-box-lbl">Chain Length</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-val">{finalStrikes}</div>
                <div className="stat-box-lbl">Strikes</div>
              </div>
            </div>
            {chain.length > 0 && (
              <div className="card" style={{padding:20}}>
                <div className="card-title" style={{fontSize:14,marginBottom:12}}>
                  Your Journey — {chain.length} places
                </div>
                <div className="chain-summary">
                  {chain.map((item, i) => (
                    <div key={i} className="chain-summary-item">
                      <div className="chain-summary-idx">{i+1}</div>
                      <div className="chain-summary-word">{item.word}</div>
                      <div className={`chain-summary-who ${item.who}`}>
                        {item.who === "player" ? "You" : "CPU"}
                      </div>
                      {item.who === "player" && (
                        <div className="chain-summary-pts">+{item.score}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="end-btn-row">
              <button className="btn-primary" onClick={startGame}>Play Again</button>
              <button className="btn-ghost" onClick={() => setScreen("home")}>Settings</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
