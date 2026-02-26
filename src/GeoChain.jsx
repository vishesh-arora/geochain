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

// ── Coordinates database (lat, lng for every entry in GEO_SET) ───────────────
// Covers all capitals, major world cities, Indian cities, US/AU/CA/CN states
const COORDS = {
  // Continents (approximate centres)
  "africa":[9.1,40.0],"antarctica":[-82,0],"asia":[34.0,100.0],"australia":[-25.0,133.0],
  "europe":[54.0,15.0],"north america":[54.0,-105.0],"oceania":[-22.0,166.0],"south america":[-14.0,-51.0],
  // Countries
  "afghanistan":[33.93,67.71],"albania":[41.15,20.17],"algeria":[28.03,1.66],"andorra":[42.55,1.56],
  "angola":[-11.20,17.87],"antigua and barbuda":[17.06,-61.80],"argentina":[-38.42,-63.62],
  "armenia":[40.07,45.04],"austria":[47.52,14.55],"azerbaijan":[40.14,47.58],
  "bahamas":[25.03,-77.40],"bahrain":[26.00,50.55],"bangladesh":[23.68,90.35],
  "barbados":[13.19,-59.54],"belarus":[53.71,27.95],"belgium":[50.50,4.47],"belize":[17.19,-88.50],
  "benin":[9.31,2.32],"bhutan":[27.51,90.43],"bolivia":[-16.29,-63.59],"bosnia and herzegovina":[43.92,17.68],
  "botswana":[-22.33,24.68],"brazil":[-14.24,-51.93],"brunei":[4.54,114.73],"bulgaria":[42.73,25.49],
  "burkina faso":[12.36,-1.53],"burundi":[-3.37,29.92],"cambodia":[12.57,104.99],
  "cameroon":[7.37,12.35],"canada":[56.13,-106.35],"cape verde":[16.54,-23.04],
  "central african republic":[6.61,20.94],"chad":[15.45,18.73],"chile":[-35.68,-71.54],
  "china":[35.86,104.20],"colombia":[4.57,-74.30],"comoros":[-11.88,43.87],"congo":[-0.23,15.83],
  "democratic republic of the congo":[-4.04,21.76],"costa rica":[9.75,-83.75],"croatia":[45.10,15.20],
  "cuba":[21.52,-77.78],"cyprus":[35.13,33.43],"czechia":[49.82,15.47],"denmark":[56.26,9.50],
  "djibouti":[11.83,42.59],"dominica":[15.41,-61.37],"dominican republic":[18.74,-70.16],
  "ecuador":[-1.83,-78.18],"egypt":[26.82,30.80],"el salvador":[13.79,-88.90],
  "equatorial guinea":[1.65,10.27],"eritrea":[15.18,39.78],"estonia":[58.60,25.01],
  "eswatini":[-26.52,31.47],"ethiopia":[9.15,40.49],"fiji":[-17.71,178.06],"finland":[61.92,25.75],
  "france":[46.23,2.21],"gabon":[-0.80,11.61],"gambia":[13.44,-15.31],"georgia":[42.32,43.36],
  "germany":[51.17,10.45],"ghana":[7.95,-1.02],"greece":[39.07,21.82],"grenada":[12.12,-61.68],
  "guatemala":[15.78,-90.23],"guinea":[11.74,-15.65],"guinea-bissau":[11.80,-15.18],"guyana":[4.86,-58.93],
  "haiti":[18.97,-72.29],"honduras":[15.20,-86.24],"hungary":[47.16,19.50],"iceland":[64.96,-19.02],
  "india":[20.59,78.96],"indonesia":[-0.79,113.92],"iran":[32.43,53.69],"iraq":[33.22,43.68],
  "ireland":[53.41,-8.24],"israel":[31.05,34.85],"italy":[41.87,12.57],"ivory coast":[7.54,-5.55],
  "jamaica":[18.11,-77.30],"japan":[36.20,138.25],"jordan":[30.59,36.24],"kazakhstan":[48.02,66.92],
  "kenya":[-0.02,37.91],"kiribati":[1.87,157.36],"kuwait":[29.31,47.48],"kyrgyzstan":[41.20,74.77],
  "laos":[19.86,102.50],"latvia":[56.88,24.60],"lebanon":[33.85,35.86],"lesotho":[-29.61,28.23],
  "liberia":[6.43,-9.43],"libya":[26.34,17.23],"liechtenstein":[47.14,9.55],"lithuania":[55.17,23.88],
  "luxembourg":[49.82,6.13],"madagascar":[-18.77,46.87],"malawi":[-13.25,34.30],"malaysia":[4.21,101.98],
  "maldives":[3.20,73.22],"mali":[17.57,-3.99],"malta":[35.94,14.38],"marshall islands":[7.13,171.18],
  "mauritania":[21.01,-10.94],"mauritius":[-20.35,57.55],"mexico":[23.63,-102.55],"micronesia":[6.89,158.19],
  "moldova":[47.41,28.37],"monaco":[43.75,7.40],"mongolia":[46.86,103.85],"montenegro":[42.71,19.37],
  "morocco":[31.79,-7.09],"mozambique":[-18.67,35.53],"myanmar":[21.91,95.96],"namibia":[-22.96,18.49],
  "nauru":[-0.53,166.93],"nepal":[28.39,84.12],"netherlands":[52.13,5.29],"new zealand":[-40.90,174.89],
  "nicaragua":[12.87,-85.21],"niger":[17.61,8.08],"nigeria":[9.08,8.68],"north korea":[40.34,127.51],
  "north macedonia":[41.61,21.75],"norway":[60.47,8.47],"oman":[21.51,55.92],"pakistan":[30.38,69.35],
  "palau":[7.51,134.58],"palestine":[31.95,35.23],"panama":[8.54,-80.78],"papua new guinea":[-6.31,143.96],
  "paraguay":[-23.44,-58.44],"peru":[-9.19,-75.02],"philippines":[12.88,121.77],"poland":[51.92,19.14],
  "portugal":[39.40,-8.22],"qatar":[25.35,51.18],"romania":[45.94,24.97],"russia":[61.52,105.32],
  "rwanda":[-1.94,29.87],"saint kitts and nevis":[17.36,-62.78],"saint lucia":[13.91,-60.98],
  "saint vincent and the grenadines":[13.25,-61.20],"samoa":[-13.76,-172.10],"san marino":[43.94,12.46],
  "sao tome and principe":[0.19,6.61],"saudi arabia":[23.89,45.08],"senegal":[14.50,-14.45],
  "serbia":[44.02,21.01],"seychelles":[-4.68,55.49],"sierra leone":[8.46,-11.78],"singapore":[1.35,103.82],
  "slovakia":[48.67,19.70],"slovenia":[46.15,14.99],"solomon islands":[-9.65,160.16],"somalia":[5.15,46.20],
  "south africa":[-30.56,22.94],"south korea":[35.91,127.77],"south sudan":[6.88,31.57],
  "spain":[40.46,-3.75],"sri lanka":[7.87,80.77],"sudan":[12.86,30.22],"suriname":[3.92,-56.03],
  "sweden":[60.13,18.64],"switzerland":[46.82,8.23],"syria":[34.80,38.99],"taiwan":[23.70,121.0],
  "tajikistan":[38.86,71.28],"tanzania":[-6.37,34.89],"thailand":[15.87,100.99],"timor-leste":[-8.87,125.73],
  "togo":[8.62,0.82],"tonga":[-21.18,-175.20],"trinidad and tobago":[10.69,-61.22],"tunisia":[33.89,9.54],
  "turkey":[38.96,35.24],"turkmenistan":[38.97,59.56],"tuvalu":[-7.11,179.09],"uganda":[1.37,32.29],
  "ukraine":[48.38,31.17],"united arab emirates":[23.42,53.85],"united kingdom":[55.38,-3.44],
  "united states":[37.09,-95.71],"uruguay":[-32.52,-55.77],"uzbekistan":[41.38,64.59],
  "vanuatu":[-15.38,166.96],"vatican city":[41.90,12.45],"venezuela":[6.42,-66.59],"vietnam":[14.06,108.28],
  "yemen":[15.55,48.52],"zambia":[-13.13,27.85],"zimbabwe":[-19.02,29.15],
  // World Capitals
  "kabul":[34.53,69.17],"tirana":[41.33,19.82],"algiers":[36.74,3.06],"andorra la vella":[42.51,1.52],
  "luanda":[-8.84,13.23],"saint johns":[17.12,-61.85],"buenos aires":[-34.61,-58.38],
  "yerevan":[40.18,44.51],"canberra":[-35.28,149.13],"vienna":[48.21,16.37],"baku":[40.41,49.87],
  "nassau":[25.05,-77.35],"manama":[26.22,50.59],"dhaka":[23.72,90.41],"bridgetown":[13.10,-59.62],
  "minsk":[53.90,27.57],"brussels":[50.85,4.35],"belmopan":[17.25,-88.77],"porto-novo":[6.37,2.42],
  "thimphu":[27.47,89.64],"sucre":[-19.04,-65.26],"la paz":[-16.50,-68.15],"sarajevo":[43.85,18.36],
  "gaborone":[-24.65,25.91],"brasilia":[-15.78,-47.93],"bandar seri begawan":[4.94,114.95],
  "sofia":[42.70,23.32],"ouagadougou":[12.37,-1.53],"gitega":[-3.43,29.93],"phnom penh":[11.57,104.92],
  "yaounde":[3.87,11.52],"ottawa":[45.42,-75.69],"praia":[14.93,-23.51],"bangui":[4.36,18.56],
  "ndjamena":[12.11,15.04],"santiago":[-33.46,-70.65],"beijing":[39.91,116.39],"bogota":[4.71,-74.07],
  "moroni":[-11.70,43.26],"kinshasa":[-4.33,15.32],"brazzaville":[-4.27,15.28],"san jose":[9.93,-84.08],
  "zagreb":[45.81,15.98],"havana":[23.14,-82.36],"nicosia":[35.17,33.37],"prague":[50.08,14.44],
  "copenhagen":[55.68,12.57],"roseau":[15.30,-61.39],"santo domingo":[18.48,-69.90],
  "quito":[-0.23,-78.52],"cairo":[30.04,31.24],"san salvador":[13.69,-89.22],"malabo":[3.75,8.78],
  "asmara":[15.34,38.93],"tallinn":[59.44,24.75],"mbabane":[-26.32,31.14],"addis ababa":[9.03,38.74],
  "suva":[-18.14,178.44],"helsinki":[60.17,24.94],"paris":[48.86,2.35],"libreville":[0.40,9.45],
  "banjul":[13.45,-16.58],"tbilisi":[41.69,44.83],"berlin":[52.52,13.40],"accra":[5.56,-0.20],
  "athens":[37.98,23.73],"saint georges":[12.05,-61.75],"guatemala city":[14.64,-90.51],
  "conakry":[9.54,-13.68],"bissau":[11.86,-15.60],"georgetown":[6.80,-58.16],"port-au-prince":[18.54,-72.34],
  "tegucigalpa":[14.09,-87.21],"budapest":[47.50,19.04],"reykjavik":[64.13,-21.89],"new delhi":[28.61,77.21],
  "jakarta":[-6.21,106.85],"tehran":[35.69,51.39],"baghdad":[33.34,44.40],"dublin":[53.33,-6.25],
  "jerusalem":[31.78,35.22],"rome":[41.90,12.50],"yamoussoukro":[6.82,-5.27],"kingston":[17.99,-76.79],
  "tokyo":[35.69,139.69],"amman":[31.96,35.95],"astana":[51.18,71.45],"nairobi":[-1.29,36.82],
  "south tarawa":[1.33,172.98],"kuwait city":[29.37,47.98],"bishkek":[42.87,74.59],
  "vientiane":[17.97,102.62],"riga":[56.95,24.11],"beirut":[33.89,35.50],"maseru":[-29.32,27.48],
  "monrovia":[6.30,-10.80],"tripoli":[32.90,13.18],"vaduz":[47.14,9.52],"vilnius":[54.69,25.28],
  "luxembourg city":[49.61,6.13],"antananarivo":[-18.91,47.54],"lilongwe":[-13.97,33.79],
  "kuala lumpur":[3.14,101.69],"male":[4.18,73.51],"bamako":[12.65,-8.00],"valletta":[35.90,14.51],
  "majuro":[7.09,171.38],"nouakchott":[18.08,-15.97],"port louis":[-20.16,57.50],"mexico city":[19.43,-99.13],
  "palikir":[6.92,158.16],"chisinau":[47.01,28.86],"ulaanbaatar":[47.89,106.91],"podgorica":[42.44,19.26],
  "rabat":[34.02,-6.84],"maputo":[-25.97,32.59],"naypyidaw":[19.74,96.08],"windhoek":[-22.56,17.08],
  "kathmandu":[27.72,85.32],"amsterdam":[52.37,4.90],"managua":[12.13,-86.29],"niamey":[13.51,2.11],
  "abuja":[9.07,7.40],"oslo":[59.91,10.75],"muscat":[23.58,58.40],"islamabad":[33.72,73.04],
  "ngerulmud":[7.50,134.62],"ramallah":[31.90,35.21],"panama city":[8.99,-79.52],"port moresby":[-9.44,147.18],
  "asuncion":[-25.29,-57.65],"lima":[-12.05,-77.04],"manila":[14.60,120.98],"warsaw":[52.23,21.01],
  "lisbon":[38.72,-9.14],"doha":[25.29,51.53],"bucharest":[44.43,26.11],"moscow":[55.75,37.62],
  "kigali":[-1.95,30.06],"basseterre":[17.30,-62.72],"castries":[14.01,-60.99],"kingstown":[13.16,-61.23],
  "apia":[-13.83,-171.77],"san marino":[43.94,12.45],"sao tome":[0.34,6.73],"riyadh":[24.69,46.72],
  "dakar":[14.72,-17.47],"belgrade":[44.80,20.47],"victoria":[-4.62,55.45],"freetown":[8.49,-13.23],
  "singapore":[1.35,103.82],"bratislava":[48.15,17.11],"ljubljana":[46.05,14.51],"honiara":[-9.43,160.05],
  "mogadishu":[2.05,45.34],"pretoria":[-25.75,28.19],"cape town":[-33.93,18.42],"bloemfontein":[-29.12,26.21],
  "seoul":[37.57,126.98],"juba":[4.86,31.58],"madrid":[40.42,-3.70],
  "sri jayawardenepura kotte":[6.91,79.89],"khartoum":[15.55,32.53],"paramaribo":[5.87,-55.17],
  "stockholm":[59.33,18.07],"bern":[46.95,7.45],"damascus":[33.51,36.29],"taipei":[25.04,121.56],
  "dushanbe":[38.56,68.77],"dodoma":[-6.18,35.74],"bangkok":[13.75,100.52],"dili":[-8.56,125.58],
  "lome":[6.14,1.22],"nukualofa":[-21.14,-175.22],"port of spain":[10.65,-61.52],"tunis":[36.82,10.17],
  "ankara":[39.93,32.85],"ashgabat":[37.95,58.38],"funafuti":[-8.52,179.20],"kampala":[0.32,32.58],
  "kyiv":[50.45,30.52],"abu dhabi":[24.47,54.37],"london":[51.51,-0.13],"washington dc":[38.91,-77.02],
  "montevideo":[-34.90,-56.19],"tashkent":[41.30,69.24],"port vila":[-17.74,168.32],
  "vatican city":[41.90,12.45],"caracas":[10.48,-66.88],"hanoi":[21.03,105.85],"sanaa":[15.35,44.21],
  "lusaka":[-15.42,28.28],"harare":[-17.83,31.05],"pyongyang":[39.03,125.75],"skopje":[42.00,21.43],
  // Indian States
  "andhra pradesh":[15.91,79.74],"arunachal pradesh":[28.22,94.73],"assam":[26.24,92.54],
  "bihar":[25.09,85.31],"chhattisgarh":[21.30,81.87],"goa":[15.30,74.12],"gujarat":[22.26,71.19],
  "haryana":[29.06,76.09],"himachal pradesh":[31.10,77.17],"jharkhand":[23.61,85.28],
  "karnataka":[15.31,75.71],"kerala":[10.85,76.27],"madhya pradesh":[22.97,78.66],
  "maharashtra":[19.75,75.71],"manipur":[24.66,93.91],"meghalaya":[25.47,91.37],
  "mizoram":[23.16,92.94],"nagaland":[26.16,94.56],"odisha":[20.95,85.09],"punjab":[31.15,75.34],
  "rajasthan":[27.02,74.22],"sikkim":[27.53,88.51],"tamil nadu":[11.13,78.66],"telangana":[18.11,79.02],
  "tripura":[23.94,91.99],"uttar pradesh":[26.85,80.91],"uttarakhand":[30.07,79.02],"west bengal":[22.99,87.85],
  "andaman and nicobar islands":[11.74,92.66],"chandigarh":[30.74,76.79],
  "dadra and nagar haveli":[20.19,73.00],"daman and diu":[20.42,72.84],"delhi":[28.70,77.10],
  "jammu and kashmir":[33.78,76.58],"ladakh":[34.17,77.58],"lakshadweep":[10.57,72.64],"puducherry":[11.94,79.83],
  // Indian Cities
  "agartala":[23.83,91.28],"agra":[27.18,78.01],"ahmedabad":[23.03,72.59],"aizawl":[23.73,92.72],
  "ajmer":[26.45,74.64],"akola":[20.71,77.00],"aligarh":[27.88,78.07],"allahabad":[25.44,81.84],
  "alwar":[27.56,76.61],"ambala":[30.38,76.78],"amravati":[20.93,77.76],"amritsar":[31.63,74.87],
  "anantapur":[14.68,77.60],"aurangabad":[19.88,75.32],"ayodhya":[26.79,82.20],
  "bangalore":[12.97,77.59],"bengaluru":[12.97,77.59],"bareilly":[28.37,79.42],"belagavi":[15.85,74.50],
  "belgaum":[15.85,74.50],"bhilai":[21.21,81.43],"bhopal":[23.26,77.41],"bhubaneswar":[20.30,85.85],
  "bikaner":[28.02,73.31],"bilaspur":[22.08,82.14],"bokaro":[23.67,86.16],"brahmapur":[19.31,84.80],
  "burdwan":[23.23,87.86],"bardhaman":[23.23,87.86],"chennai":[13.08,80.27],"coimbatore":[11.00,76.96],
  "cuttack":[20.46,85.88],"dehradun":[30.32,78.03],"dhanbad":[23.80,86.44],"dibrugarh":[27.48,94.91],
  "durgapur":[23.55,87.32],"ernakulam":[9.98,76.30],"erode":[11.34,77.72],"faridabad":[28.41,77.31],
  "firozabad":[27.15,78.39],"gandhinagar":[23.22,72.65],"gangtok":[27.34,88.62],"gaya":[24.75,84.99],
  "ghaziabad":[28.67,77.45],"gorakhpur":[26.76,83.37],"gulbarga":[17.33,76.82],"kalaburagi":[17.33,76.82],
  "guntur":[16.30,80.44],"gurgaon":[28.46,77.03],"gurugram":[28.46,77.03],"guwahati":[26.19,91.75],
  "gwalior":[26.22,78.18],"haridwar":[29.95,78.16],"hubli":[15.36,75.12],"hubballi":[15.36,75.12],
  "hyderabad":[17.38,78.49],"imphal":[24.81,93.94],"indore":[22.72,75.86],"itanagar":[27.08,93.62],
  "jabalpur":[23.18,79.94],"jaipur":[26.91,75.79],"jalandhar":[31.33,75.58],"jalgaon":[21.01,75.57],
  "jammu":[32.73,74.87],"jamnagar":[22.47,70.06],"jamshedpur":[22.81,86.19],"jodhpur":[26.29,73.02],
  "jorhat":[26.76,94.20],"kakinada":[16.98,82.25],"kalyan":[19.24,73.13],"kanpur":[26.47,80.33],
  "karnal":[29.69,76.99],"kochi":[9.93,76.27],"kohima":[25.67,94.11],"kolhapur":[16.70,74.24],
  "kolkata":[22.57,88.36],"kollam":[8.89,76.61],"kozhikode":[11.25,75.78],"calicut":[11.25,75.78],
  "kurnool":[15.83,78.05],"leh":[34.15,77.58],"lucknow":[26.85,80.95],"ludhiana":[30.91,75.85],
  "madurai":[9.93,78.12],"mangalore":[12.87,74.88],"mangaluru":[12.87,74.88],"mathura":[27.49,77.67],
  "meerut":[28.98,77.71],"mumbai":[19.08,72.88],"murshidabad":[24.19,88.27],"mysore":[12.30,76.65],
  "mysuru":[12.30,76.65],"nagpur":[21.15,79.09],"nanded":[19.15,77.32],"nashik":[19.99,73.79],
  "navi mumbai":[19.04,73.02],"noida":[28.54,77.39],"ongole":[15.50,80.05],"panaji":[15.50,73.83],
  "patna":[25.60,85.13],"pondicherry":[11.94,79.83],"prayagraj":[25.44,81.84],"pune":[18.52,73.86],
  "raipur":[21.25,81.63],"rajkot":[22.30,70.80],"rajahmundry":[17.00,81.80],"ranchi":[23.34,85.31],
  "rohtak":[28.90,76.58],"salem":[11.66,78.15],"shillong":[25.58,91.89],"shimla":[31.10,77.17],
  "siliguri":[26.72,88.43],"solapur":[17.69,75.92],"srinagar":[34.09,74.80],"surat":[21.20,72.84],
  "thane":[19.18,72.97],"thiruvananthapuram":[8.52,76.94],"thrissur":[10.53,76.21],
  "tiruchirapalli":[10.79,78.70],"tirupati":[13.65,79.42],"tirunelveli":[8.73,77.70],
  "udaipur":[24.59,73.68],"ujjain":[23.18,75.77],"vadodara":[22.30,73.20],"varanasi":[25.32,83.01],
  "vijayawada":[16.51,80.62],"visakhapatnam":[17.69,83.22],"vellore":[12.92,79.13],
  "warangal":[18.00,79.59],"yamuna nagar":[30.12,77.27],"nellore":[14.44,79.99],
  "kakinada":[16.98,82.25],"kadapa":[14.47,78.82],"eluru":[16.71,81.09],"vizianagaram":[18.12,83.42],
  "silchar":[24.83,92.80],"tezpur":[26.63,92.80],"nagaon":[26.35,92.68],"jorhat":[26.76,94.20],
  "tinsukia":[27.49,95.36],"bhagalpur":[25.24,87.00],"muzaffarpur":[26.12,85.38],
  "purnia":[25.78,87.47],"darbhanga":[26.15,85.90],"katihar":[25.57,87.58],"samastipur":[25.87,85.78],
  "durg":[21.19,81.28],"korba":[22.36,82.68],"rajnandgaon":[21.10,81.02],"margao":[15.28,73.96],
  "bhavnagar":[21.76,72.15],"jamnagar":[22.47,70.06],"anand":[22.56,72.96],"nadiad":[22.69,72.86],
  "morbi":[22.82,70.84],"junagadh":[21.52,70.46],"navsari":[20.95,72.93],"surendranagar":[22.73,71.65],
  "ambala":[30.38,76.78],"karnal":[29.69,76.99],"hisar":[29.15,75.72],"panipat":[29.39,76.97],
  "sonipat":[28.99,77.02],"yamunanagar":[30.12,77.27],"rewari":[28.19,76.62],"bhiwani":[28.80,76.14],
  "dharamsala":[32.22,76.32],"solan":[30.91,77.09],"mandi":[31.71,76.93],"kullu":[31.96,77.10],"manali":[32.27,77.18],
  "hazaribagh":[23.99,85.37],"deoghar":[24.49,86.70],"davangere":[14.46,75.92],"ballari":[15.15,76.92],
  "bellary":[15.15,76.92],"shivamogga":[13.93,75.57],"shimoga":[13.93,75.57],"tumkur":[13.34,77.10],
  "bidar":[17.91,77.52],"raichur":[16.21,77.36],"hospet":[15.27,76.39],"hassan":[13.00,76.10],
  "udupi":[13.34,74.75],"dharwad":[15.46,75.02],"chikmagalur":[13.32,75.77],"mandya":[12.52,76.90],
  "bagalkot":[16.18,75.70],"gadag":[15.42,75.62],"chitradurga":[14.23,76.40],"bijapur":[16.83,75.72],
  "vijayapura":[16.83,75.72],"kolar":[13.14,78.13],"ramanagara":[12.72,77.28],"chikkaballapur":[13.43,77.73],
  "kannur":[11.87,75.37],"alappuzha":[9.49,76.33],"alleppey":[9.49,76.33],"palakkad":[10.78,76.65],
  "malappuram":[11.07,76.07],"kottayam":[9.59,76.52],"kasaragod":[12.50,74.99],"pathanamthitta":[9.27,76.79],
  "thalassery":[11.75,75.49],"sagar":[23.83,78.74],"rewa":[24.53,81.30],"satna":[24.57,80.83],
  "dewas":[22.97,76.06],"ratlam":[23.33,75.04],"burhanpur":[21.31,76.23],"khandwa":[21.83,76.35],
  "chhindwara":[22.06,78.94],"morena":[26.50,77.99],"bhind":[26.56,78.78],"vidisha":[23.53,77.81],
  "mandsaur":[24.07,75.07],"ahmednagar":[19.10,74.74],"chandrapur":[19.96,79.30],"parbhani":[19.27,76.78],
  "ichalkaranji":[16.70,74.46],"jalna":[19.84,75.88],"ambernath":[19.20,73.19],"bhiwandi":[19.30,73.06],
  "ulhasnagar":[19.22,73.16],"rourkela":[22.25,84.87],"sambalpur":[21.47,83.97],"puri":[19.81,85.83],
  "balasore":[21.49,86.93],"baripada":[21.93,86.73],"bhadrak":[21.06,86.52],"jharsuguda":[21.86,84.01],
  "patiala":[30.34,76.40],"bathinda":[30.21,74.95],"mohali":[30.70,76.72],"pathankot":[32.27,75.65],
  "hoshiarpur":[31.53,75.91],"moga":[30.82,75.18],"firozpur":[30.92,74.61],"gurdaspur":[32.04,75.41],
  "rupnagar":[30.96,76.53],"sangrur":[30.25,75.85],"bhilwara":[25.35,74.64],"bharatpur":[27.22,77.49],
  "sikar":[27.61,75.14],"pali":[25.77,73.33],"barmer":[25.75,71.40],"sri ganganagar":[29.91,73.88],
  "jhunjhunu":[28.13,75.40],"nagaur":[27.20,73.74],"chittorgarh":[24.89,74.63],"tonk":[26.17,75.79],
  "bundi":[25.44,75.64],"sawai madhopur":[26.02,76.36],"hanumangarh":[29.58,74.33],
  "tiruppur":[11.10,77.34],"thoothukudi":[8.76,78.13],"dindigul":[10.37,77.97],"thanjavur":[10.79,79.14],
  "ranipet":[12.92,79.33],"sivakasi":[9.46,77.80],"karur":[10.96,78.08],"ooty":[11.41,76.70],
  "udhagamandalam":[11.41,76.70],"nagercoil":[8.18,77.43],"kumbakonam":[10.97,79.42],
  "hosur":[12.74,77.83],"cuddalore":[11.75,79.77],"villupuram":[11.94,79.49],"kanchipuram":[12.84,79.70],
  "nagapattinam":[10.77,79.84],"warangal":[18.00,79.59],"nizamabad":[18.67,78.10],"karimnagar":[18.43,79.13],
  "khammam":[17.25,80.15],"ramagundam":[18.76,79.47],"mancherial":[18.87,79.46],"adilabad":[19.66,78.53],
  "nalgonda":[17.05,79.27],"suryapet":[17.14,79.62],"mahabubnagar":[16.74,77.98],"miryalaguda":[16.87,79.57],
  "moradabad":[28.84,78.78],"saharanpur":[29.97,77.55],"firozabad":[27.15,78.39],"muzaffarnagar":[29.47,77.71],
  "ghazipur":[25.58,83.57],"jhansi":[25.45,78.57],"shahjahanpur":[27.88,79.91],"rampur":[28.80,79.02],
  "sitapur":[27.56,80.68],"hapur":[28.73,77.78],"sambhal":[28.60,78.57],"amroha":[28.90,78.46],
  "bulandshahr":[28.41,77.85],"etawah":[26.78,79.02],"fatehpur":[25.93,80.81],"banda":[25.48,80.34],
  "lakhimpur":[27.95,80.78],"bahraich":[27.57,81.60],"ballia":[25.76,84.15],"sultanpur":[26.26,82.07],
  "faizabad":[26.77,82.14],"roorkee":[29.87,77.89],"haldwani":[29.22,79.52],"kashipur":[29.21,78.96],
  "rudrapur":[28.98,79.40],"rishikesh":[30.09,78.27],"nainital":[29.38,79.46],
  "asansol":[23.68,86.98],"howrah":[22.59,88.31],"malda":[25.01,88.14],"berhampore":[24.10,88.25],
  "kharagpur":[22.35,87.32],"haldia":[22.03,88.08],"kalyani":[22.98,88.44],"krishnanagar":[23.40,88.50],
  "jalpaiguri":[26.54,88.72],"cooch behar":[26.33,89.44],"purulia":[23.33,86.37],"bankura":[23.23,87.07],
  "midnapore":[22.43,87.32],"medinipur":[22.43,87.32],"raiganj":[25.62,88.12],"islampur":[26.27,88.20],
  "balurghat":[25.22,88.77],"naharlagun":[27.10,93.69],"tawang":[27.59,91.86],"dimapur":[25.91,93.73],
  "vadodara":[22.30,73.20],"nellore":[14.44,79.99],"berhampur":[19.31,84.80],
  // US States
  "alabama":[32.31,-86.90],"alaska":[64.20,-153.37],"arizona":[34.05,-111.09],"arkansas":[34.80,-92.20],
  "california":[36.78,-119.42],"colorado":[39.55,-105.78],"connecticut":[41.60,-72.69],
  "delaware":[39.16,-75.51],"florida":[27.99,-81.76],"georgia":[32.16,-82.90],"hawaii":[19.90,-155.58],
  "idaho":[44.07,-114.74],"illinois":[40.35,-88.99],"indiana":[39.85,-86.26],"iowa":[42.01,-93.21],
  "kansas":[38.53,-96.73],"kentucky":[37.67,-84.67],"louisiana":[31.17,-91.87],"maine":[44.69,-69.38],
  "maryland":[39.05,-76.64],"massachusetts":[42.41,-71.38],"michigan":[44.18,-84.51],
  "minnesota":[46.39,-94.64],"mississippi":[32.74,-89.68],"missouri":[38.46,-92.29],
  "montana":[46.88,-110.36],"nebraska":[41.49,-99.90],"nevada":[38.80,-116.42],
  "new hampshire":[43.19,-71.57],"new jersey":[40.06,-74.41],"new mexico":[34.31,-106.02],
  "new york":[42.17,-74.95],"north carolina":[35.63,-79.81],"north dakota":[47.53,-99.78],
  "ohio":[40.39,-82.76],"oklahoma":[35.57,-96.93],"oregon":[44.57,-122.07],"pennsylvania":[40.59,-77.21],
  "rhode island":[41.68,-71.51],"south carolina":[33.86,-80.95],"south dakota":[44.37,-100.35],
  "tennessee":[35.86,-86.66],"texas":[31.97,-99.90],"utah":[39.32,-111.09],"vermont":[44.05,-72.71],
  "virginia":[37.77,-78.17],"washington":[47.40,-121.49],"west virginia":[38.49,-80.95],
  "wisconsin":[44.27,-89.62],"wyoming":[42.76,-107.30],
  // Australian States
  "australian capital territory":[-35.47,149.01],"new south wales":[-31.25,146.92],
  "northern territory":[-19.49,132.55],"queensland":[-22.58,144.08],"south australia":[-30.00,136.21],
  "tasmania":[-42.02,146.59],"victoria":[-36.85,144.28],"western australia":[-27.67,121.63],
  // Canadian Provinces
  "alberta":[53.93,-116.58],"british columbia":[53.73,-127.65],"manitoba":[53.76,-98.81],
  "new brunswick":[46.56,-66.46],"newfoundland":[53.14,-57.66],"northwest territories":[64.82,-124.85],
  "nova scotia":[44.68,-63.74],"nunavut":[70.30,-83.11],"ontario":[51.25,-85.32],
  "prince edward island":[46.51,-63.42],"quebec":[52.94,-73.55],"saskatchewan":[52.94,-106.45],
  "yukon":[64.28,-135.00],
  // Chinese Provinces
  "anhui":[31.86,117.28],"fujian":[26.10,118.30],"gansu":[37.86,101.68],"guangdong":[23.16,113.23],
  "guizhou":[26.84,107.29],"hainan":[19.20,109.74],"hebei":[38.04,114.51],"heilongjiang":[47.86,127.75],
  "henan":[33.88,113.49],"hubei":[30.97,112.27],"hunan":[27.62,112.01],"inner mongolia":[44.09,113.95],
  "jiangsu":[32.97,119.46],"jiangxi":[27.09,114.92],"jilin":[43.84,126.55],"liaoning":[41.30,122.60],
  "ningxia":[37.20,106.16],"qinghai":[35.72,96.41],"shaanxi":[35.20,108.93],"shandong":[36.67,118.00],
  "shanxi":[37.87,112.56],"sichuan":[30.65,102.64],"tibet":[31.69,88.09],"xinjiang":[40.17,85.61],
  "yunnan":[24.47,101.35],"zhejiang":[29.18,120.10],"chongqing":[29.56,106.55],
  // Major World Cities
  "barcelona":[41.39,2.16],"bilbao":[43.26,-2.93],"seville":[37.39,-5.99],"valencia":[39.47,-0.38],
  "zaragoza":[41.65,-0.89],"malaga":[36.72,-4.42],"milan":[45.46,9.19],"naples":[40.84,14.25],
  "turin":[45.07,7.69],"palermo":[38.11,13.36],"genoa":[44.41,8.93],"bologna":[44.49,11.34],
  "florence":[43.77,11.25],"marseille":[43.30,5.37],"lyon":[45.75,4.85],"toulouse":[43.60,1.44],
  "nice":[43.71,7.26],"bordeaux":[44.84,-0.58],"nantes":[47.22,-1.55],"strasbourg":[48.57,7.75],
  "hamburg":[53.55,10.00],"munich":[48.14,11.58],"cologne":[50.94,6.96],"frankfurt":[50.11,8.68],
  "stuttgart":[48.78,9.18],"dusseldorf":[51.23,6.79],"dortmund":[51.51,7.47],"essen":[51.46,7.01],
  "leipzig":[51.34,12.38],"bremen":[53.08,8.80],"dresden":[51.05,13.74],"hanover":[52.38,9.73],
  "nuremberg":[49.45,11.08],"rotterdam":[51.92,4.48],"utrecht":[52.09,5.12],"eindhoven":[51.44,5.48],
  "antwerp":[51.22,4.40],"ghent":[51.05,3.72],"bruges":[51.21,3.22],"krakow":[50.06,19.94],
  "lodz":[51.76,19.46],"wroclaw":[51.11,17.04],"poznan":[52.41,16.93],"gdansk":[54.35,18.65],
  "gdynia":[54.52,18.54],"katowice":[50.26,19.02],"brno":[49.19,16.61],"debrecen":[47.53,21.63],
  "miskolc":[48.10,20.79],"kosice":[48.72,21.26],"maribor":[46.55,15.65],"split":[43.51,16.44],
  "rijeka":[45.33,14.44],"cluj-napoca":[46.77,23.59],"timisoara":[45.75,21.23],"iasi":[47.16,27.59],
  "constanta":[44.18,28.65],"plovdiv":[42.14,24.75],"varna":[43.22,27.92],"thessaloniki":[40.64,22.94],
  "piraeus":[37.94,23.65],"gothenburg":[57.71,11.97],"malmo":[55.61,13.00],"bergen":[60.39,5.32],
  "stavanger":[58.97,5.73],"trondheim":[63.43,10.39],"aarhus":[56.16,10.21],"tampere":[61.50,23.77],
  "turku":[60.45,22.27],"cork":[51.90,-8.47],"belfast":[54.60,-5.93],"edinburgh":[55.95,-3.19],
  "glasgow":[55.86,-4.25],"manchester":[53.48,-2.24],"birmingham":[52.49,-1.90],"liverpool":[53.41,-2.98],
  "leeds":[53.80,-1.55],"sheffield":[53.38,-1.47],"bristol":[51.45,-2.59],"nottingham":[52.95,-1.15],
  "leicester":[52.64,-1.13],"zurich":[47.37,8.54],"geneva":[46.20,6.14],"basel":[47.56,7.59],
  "lausanne":[46.52,6.63],"kharkiv":[49.99,36.23],"odessa":[46.48,30.73],"dnipro":[48.46,35.04],
  "donetsk":[48.02,37.81],"lviv":[49.84,24.03],"zaporizhzhia":[47.84,35.14],
  "saint petersburg":[59.95,30.32],"novosibirsk":[54.99,82.90],"yekaterinburg":[56.84,60.61],
  "nizhny novgorod":[56.33,44.00],"samara":[53.20,50.15],"kazan":[55.79,49.11],
  "chelyabinsk":[55.16,61.40],"omsk":[54.99,73.37],"rostov-on-don":[47.23,39.72],"ufa":[54.74,55.97],
  "krasnoyarsk":[56.02,92.87],"perm":[58.01,56.23],"voronezh":[51.67,39.18],"volgograd":[48.71,44.51],
  "saratov":[51.53,46.03],"tolyatti":[53.51,49.42],"krasnodar":[45.04,38.98],"irkutsk":[52.29,104.30],
  "dubai":[25.20,55.27],"sharjah":[25.34,55.39],"jeddah":[21.49,39.19],"mecca":[21.39,39.86],
  "medina":[24.47,39.61],"dammam":[26.43,50.09],"tel aviv":[32.08,34.78],"haifa":[32.82,34.99],
  "beersheba":[31.24,34.79],"aleppo":[36.20,37.16],"mosul":[36.34,43.13],"basra":[30.51,47.82],
  "kirkuk":[35.47,44.39],"tabriz":[38.08,46.29],"isfahan":[32.66,51.68],"mashhad":[36.30,59.60],
  "shiraz":[29.59,52.58],"erbil":[36.19,44.01],"shanghai":[31.23,121.47],"guangzhou":[23.13,113.26],
  "shenzhen":[22.54,114.06],"tianjin":[39.13,117.18],"wuhan":[30.59,114.31],"chengdu":[30.57,104.07],
  "nanjing":[32.06,118.80],"shenyang":[41.80,123.43],"xian":[34.27,108.95],"harbin":[45.76,126.64],
  "changsha":[28.23,112.94],"zhengzhou":[34.75,113.62],"qingdao":[36.07,120.37],"hefei":[31.86,117.28],
  "jinan":[36.67,117.00],"dalian":[38.91,121.62],"suzhou":[31.30,120.62],"hangzhou":[30.25,120.15],
  "wuxi":[31.57,120.30],"osaka":[34.69,135.50],"yokohama":[35.44,139.64],"nagoya":[35.18,136.91],
  "sapporo":[43.06,141.35],"kobe":[34.69,135.20],"kyoto":[35.01,135.77],"fukuoka":[33.60,130.42],
  "kawasaki":[35.53,139.70],"hiroshima":[34.39,132.45],"sendai":[38.27,140.87],"kitakyushu":[33.88,130.88],
  "busan":[35.10,129.03],"incheon":[37.46,126.71],"daegu":[35.87,128.60],"daejeon":[36.35,127.38],
  "gwangju":[35.15,126.92],"ulsan":[35.54,129.32],"suwon":[37.27,127.01],"hong kong":[22.32,114.17],
  "macau":[22.19,113.55],"taichung":[24.15,120.68],"kaohsiung":[22.62,120.31],"tainan":[23.00,120.21],
  "ho chi minh city":[10.82,106.63],"da nang":[16.07,108.22],"hue":[16.46,107.60],
  "can tho":[10.04,105.79],"hai phong":[20.86,106.68],"siem reap":[13.36,103.86],
  "luang prabang":[19.89,102.14],"chiang mai":[18.79,98.99],"pattaya":[12.93,100.88],"phuket":[7.89,98.40],
  "cebu":[10.32,123.90],"davao":[7.07,125.61],"quezon city":[14.68,121.04],"makati":[14.55,121.02],
  "surabaya":[-7.25,112.75],"bandung":[-6.92,107.61],"medan":[3.59,98.67],"semarang":[-6.97,110.42],
  "makassar":[-5.14,119.43],"palembang":[-2.99,104.76],"johor bahru":[1.46,103.74],"penang":[5.41,100.34],
  "ipoh":[4.60,101.08],"kota kinabalu":[5.98,116.07],"kuching":[1.55,110.34],
  "mandalay":[21.97,96.08],"yangon":[16.87,96.19],"lahore":[31.55,74.35],"karachi":[24.86,67.01],
  "rawalpindi":[33.60,73.04],"faisalabad":[31.42,73.08],"multan":[30.20,71.47],"peshawar":[34.01,71.57],
  "quetta":[30.19,67.01],"gujranwala":[32.16,74.19],"sialkot":[32.49,74.54],"bahawalpur":[29.39,71.69],
  "sargodha":[32.08,72.67],"sukkur":[27.71,68.86],"chittagong":[22.34,91.83],"narayanganj":[23.62,90.50],
  "rajshahi":[24.37,88.60],"khulna":[22.84,89.54],"sylhet":[24.90,91.87],"comilla":[23.46,91.19],
  "mymensingh":[24.75,90.41],"gazipur":[23.99,90.42],"rangpur":[25.74,89.28],"colombo":[6.93,79.85],
  "kandy":[7.29,80.63],"galle":[6.03,80.22],"jaffna":[9.67,80.01],"pokhara":[28.21,83.99],
  "lalitpur":[27.67,85.32],"new york":[40.71,-74.01],"los angeles":[34.05,-118.24],
  "chicago":[41.88,-87.63],"houston":[29.76,-95.37],"phoenix":[33.45,-112.07],"philadelphia":[39.95,-75.17],
  "san antonio":[29.42,-98.49],"san diego":[32.72,-117.16],"dallas":[32.78,-96.80],"san jose":[37.34,-121.89],
  "austin":[30.27,-97.74],"jacksonville":[30.33,-81.66],"san francisco":[37.77,-122.42],
  "columbus":[39.96,-82.99],"charlotte":[35.23,-80.84],"indianapolis":[39.77,-86.16],
  "seattle":[47.61,-122.33],"denver":[39.74,-104.98],"nashville":[36.17,-86.78],
  "oklahoma city":[35.47,-97.52],"el paso":[31.76,-106.49],"boston":[42.36,-71.06],
  "portland":[45.52,-122.68],"las vegas":[36.17,-115.14],"memphis":[35.15,-90.05],
  "louisville":[38.25,-85.76],"baltimore":[39.29,-76.61],"milwaukee":[43.04,-87.91],
  "albuquerque":[35.08,-106.65],"tucson":[32.22,-110.97],"fresno":[36.74,-119.79],
  "sacramento":[38.58,-121.49],"mesa":[33.42,-111.74],"omaha":[41.26,-95.94],"cleveland":[41.50,-81.69],
  "raleigh":[35.77,-78.64],"toronto":[43.65,-79.38],"montreal":[45.50,-73.57],"vancouver":[49.25,-123.12],
  "calgary":[51.05,-114.07],"edmonton":[53.55,-113.47],"winnipeg":[49.90,-97.14],
  "sao paulo":[-23.55,-46.63],"rio de janeiro":[-22.91,-43.17],"salvador":[-12.97,-38.50],
  "fortaleza":[-3.72,-38.54],"belo horizonte":[-19.92,-43.94],"manaus":[-3.10,-60.02],
  "curitiba":[-25.43,-49.27],"recife":[-8.05,-34.88],"porto alegre":[-30.03,-51.23],"belem":[-1.46,-48.50],
  "cordoba":[-31.42,-64.19],"rosario":[-32.95,-60.64],"mendoza":[-32.89,-68.84],"la plata":[-34.92,-57.95],
  "guadalajara":[20.68,-103.35],"monterrey":[25.68,-100.32],"puebla":[19.04,-98.20],"tijuana":[32.52,-117.04],
  "leon":[21.12,-101.68],"juarez":[31.74,-106.49],"merida":[20.97,-89.62],"medellin":[6.24,-75.58],
  "cali":[3.44,-76.52],"barranquilla":[11.00,-74.81],"cartagena":[10.40,-75.51],
  "arequipa":[-16.41,-71.54],"trujillo":[-8.11,-79.03],"chiclayo":[-6.77,-79.84],
  "guayaquil":[-2.19,-79.89],"maracaibo":[10.73,-71.64],"barquisimeto":[10.07,-69.32],
  "san juan":[18.46,-66.11],"lagos":[6.46,3.39],"ibadan":[7.38,3.90],"kano":[12.00,8.52],
  "kaduna":[10.52,7.44],"benin city":[6.34,5.63],"port harcourt":[4.82,7.04],"maiduguri":[11.85,13.16],
  "zaria":[11.07,7.72],"aba":[5.11,7.37],"jos":[9.92,8.89],"ilorin":[8.50,4.55],"oyo":[7.85,3.93],
  "enugu":[6.45,7.51],"abeokuta":[7.16,3.35],"giza":[30.01,31.21],"luxor":[25.69,32.64],
  "aswan":[24.09,32.91],"fez":[34.04,-5.00],"marrakesh":[31.63,-8.00],"tangier":[35.77,-5.80],
  "agadir":[30.43,-9.60],"sfax":[34.74,10.76],"sousse":[35.83,10.64],"oran":[35.70,-0.63],
  "constantine":[36.36,6.61],"annaba":[36.90,7.77],"benghazi":[32.12,20.07],"durban":[-29.86,31.02],
  "port elizabeth":[-33.92,25.57],"east london":[-33.02,27.91],"polokwane":[-23.90,29.45],
  "nelspruit":[-25.47,30.97],"mombasa":[-4.05,39.67],"kisumu":[-0.10,34.76],"nakuru":[-0.30,36.07],
  "mwanza":[-2.52,32.90],"arusha":[-3.37,36.68],"zanzibar":[-6.17,39.19],"dire dawa":[9.59,41.86],
  "gondar":[12.60,37.47],"mekelle":[13.50,39.47],"kumasi":[6.69,-1.62],"tamale":[9.40,-0.84],
  "bouake":[7.69,-5.03],"touba":[14.85,-15.89],"thies":[14.79,-16.93],"omdurman":[15.65,32.48],
  "port sudan":[19.62,37.22],"gulu":[2.78,32.30],"jinja":[0.44,33.20],"mbarara":[-0.61,30.65],
  "butare":[-2.60,29.74],"mutare":[-18.97,32.65],"gweru":[-19.45,29.82],"ndola":[-12.96,28.64],
  "kitwe":[-12.82,28.22],"livingstone":[-17.85,25.87],"huambo":[-12.78,15.74],"lobito":[-12.37,13.54],
  "lubumbashi":[-11.68,27.47],"mbuji-mayi":[-6.15,23.60],"goma":[-1.68,29.22],"toamasina":[-18.15,49.40],
  "beira":[-19.84,34.84],"nampula":[-15.12,39.27],"walvis bay":[-22.96,14.51],"francistown":[-21.17,27.51],
  "hargeisa":[9.56,44.07],"douala":[4.05,9.72],"kumasi":[6.69,-1.62],"lome":[6.14,1.22],
  "mbabane":[-26.32,31.14],"blantyre":[-15.79,35.00],"sydney":[-33.87,151.21],"melbourne":[-37.81,144.96],
  "brisbane":[-27.47,153.03],"perth":[-31.95,115.86],"adelaide":[-34.93,138.60],"gold coast":[-28.00,153.43],
  "newcastle":[-32.93,151.78],"wollongong":[-34.42,150.90],"hobart":[-42.88,147.33],"darwin":[-12.46,130.84],
  "auckland":[-36.85,174.76],"christchurch":[-43.53,172.64],"hamilton":[-37.79,175.28],
  "tauranga":[-37.69,176.17],"dunedin":[-45.87,170.50],
};

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function getCoords(word) {
  return COORDS[stripAccents(word)] ?? null;
}

function formatDistance(km) {
  if (km >= 1000) return (km / 1000).toFixed(1) + "k km";
  return km.toLocaleString() + " km";
}

// ── Distance Summary Component ────────────────────────────────────────────────
function DistanceSummary({ chain }) {
  const points = chain
    .map(item => ({ ...item, coords: getCoords(item.word) }))
    .filter(item => item.coords);

  let totalKm = 0;
  for (let i = 1; i < points.length; i++) {
    totalKm += haversine(points[i-1].coords, points[i].coords);
  }

  if (totalKm === 0) return null;

  const earthCircumference = 40075;
  const moonDistance = 384400;
  const earthsAround = (totalKm / earthCircumference).toFixed(2);
  const moonPercent = (totalKm / moonDistance * 100).toFixed(1);

  // Full number with commas, no abbreviation
  const fullKm = totalKm.toLocaleString("en-IN");

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>

      {/* Main distance block */}
      <div style={{
        background: "rgba(201,168,76,0.06)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "14px 14px 0 0",
        padding: "28px 28px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>
          Total Distance Travelled
        </div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 7vw, 48px)",
          fontWeight: 900,
          color: "#c9a84c",
          lineHeight: 1,
          letterSpacing: "-1px",
          textShadow: "0 0 40px rgba(201,168,76,0.3)",
        }}>
          {fullKm}
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8, letterSpacing: 2 }}>
          kilometres
        </div>
      </div>

      {/* Comparison stats — two columns, no border between top and bottom */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        <div style={{
          background: "var(--navy3)",
          border: "1px solid rgba(201,168,76,0.12)",
          borderTop: "none", borderRight: "none",
          borderRadius: "0 0 0 14px",
          padding: "20px 16px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>
            Earth's circumference
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(26px, 5vw, 40px)",
            fontWeight: 900,
            color: "#e2d9c8",
            lineHeight: 1,
            letterSpacing: "-1px",
          }}>
            {earthsAround}<span style={{ fontSize: "0.5em", color: "#6b7280", fontWeight: 400, marginLeft: 3 }}>×</span>
          </div>
        </div>
        <div style={{
          background: "var(--navy3)",
          border: "1px solid rgba(201,168,76,0.12)",
          borderTop: "none", borderLeft: "none",
          borderRadius: "0 0 14px 0",
          padding: "20px 16px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>
            Way to the Moon
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(26px, 5vw, 40px)",
            fontWeight: 900,
            color: "#e2d9c8",
            lineHeight: 1,
            letterSpacing: "-1px",
          }}>
            {moonPercent}<span style={{ fontSize: "0.5em", color: "#6b7280", fontWeight: 400, marginLeft: 3 }}>%</span>
          </div>
        </div>
      </div>

    </div>
  );
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
            {chain.length > 0 && <DistanceSummary chain={chain} />}

            {chain.length > 0 && (
              <div className="card" style={{padding:20}}>
                <div className="card-title" style={{fontSize:14,marginBottom:12}}>
                  📋 Full Chain — {chain.length} places
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
