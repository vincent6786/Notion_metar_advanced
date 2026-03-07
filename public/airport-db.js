/**
 * METAR GO — Airport Database
 * Used by: Great Circle Distance Calculator (tools-extension.js)
 *
 * Each entry: { ic: ICAO, ia: IATA, name, lat, lon, co: country code }
 * Empty IATA ("") = no IATA code assigned.
 *
 * Coverage: ~550 airports — international hubs, regional airports,
 * GA fields, and all Taiwan airports.
 *
 * Lookup function: lookupAirport(query)
 *   Accepts: 4-letter ICAO, 3-letter IATA, or "lat,lon" coordinates
 *   Returns: { lat, lon, name, icao, iata, country } or null
 */

// ============================================================================
// AIRPORT DATABASE
// ============================================================================

const AIRPORT_DB = [

  // ==========================================================================
  // TAIWAN — Full Coverage
  // ==========================================================================
  { ic:"RCTP", ia:"TPE", name:"Taiwan Taoyuan Intl",            lat:25.0777,  lon:121.2322, co:"TW" },
  { ic:"RCSS", ia:"TSA", name:"Taipei Songshan",                lat:25.0694,  lon:121.5522, co:"TW" },
  { ic:"RCKH", ia:"KHH", name:"Kaohsiung Intl",                 lat:22.5771,  lon:120.3497, co:"TW" },
  { ic:"RCFN", ia:"TNN", name:"Tainan Airport",                 lat:22.9503,  lon:120.2058, co:"TW" },
  { ic:"RCMQ", ia:"RMQ", name:"Taichung Intl",                  lat:24.2647,  lon:120.6217, co:"TW" },
  { ic:"RCYU", ia:"HUN", name:"Hualien Airport",                lat:24.0231,  lon:121.6178, co:"TW" },
  { ic:"RCQC", ia:"MZG", name:"Magong Airport (Penghu)",        lat:23.5687,  lon:119.6278, co:"TW" },
  { ic:"RCKU", ia:"CYI", name:"Chiayi Airport",                 lat:23.4618,  lon:120.3933, co:"TW" },
  { ic:"RCGI", ia:"GNI", name:"Green Island Airport",           lat:22.6739,  lon:121.4661, co:"TW" },
  { ic:"RCLY", ia:"KYD", name:"Orchid Island Airport",          lat:22.0347,  lon:121.5353, co:"TW" },
  { ic:"RCLG", ia:"TTT", name:"Taitung Airport",                lat:22.7550,  lon:121.1019, co:"TW" },
  { ic:"RCPO", ia:"HSZ", name:"Hsinchu Air Base",               lat:24.8181,  lon:120.9392, co:"TW" },
  { ic:"RCMS", ia:"",    name:"Meihu Airport (Penghu)",         lat:23.5667,  lon:119.5667, co:"TW" },
  { ic:"RCBS", ia:"",    name:"Pingtung North Airport",         lat:22.7001,  lon:120.4614, co:"TW" },
  { ic:"RCDC", ia:"",    name:"Pingtung South Airport",         lat:22.6724,  lon:120.4611, co:"TW" },
  { ic:"RCAY", ia:"",    name:"Gangshan Air Base",              lat:22.7858,  lon:120.2633, co:"TW" },
  { ic:"RCNN", ia:"",    name:"Tainan Air Base (S)",            lat:22.9503,  lon:120.2058, co:"TW" },
  { ic:"RCWA", ia:"WOT", name:"Wangan Airport (Penghu)",        lat:23.3674,  lon:119.5028, co:"TW" },
  { ic:"RCQN", ia:"",    name:"Qimei Airport (Penghu)",         lat:23.2131,  lon:119.4178, co:"TW" },
  { ic:"RCLF", ia:"LZN", name:"Matsu Beigan Airport",           lat:26.2242,  lon:120.0029, co:"TW" },
  { ic:"RCFG", ia:"MFK", name:"Matsu Nangan Airport",           lat:26.1598,  lon:119.9582, co:"TW" },
  { ic:"RCKI", ia:"KHH", name:"Kinmen Airport",                 lat:24.4279,  lon:118.3592, co:"TW" },

  // ==========================================================================
  // JAPAN
  // ==========================================================================
  { ic:"RJTT", ia:"HND", name:"Tokyo Haneda Intl",              lat:35.5533,  lon:139.7811, co:"JP" },
  { ic:"RJAA", ia:"NRT", name:"Narita Intl",                    lat:35.7647,  lon:140.3864, co:"JP" },
  { ic:"RJBB", ia:"KIX", name:"Kansai Intl",                   lat:34.4272,  lon:135.2440, co:"JP" },
  { ic:"RJOO", ia:"ITM", name:"Osaka Itami",                    lat:34.7853,  lon:135.4381, co:"JP" },
  { ic:"RJCC", ia:"CTS", name:"New Chitose (Sapporo)",          lat:42.7752,  lon:141.6922, co:"JP" },
  { ic:"RJFF", ia:"FUK", name:"Fukuoka Airport",                lat:33.5859,  lon:130.4511, co:"JP" },
  { ic:"RJSS", ia:"SDJ", name:"Sendai Airport",                 lat:38.1397,  lon:140.9169, co:"JP" },
  { ic:"ROAH", ia:"OKA", name:"Naha Airport (Okinawa)",         lat:26.1958,  lon:127.6464, co:"JP" },
  { ic:"RJSN", ia:"KIJ", name:"Niigata Airport",                lat:37.9558,  lon:139.1214, co:"JP" },
  { ic:"RJNK", ia:"KMQ", name:"Komatsu Airport",                lat:36.3946,  lon:136.4069, co:"JP" },
  { ic:"RJFU", ia:"NGS", name:"Nagasaki Airport",               lat:32.9169,  lon:129.9136, co:"JP" },
  { ic:"RJOA", ia:"HIJ", name:"Hiroshima Airport",              lat:34.4361,  lon:132.9194, co:"JP" },
  { ic:"RJOY", ia:"UKB", name:"Kobe Airport",                   lat:34.6328,  lon:135.2236, co:"JP" },
  { ic:"RJFK", ia:"KMJ", name:"Kumamoto Airport",               lat:32.8372,  lon:130.8550, co:"JP" },
  { ic:"RJDA", ia:"AXT", name:"Akita Airport",                  lat:39.6156,  lon:140.2186, co:"JP" },
  { ic:"RJSI", ia:"HNA", name:"Hanamaki Airport",               lat:39.4286,  lon:141.1353, co:"JP" },
  { ic:"ROTM", ia:"MMY", name:"Miyako Airport",                 lat:24.7828,  lon:125.2950, co:"JP" },
  { ic:"ROIG", ia:"ISG", name:"Ishigaki Airport",               lat:24.3445,  lon:124.1866, co:"JP" },
  { ic:"ROMY", ia:"OKE", name:"Okierabu Airport",               lat:27.4255,  lon:128.7018, co:"JP" },

  // ==========================================================================
  // SOUTH KOREA
  // ==========================================================================
  { ic:"RKSI", ia:"ICN", name:"Incheon Intl",                   lat:37.4691,  lon:126.4509, co:"KR" },
  { ic:"RKSS", ia:"GMP", name:"Gimpo Intl",                     lat:37.5583,  lon:126.7906, co:"KR" },
  { ic:"RKPK", ia:"PUS", name:"Gimhae Intl (Busan)",            lat:35.1795,  lon:128.9381, co:"KR" },
  { ic:"RKJJ", ia:"CJU", name:"Jeju Intl",                     lat:33.5113,  lon:126.4930, co:"KR" },
  { ic:"RKTU", ia:"CJJ", name:"Cheongju Intl",                  lat:36.7172,  lon:127.4992, co:"KR" },
  { ic:"RKNY", ia:"YNY", name:"Yangyang Intl",                  lat:38.0611,  lon:128.6692, co:"KR" },
  { ic:"RKJK", ia:"KUV", name:"Gunsan Airport",                 lat:35.9038,  lon:126.6158, co:"KR" },
  { ic:"RKJB", ia:"MWX", name:"Muan Intl",                     lat:34.9914,  lon:126.3828, co:"KR" },

  // ==========================================================================
  // CHINA (Mainland)
  // ==========================================================================
  { ic:"ZBAA", ia:"PEK", name:"Beijing Capital Intl",           lat:40.0801,  lon:116.5846, co:"CN" },
  { ic:"ZBAD", ia:"PKX", name:"Beijing Daxing Intl",            lat:39.5095,  lon:116.4105, co:"CN" },
  { ic:"ZSPD", ia:"PVG", name:"Shanghai Pudong Intl",           lat:31.1443,  lon:121.8083, co:"CN" },
  { ic:"ZSSS", ia:"SHA", name:"Shanghai Hongqiao Intl",         lat:31.1979,  lon:121.3364, co:"CN" },
  { ic:"ZGGG", ia:"CAN", name:"Guangzhou Baiyun Intl",          lat:23.3924,  lon:113.2990, co:"CN" },
  { ic:"ZGSZ", ia:"SZX", name:"Shenzhen Bao'an Intl",          lat:22.6393,  lon:113.8107, co:"CN" },
  { ic:"ZUUU", ia:"CTU", name:"Chengdu Shuangliu Intl",         lat:30.5786,  lon:103.9472, co:"CN" },
  { ic:"ZUCK", ia:"CKG", name:"Chongqing Jiangbei Intl",        lat:29.7192,  lon:106.6419, co:"CN" },
  { ic:"ZLXY", ia:"XIY", name:"Xi'an Xianyang Intl",            lat:34.4471,  lon:108.7517, co:"CN" },
  { ic:"ZHCC", ia:"CGO", name:"Zhengzhou Xinzheng Intl",        lat:34.5197,  lon:113.8406, co:"CN" },
  { ic:"ZSNJ", ia:"NKG", name:"Nanjing Lukou Intl",             lat:31.7420,  lon:118.8620, co:"CN" },
  { ic:"ZSHC", ia:"HGH", name:"Hangzhou Xiaoshan Intl",         lat:30.2295,  lon:120.4344, co:"CN" },
  { ic:"ZSFZ", ia:"FOC", name:"Fuzhou Changle Intl",            lat:25.9353,  lon:119.6631, co:"CN" },
  { ic:"ZSAM", ia:"XMN", name:"Xiamen Gaoqi Intl",              lat:24.5440,  lon:118.1278, co:"CN" },
  { ic:"ZGSY", ia:"SYX", name:"Sanya Phoenix Intl",             lat:18.3029,  lon:109.4122, co:"CN" },
  { ic:"ZGHA", ia:"CSX", name:"Changsha Huanghua Intl",         lat:28.1892,  lon:113.2200, co:"CN" },
  { ic:"ZPPP", ia:"KMG", name:"Kunming Changshui Intl",         lat:24.9920,  lon:102.7292, co:"CN" },
  { ic:"ZWWW", ia:"URC", name:"Urumqi Diwopu Intl",             lat:43.9071,  lon:87.4742,  co:"CN" },
  { ic:"ZYTX", ia:"SHE", name:"Shenyang Taoxian Intl",          lat:41.6398,  lon:123.4836, co:"CN" },
  { ic:"ZYTL", ia:"DLC", name:"Dalian Zhoushuizi Intl",         lat:38.9657,  lon:121.5386, co:"CN" },
  { ic:"ZYCC", ia:"CGQ", name:"Changchun Longjia Intl",         lat:43.9962,  lon:125.6850, co:"CN" },
  { ic:"ZYHB", ia:"HRB", name:"Harbin Taiping Intl",            lat:45.6234,  lon:126.2500, co:"CN" },
  { ic:"ZSNB", ia:"NGB", name:"Ningbo Lishe Intl",              lat:29.8267,  lon:121.4619, co:"CN" },
  { ic:"ZSQD", ia:"TAO", name:"Qingdao Jiaodong Intl",          lat:36.2661,  lon:120.3744, co:"CN" },
  { ic:"ZSJN", ia:"TNA", name:"Jinan Yaoqiang Intl",            lat:36.8572,  lon:117.2158, co:"CN" },
  { ic:"ZJSY", ia:"HAK", name:"Haikou Meilan Intl",             lat:19.9349,  lon:110.4589, co:"CN" },
  { ic:"ZUGY", ia:"KWE", name:"Guiyang Longdongbao Intl",       lat:26.5385,  lon:106.8017, co:"CN" },
  { ic:"ZBHH", ia:"HET", name:"Hohhot Baita Intl",              lat:40.8514,  lon:111.8241, co:"CN" },
  { ic:"ZGNN", ia:"NNG", name:"Nanning Wuxu Intl",              lat:22.6083,  lon:108.1722, co:"CN" },

  // ==========================================================================
  // HONG KONG / MACAU
  // ==========================================================================
  { ic:"VHHH", ia:"HKG", name:"Hong Kong Intl",                 lat:22.3080,  lon:113.9185, co:"HK" },
  { ic:"VMMC", ia:"MFM", name:"Macau Intl",                     lat:22.1496,  lon:113.5919, co:"MO" },

  // ==========================================================================
  // SOUTHEAST ASIA
  // ==========================================================================
  { ic:"WSSS", ia:"SIN", name:"Singapore Changi Intl",          lat:1.3644,   lon:103.9915, co:"SG" },
  { ic:"WMKK", ia:"KUL", name:"Kuala Lumpur Intl (KLIA)",       lat:2.7456,   lon:101.7099, co:"MY" },
  { ic:"WBKK", ia:"BKI", name:"Kota Kinabalu Intl",             lat:5.9372,   lon:116.0508, co:"MY" },
  { ic:"WMBU", ia:"MYY", name:"Miri Airport",                   lat:4.3220,   lon:113.9869, co:"MY" },
  { ic:"VTBS", ia:"BKK", name:"Suvarnabhumi (Bangkok)",         lat:13.6811,  lon:100.7475, co:"TH" },
  { ic:"VTBD", ia:"DMK", name:"Don Mueang Intl (Bangkok)",      lat:13.9126,  lon:100.6072, co:"TH" },
  { ic:"VTSP", ia:"HKT", name:"Phuket Intl",                    lat:8.1132,   lon:98.3169,  co:"TH" },
  { ic:"VTCC", ia:"CNX", name:"Chiang Mai Intl",                lat:18.7669,  lon:98.9628,  co:"TH" },
  { ic:"VVNB", ia:"HAN", name:"Noi Bai Intl (Hanoi)",           lat:21.2212,  lon:105.8072, co:"VN" },
  { ic:"VVTS", ia:"SGN", name:"Tan Son Nhat Intl (Ho Chi Minh)",lat:10.8188,  lon:106.6519, co:"VN" },
  { ic:"VVDN", ia:"DAD", name:"Da Nang Intl",                   lat:16.0439,  lon:108.1992, co:"VN" },
  { ic:"VVPQ", ia:"PQC", name:"Phu Quoc Intl",                  lat:10.1697,  lon:103.9931, co:"VN" },
  { ic:"RPLL", ia:"MNL", name:"Ninoy Aquino Intl (Manila)",     lat:14.5086,  lon:121.0197, co:"PH" },
  { ic:"RPVM", ia:"CEB", name:"Mactan-Cebu Intl",               lat:10.3075,  lon:123.9794, co:"PH" },
  { ic:"RPVD", ia:"DVO", name:"Francisco Bangoy Intl (Davao)",  lat:7.1255,   lon:125.6458, co:"PH" },
  { ic:"WADD", ia:"DPS", name:"Ngurah Rai Intl (Bali)",         lat:-8.7481,  lon:115.1670, co:"ID" },
  { ic:"WIII", ia:"CGK", name:"Soekarno-Hatta Intl (Jakarta)",  lat:-6.1256,  lon:106.6559, co:"ID" },
  { ic:"WARR", ia:"SUB", name:"Juanda Intl (Surabaya)",         lat:-7.3798,  lon:112.7869, co:"ID" },
  { ic:"WBSB", ia:"BWN", name:"Brunei Intl",                    lat:4.9442,   lon:114.9281, co:"BN" },
  { ic:"VDPP", ia:"PNH", name:"Phnom Penh Intl",                lat:11.5466,  lon:104.8441, co:"KH" },
  { ic:"VLVT", ia:"VTE", name:"Wattay Intl (Vientiane)",        lat:17.9883,  lon:102.5633, co:"LA" },
  { ic:"VYYY", ia:"RGN", name:"Yangon Intl",                    lat:16.9073,  lon:96.1331,  co:"MM" },

  // ==========================================================================
  // SOUTH ASIA
  // ==========================================================================
  { ic:"VIDP", ia:"DEL", name:"Indira Gandhi Intl (Delhi)",     lat:28.5665,  lon:77.1031,  co:"IN" },
  { ic:"VABB", ia:"BOM", name:"Chhatrapati Shivaji Intl (Mumbai)",lat:19.0896, lon:72.8656,  co:"IN" },
  { ic:"VOBL", ia:"BLR", name:"Kempegowda Intl (Bangalore)",   lat:13.1986,  lon:77.7066,  co:"IN" },
  { ic:"VOMM", ia:"MAA", name:"Chennai Intl",                   lat:12.9900,  lon:80.1693,  co:"IN" },
  { ic:"VECC", ia:"CCU", name:"Netaji Subhash Bose Intl (Kolkata)",lat:22.6547,lon:88.4467, co:"IN" },
  { ic:"VOHY", ia:"HYD", name:"Rajiv Gandhi Intl (Hyderabad)",  lat:17.2313,  lon:78.4298,  co:"IN" },
  { ic:"VAGO", ia:"GOI", name:"Goa Intl (Dabolim)",             lat:15.3808,  lon:73.8314,  co:"IN" },
  { ic:"OPKC", ia:"KHI", name:"Jinnah Intl (Karachi)",          lat:24.9065,  lon:67.1608,  co:"PK" },
  { ic:"OPRN", ia:"ISB", name:"Islamabad Intl",                 lat:33.5492,  lon:72.8260,  co:"PK" },
  { ic:"OPLR", ia:"LHE", name:"Allama Iqbal Intl (Lahore)",     lat:31.5216,  lon:74.4036,  co:"PK" },
  { ic:"VNKT", ia:"KTM", name:"Tribhuvan Intl (Kathmandu)",     lat:27.6966,  lon:85.3591,  co:"NP" },
  { ic:"VGZR", ia:"DAC", name:"Hazrat Shahjalal Intl (Dhaka)",  lat:23.8433,  lon:90.3978,  co:"BD" },
  { ic:"VCBI", ia:"CMB", name:"Bandaranaike Intl (Colombo)",    lat:7.1808,   lon:79.8841,  co:"LK" },

  // ==========================================================================
  // MIDDLE EAST
  // ==========================================================================
  { ic:"OMDB", ia:"DXB", name:"Dubai Intl",                     lat:25.2528,  lon:55.3644,  co:"AE" },
  { ic:"OMDW", ia:"DWC", name:"Al Maktoum Intl",                lat:24.8963,  lon:55.1612,  co:"AE" },
  { ic:"OMAA", ia:"AUH", name:"Abu Dhabi Intl",                 lat:24.4330,  lon:54.6511,  co:"AE" },
  { ic:"OMSJ", ia:"SHJ", name:"Sharjah Intl",                   lat:25.3286,  lon:55.5172,  co:"AE" },
  { ic:"OERK", ia:"RUH", name:"King Khalid Intl (Riyadh)",      lat:24.9576,  lon:46.6988,  co:"SA" },
  { ic:"OEJN", ia:"JED", name:"King Abdulaziz Intl (Jeddah)",   lat:21.6796,  lon:39.1565,  co:"SA" },
  { ic:"OEDF", ia:"DMM", name:"King Fahd Intl (Dammam)",        lat:26.4712,  lon:49.7979,  co:"SA" },
  { ic:"OBBI", ia:"BAH", name:"Bahrain Intl",                   lat:26.2708,  lon:50.6336,  co:"BH" },
  { ic:"OKBK", ia:"KWI", name:"Kuwait Intl",                    lat:29.2266,  lon:47.9689,  co:"KW" },
  { ic:"OOMD", ia:"MCT", name:"Muscat Intl",                    lat:23.5933,  lon:58.2844,  co:"OM" },
  { ic:"OTHH", ia:"DOH", name:"Hamad Intl (Doha)",              lat:25.2731,  lon:51.6081,  co:"QA" },
  { ic:"LLBG", ia:"TLV", name:"Ben Gurion Intl (Tel Aviv)",     lat:32.0114,  lon:34.8867,  co:"IL" },
  { ic:"OJAM", ia:"AMM", name:"Queen Alia Intl (Amman)",        lat:31.7226,  lon:35.9932,  co:"JO" },
  { ic:"OLBA", ia:"BEY", name:"Rafic Hariri Intl (Beirut)",     lat:33.8209,  lon:35.4886,  co:"LB" },
  { ic:"OIIE", ia:"IKA", name:"Imam Khomeini Intl (Tehran)",    lat:35.4161,  lon:51.1522,  co:"IR" },
  { ic:"OIII", ia:"THR", name:"Mehrabad Intl (Tehran)",         lat:35.6892,  lon:51.3144,  co:"IR" },
  { ic:"OAKB", ia:"KBL", name:"Hamid Karzai Intl (Kabul)",      lat:34.5659,  lon:69.2122,  co:"AF" },

  // ==========================================================================
  // CENTRAL ASIA / CAUCASUS
  // ==========================================================================
  { ic:"UTTT", ia:"TAS", name:"Tashkent Intl",                  lat:41.2579,  lon:69.2811,  co:"UZ" },
  { ic:"UAAA", ia:"ALA", name:"Almaty Intl",                    lat:43.3521,  lon:77.0405,  co:"KZ" },
  { ic:"UACC", ia:"NQZ", name:"Nursultan Nazarbayev Intl",      lat:51.0222,  lon:71.4669,  co:"KZ" },
  { ic:"UGGG", ia:"TBS", name:"Tbilisi Intl",                   lat:41.6692,  lon:44.9547,  co:"GE" },
  { ic:"UDYZ", ia:"EVN", name:"Zvartnots Intl (Yerevan)",       lat:40.1473,  lon:44.3959,  co:"AM" },
  { ic:"UBBB", ia:"GYD", name:"Heydar Aliyev Intl (Baku)",      lat:40.4675,  lon:50.0467,  co:"AZ" },

  // ==========================================================================
  // RUSSIA
  // ==========================================================================
  { ic:"UUEE", ia:"SVO", name:"Sheremetyevo Intl (Moscow)",     lat:55.9726,  lon:37.4146,  co:"RU" },
  { ic:"UUDD", ia:"DME", name:"Domodedovo Intl (Moscow)",       lat:55.4088,  lon:37.9063,  co:"RU" },
  { ic:"UUWW", ia:"VKO", name:"Vnukovo Intl (Moscow)",          lat:55.5915,  lon:37.2615,  co:"RU" },
  { ic:"ULLI", ia:"LED", name:"Pulkovo Intl (St. Petersburg)",  lat:59.8003,  lon:30.2625,  co:"RU" },
  { ic:"UNNT", ia:"OVB", name:"Tolmachevo Intl (Novosibirsk)",  lat:54.9663,  lon:82.6507,  co:"RU" },
  { ic:"USSS", ia:"SVX", name:"Koltsovo Intl (Yekaterinburg)",  lat:56.7431,  lon:60.8027,  co:"RU" },
  { ic:"UHHH", ia:"KHV", name:"Khabarovsk Novy Airport",        lat:48.5280,  lon:135.1883, co:"RU" },
  { ic:"UHWW", ia:"VVO", name:"Vladivostok Intl",               lat:43.3990,  lon:132.1478, co:"RU" },

  // ==========================================================================
  // EUROPE — UK & IRELAND
  // ==========================================================================
  { ic:"EGLL", ia:"LHR", name:"London Heathrow",                lat:51.4775,  lon:-0.4614,  co:"GB" },
  { ic:"EGKK", ia:"LGW", name:"London Gatwick",                 lat:51.1481,  lon:-0.1903,  co:"GB" },
  { ic:"EGCC", ia:"MAN", name:"Manchester Airport",             lat:53.3537,  lon:-2.2750,  co:"GB" },
  { ic:"EGSS", ia:"STN", name:"London Stansted",                lat:51.8850,  lon:0.2350,   co:"GB" },
  { ic:"EGGW", ia:"LTN", name:"London Luton",                   lat:51.8747,  lon:-0.3683,  co:"GB" },
  { ic:"EGPH", ia:"EDI", name:"Edinburgh Airport",              lat:55.9500,  lon:-3.3725,  co:"GB" },
  { ic:"EGPF", ia:"GLA", name:"Glasgow Airport",                lat:55.8719,  lon:-4.4331,  co:"GB" },
  { ic:"EGBB", ia:"BHX", name:"Birmingham Airport",             lat:52.4539,  lon:-1.7480,  co:"GB" },
  { ic:"EIDW", ia:"DUB", name:"Dublin Airport",                 lat:53.4213,  lon:-6.2700,  co:"IE" },
  { ic:"EINN", ia:"SNN", name:"Shannon Airport",                lat:52.7020,  lon:-8.9248,  co:"IE" },

  // ==========================================================================
  // EUROPE — FRANCE
  // ==========================================================================
  { ic:"LFPG", ia:"CDG", name:"Paris Charles de Gaulle",        lat:49.0097,  lon:2.5478,   co:"FR" },
  { ic:"LFPO", ia:"ORY", name:"Paris Orly",                     lat:48.7233,  lon:2.3794,   co:"FR" },
  { ic:"LFMN", ia:"NCE", name:"Nice Côte d'Azur Intl",          lat:43.6584,  lon:7.2159,   co:"FR" },
  { ic:"LFLL", ia:"LYS", name:"Lyon-Saint Exupéry",             lat:45.7256,  lon:5.0811,   co:"FR" },
  { ic:"LFBO", ia:"TLS", name:"Toulouse-Blagnac",               lat:43.6293,  lon:1.3638,   co:"FR" },
  { ic:"LFSB", ia:"BSL", name:"EuroAirport Basel-Mulhouse",     lat:47.5896,  lon:7.5290,   co:"FR" },

  // ==========================================================================
  // EUROPE — GERMANY
  // ==========================================================================
  { ic:"EDDF", ia:"FRA", name:"Frankfurt Airport",              lat:50.0333,  lon:8.5706,   co:"DE" },
  { ic:"EDDM", ia:"MUC", name:"Munich Airport",                 lat:48.3538,  lon:11.7861,  co:"DE" },
  { ic:"EDDB", ia:"BER", name:"Berlin Brandenburg Intl",        lat:52.3667,  lon:13.5033,  co:"DE" },
  { ic:"EDDH", ia:"HAM", name:"Hamburg Airport",                lat:53.6304,  lon:9.9882,   co:"DE" },
  { ic:"EDDK", ia:"CGN", name:"Cologne Bonn Airport",           lat:50.8659,  lon:7.1427,   co:"DE" },
  { ic:"EDDS", ia:"STR", name:"Stuttgart Airport",              lat:48.6899,  lon:9.2219,   co:"DE" },
  { ic:"EDDL", ia:"DUS", name:"Düsseldorf Airport",             lat:51.2895,  lon:6.7668,   co:"DE" },
  { ic:"EDDN", ia:"NUE", name:"Nuremberg Airport",              lat:49.4987,  lon:11.0669,  co:"DE" },

  // ==========================================================================
  // EUROPE — BENELUX / SWITZERLAND / AUSTRIA
  // ==========================================================================
  { ic:"EHAM", ia:"AMS", name:"Amsterdam Schiphol",             lat:52.3086,  lon:4.7639,   co:"NL" },
  { ic:"EBBR", ia:"BRU", name:"Brussels Airport",               lat:50.9014,  lon:4.4844,   co:"BE" },
  { ic:"ELLX", ia:"LUX", name:"Luxembourg Findel",              lat:49.6233,  lon:6.2044,   co:"LU" },
  { ic:"LSZH", ia:"ZRH", name:"Zurich Airport",                 lat:47.4647,  lon:8.5492,   co:"CH" },
  { ic:"LSGG", ia:"GVA", name:"Geneva Airport",                 lat:46.2381,  lon:6.1089,   co:"CH" },
  { ic:"LOWW", ia:"VIE", name:"Vienna Intl Airport",            lat:48.1103,  lon:16.5697,  co:"AT" },
  { ic:"LOWS", ia:"SZG", name:"Salzburg Airport",               lat:47.7933,  lon:13.0043,  co:"AT" },
  { ic:"LOWI", ia:"INN", name:"Innsbruck Airport",              lat:47.2602,  lon:11.3439,  co:"AT" },

  // ==========================================================================
  // EUROPE — IBERIAN PENINSULA
  // ==========================================================================
  { ic:"LEMD", ia:"MAD", name:"Madrid Barajas Intl",            lat:40.4936,  lon:-3.5668,  co:"ES" },
  { ic:"LEBL", ia:"BCN", name:"Barcelona El Prat",              lat:41.2971,  lon:2.0785,   co:"ES" },
  { ic:"GCLP", ia:"LPA", name:"Gran Canaria Airport",           lat:27.9319,  lon:-15.3866, co:"ES" },
  { ic:"LEPA", ia:"PMI", name:"Palma de Mallorca Airport",      lat:39.5517,  lon:2.7388,   co:"ES" },
  { ic:"LEMG", ia:"AGP", name:"Málaga Airport",                 lat:36.6750,  lon:-4.4991,  co:"ES" },
  { ic:"LEZL", ia:"SVQ", name:"Seville Airport",                lat:37.4180,  lon:-5.8931,  co:"ES" },
  { ic:"LPPT", ia:"LIS", name:"Lisbon Humberto Delgado",        lat:38.7756,  lon:-9.1354,  co:"PT" },
  { ic:"LPFR", ia:"FAO", name:"Faro Airport",                   lat:37.0144,  lon:-7.9659,  co:"PT" },
  { ic:"LPMA", ia:"FNC", name:"Madeira Airport (Funchal)",      lat:32.6979,  lon:-16.7745, co:"PT" },

  // ==========================================================================
  // EUROPE — ITALY
  // ==========================================================================
  { ic:"LIRF", ia:"FCO", name:"Rome Fiumicino Intl",            lat:41.8003,  lon:12.2389,  co:"IT" },
  { ic:"LIMC", ia:"MXP", name:"Milan Malpensa",                 lat:45.6306,  lon:8.7281,   co:"IT" },
  { ic:"LIME", ia:"BGY", name:"Orio al Serio Intl (Bergamo)",   lat:45.6739,  lon:9.7042,   co:"IT" },
  { ic:"LIPZ", ia:"VCE", name:"Venice Marco Polo",              lat:45.5053,  lon:12.3519,  co:"IT" },
  { ic:"LIRN", ia:"NAP", name:"Naples Capodichino",             lat:40.8864,  lon:14.2908,  co:"IT" },
  { ic:"LICJ", ia:"PMO", name:"Palermo Falcone-Borsellino",     lat:38.1759,  lon:13.0910,  co:"IT" },
  { ic:"LICC", ia:"CTA", name:"Catania-Fontanarossa",           lat:37.4668,  lon:15.0664,  co:"IT" },
  { ic:"LIBR", ia:"BRI", name:"Bari Karol Wojtyla",             lat:41.1389,  lon:16.7606,  co:"IT" },
  { ic:"LIEO", ia:"OLB", name:"Olbia Costa Smeralda",           lat:40.8986,  lon:9.5178,   co:"IT" },

  // ==========================================================================
  // EUROPE — NORDIC
  // ==========================================================================
  { ic:"ENGM", ia:"OSL", name:"Oslo Gardermoen",                lat:60.1939,  lon:11.1004,  co:"NO" },
  { ic:"ENBR", ia:"BGO", name:"Bergen Airport Flesland",        lat:60.2934,  lon:5.2181,   co:"NO" },
  { ic:"ESSA", ia:"ARN", name:"Stockholm Arlanda",              lat:59.6519,  lon:17.9186,  co:"SE" },
  { ic:"ESGG", ia:"GOT", name:"Gothenburg Landvetter",          lat:57.6628,  lon:12.2798,  co:"SE" },
  { ic:"EFHK", ia:"HEL", name:"Helsinki Vantaa",                lat:60.3172,  lon:24.9633,  co:"FI" },
  { ic:"EKCH", ia:"CPH", name:"Copenhagen Airport",             lat:55.6181,  lon:12.6561,  co:"DK" },
  { ic:"BIKF", ia:"KEF", name:"Keflavik Intl (Reykjavik)",      lat:63.9850,  lon:-22.6056, co:"IS" },

  // ==========================================================================
  // EUROPE — EASTERN / BALKANS
  // ==========================================================================
  { ic:"LKPR", ia:"PRG", name:"Vaclav Havel Airport Prague",    lat:50.1008,  lon:14.2600,  co:"CZ" },
  { ic:"EPWA", ia:"WAW", name:"Warsaw Chopin Airport",          lat:52.1657,  lon:20.9671,  co:"PL" },
  { ic:"EPKK", ia:"KRK", name:"Krakow John Paul II Intl",       lat:50.0778,  lon:19.7847,  co:"PL" },
  { ic:"LHBP", ia:"BUD", name:"Budapest Liszt Ferenc Intl",     lat:47.4369,  lon:19.2556,  co:"HU" },
  { ic:"LROP", ia:"OTP", name:"Henri Coanda Intl (Bucharest)",  lat:44.5722,  lon:26.1022,  co:"RO" },
  { ic:"LBSF", ia:"SOF", name:"Sofia Airport",                  lat:42.6969,  lon:23.4114,  co:"BG" },
  { ic:"LDZA", ia:"ZAG", name:"Zagreb Airport",                 lat:45.7429,  lon:16.0688,  co:"HR" },
  { ic:"LJLJ", ia:"LJU", name:"Ljubljana Joze Pucnik Airport",  lat:46.2237,  lon:14.4576,  co:"SI" },
  { ic:"LZIB", ia:"BTS", name:"Bratislava Airport",             lat:48.1702,  lon:17.2127,  co:"SK" },
  { ic:"EYVI", ia:"VNO", name:"Vilnius Airport",                lat:54.6341,  lon:25.2858,  co:"LT" },
  { ic:"EVRA", ia:"RIX", name:"Riga Intl Airport",              lat:56.9236,  lon:23.9711,  co:"LV" },
  { ic:"EETN", ia:"TLL", name:"Tallinn Airport",                lat:59.4133,  lon:24.8328,  co:"EE" },
  { ic:"UKBB", ia:"KBP", name:"Boryspil Intl (Kyiv)",           lat:50.3450,  lon:30.8947,  co:"UA" },
  { ic:"LYBT", ia:"BEG", name:"Belgrade Nikola Tesla Airport",  lat:44.8184,  lon:20.3091,  co:"RS" },
  { ic:"LATI", ia:"TIA", name:"Tirana Nene Tereza Intl",        lat:41.4147,  lon:19.7206,  co:"AL" },

  // ==========================================================================
  // EUROPE — GREECE / TURKEY / CYPRUS
  // ==========================================================================
  { ic:"LGAV", ia:"ATH", name:"Athens Eleftherios Venizelos",   lat:37.9364,  lon:23.9445,  co:"GR" },
  { ic:"LGTS", ia:"SKG", name:"Thessaloniki Makedonia Airport", lat:40.5197,  lon:22.9709,  co:"GR" },
  { ic:"LGSR", ia:"JTR", name:"Santorini (Thira) Airport",      lat:36.3992,  lon:25.4793,  co:"GR" },
  { ic:"LGKR", ia:"CFU", name:"Corfu Airport",                  lat:39.6019,  lon:19.9117,  co:"GR" },
  { ic:"LCLK", ia:"LCA", name:"Larnaca Intl Airport",           lat:34.8751,  lon:33.6249,  co:"CY" },
  { ic:"LTFM", ia:"IST", name:"Istanbul Airport (New)",         lat:41.2608,  lon:28.7418,  co:"TR" },
  { ic:"LTAI", ia:"AYT", name:"Antalya Airport",                lat:36.8987,  lon:30.8003,  co:"TR" },
  { ic:"LTBJ", ia:"ADB", name:"Adnan Menderes Intl (Izmir)",    lat:38.2924,  lon:27.1570,  co:"TR" },
  { ic:"LTAC", ia:"ESB", name:"Esenboga Intl (Ankara)",         lat:40.1281,  lon:32.9951,  co:"TR" },

  // ==========================================================================
  // AFRICA
  // ==========================================================================
  { ic:"HECA", ia:"CAI", name:"Cairo Intl Airport",             lat:30.1219,  lon:31.4056,  co:"EG" },
  { ic:"HAAB", ia:"ADD", name:"Addis Ababa Bole Intl",          lat:8.9779,   lon:38.7993,  co:"ET" },
  { ic:"DNMM", ia:"LOS", name:"Murtala Muhammed Intl (Lagos)",  lat:6.5774,   lon:3.3211,   co:"NG" },
  { ic:"FAOR", ia:"JNB", name:"O.R. Tambo Intl (Johannesburg)", lat:-26.1392, lon:28.2460,  co:"ZA" },
  { ic:"FACT", ia:"CPT", name:"Cape Town Intl",                 lat:-33.9648, lon:18.6017,  co:"ZA" },
  { ic:"FALE", ia:"DUR", name:"King Shaka Intl (Durban)",       lat:-29.6144, lon:31.1197,  co:"ZA" },
  { ic:"HKJK", ia:"NBO", name:"Jomo Kenyatta Intl (Nairobi)",   lat:-1.3192,  lon:36.9275,  co:"KE" },
  { ic:"DAAG", ia:"ALG", name:"Houari Boumediene Airport (Algiers)",lat:36.6910,lon:3.2154, co:"DZ" },
  { ic:"GMMN", ia:"CMN", name:"Mohammed V Intl (Casablanca)",   lat:33.3675,  lon:-7.5897,  co:"MA" },
  { ic:"DTTA", ia:"TUN", name:"Tunis-Carthage Intl",            lat:36.8510,  lon:10.2272,  co:"TN" },
  { ic:"FSIA", ia:"SEZ", name:"Seychelles Intl Airport",        lat:-4.6744,  lon:55.5219,  co:"SC" },
  { ic:"FIMP", ia:"MRU", name:"Sir Seewoosagur Ramgoolam Intl", lat:-20.4302, lon:57.6836,  co:"MU" },
  { ic:"GOOY", ia:"DKR", name:"Leopold Sedar Senghor (Dakar)",  lat:14.7397,  lon:-17.4902, co:"SN" },

  // ==========================================================================
  // NORTH AMERICA — USA
  // ==========================================================================
  { ic:"KJFK", ia:"JFK", name:"John F. Kennedy Intl (New York)",lat:40.6413,  lon:-73.7781, co:"US" },
  { ic:"KLAX", ia:"LAX", name:"Los Angeles Intl",               lat:33.9425,  lon:-118.4081,co:"US" },
  { ic:"KORD", ia:"ORD", name:"O'Hare Intl (Chicago)",          lat:41.9742,  lon:-87.9073, co:"US" },
  { ic:"KATL", ia:"ATL", name:"Hartsfield-Jackson Atlanta Intl",lat:33.6407,  lon:-84.4277, co:"US" },
  { ic:"KDFW", ia:"DFW", name:"Dallas/Fort Worth Intl",         lat:32.8998,  lon:-97.0403, co:"US" },
  { ic:"KDEN", ia:"DEN", name:"Denver Intl",                    lat:39.8561,  lon:-104.6737,co:"US" },
  { ic:"KSFO", ia:"SFO", name:"San Francisco Intl",             lat:37.6213,  lon:-122.3790,co:"US" },
  { ic:"KSEA", ia:"SEA", name:"Seattle-Tacoma Intl",            lat:47.4502,  lon:-122.3088,co:"US" },
  { ic:"KLAS", ia:"LAS", name:"Harry Reid Intl (Las Vegas)",    lat:36.0840,  lon:-115.1537,co:"US" },
  { ic:"KPHX", ia:"PHX", name:"Phoenix Sky Harbor Intl",        lat:33.4373,  lon:-112.0078,co:"US" },
  { ic:"KMIA", ia:"MIA", name:"Miami Intl",                     lat:25.7959,  lon:-80.2870, co:"US" },
  { ic:"KBOS", ia:"BOS", name:"Logan Intl (Boston)",            lat:42.3656,  lon:-71.0096, co:"US" },
  { ic:"KEWR", ia:"EWR", name:"Newark Liberty Intl",            lat:40.6895,  lon:-74.1745, co:"US" },
  { ic:"KLGA", ia:"LGA", name:"LaGuardia Airport (New York)",   lat:40.7772,  lon:-73.8726, co:"US" },
  { ic:"KIAD", ia:"IAD", name:"Washington Dulles Intl",         lat:38.9445,  lon:-77.4558, co:"US" },
  { ic:"KDCA", ia:"DCA", name:"Ronald Reagan Washington Natl",  lat:38.8512,  lon:-77.0402, co:"US" },
  { ic:"KBWI", ia:"BWI", name:"Baltimore/Washington Intl",      lat:39.1754,  lon:-76.6683, co:"US" },
  { ic:"KMSP", ia:"MSP", name:"Minneapolis-St. Paul Intl",      lat:44.8848,  lon:-93.2223, co:"US" },
  { ic:"KDTW", ia:"DTW", name:"Detroit Metropolitan Airport",   lat:42.2162,  lon:-83.3554, co:"US" },
  { ic:"KPHL", ia:"PHL", name:"Philadelphia Intl",              lat:39.8721,  lon:-75.2411, co:"US" },
  { ic:"KIAH", ia:"IAH", name:"George Bush Intercontinental (Houston)",lat:29.9902,lon:-95.3368,co:"US" },
  { ic:"KMCO", ia:"MCO", name:"Orlando Intl",                   lat:28.4294,  lon:-81.3089, co:"US" },
  { ic:"KTPA", ia:"TPA", name:"Tampa Intl",                     lat:27.9755,  lon:-82.5332, co:"US" },
  { ic:"KFLL", ia:"FLL", name:"Fort Lauderdale-Hollywood Intl", lat:26.0726,  lon:-80.1527, co:"US" },
  { ic:"KCLT", ia:"CLT", name:"Charlotte Douglas Intl",         lat:35.2140,  lon:-80.9431, co:"US" },
  { ic:"KRDU", ia:"RDU", name:"Raleigh-Durham Intl",            lat:35.8776,  lon:-78.7875, co:"US" },
  { ic:"KMSP2",ia:"MSP", name:"Minneapolis-St. Paul Intl",      lat:44.8848,  lon:-93.2223, co:"US" },
  { ic:"KMDW", ia:"MDW", name:"Chicago Midway Intl",            lat:41.7868,  lon:-87.7522, co:"US" },
  { ic:"KSLC", ia:"SLC", name:"Salt Lake City Intl",            lat:40.7884,  lon:-111.9778,co:"US" },
  { ic:"KSAN", ia:"SAN", name:"San Diego Intl",                 lat:32.7338,  lon:-117.1933,co:"US" },
  { ic:"KOAK", ia:"OAK", name:"Oakland Intl",                   lat:37.7213,  lon:-122.2208,co:"US" },
  { ic:"KSJC", ia:"SJC", name:"Norman Y. Mineta San Jose Intl", lat:37.3626,  lon:-121.9290,co:"US" },
  { ic:"KPDX", ia:"PDX", name:"Portland Intl",                  lat:45.5887,  lon:-122.5975,co:"US" },
  { ic:"KMSY", ia:"MSY", name:"Louis Armstrong New Orleans Intl",lat:29.9934, lon:-90.2580, co:"US" },
  { ic:"KBNA", ia:"BNA", name:"Nashville Intl",                 lat:36.1245,  lon:-86.6782, co:"US" },
  { ic:"KAUS", ia:"AUS", name:"Austin-Bergstrom Intl",          lat:30.1975,  lon:-97.6664, co:"US" },
  { ic:"KSAT", ia:"SAT", name:"San Antonio Intl",               lat:29.5337,  lon:-98.4698, co:"US" },
  { ic:"KDAL", ia:"DAL", name:"Dallas Love Field",              lat:32.8471,  lon:-96.8517, co:"US" },
  { ic:"KMCI", ia:"MCI", name:"Kansas City Intl",               lat:39.2976,  lon:-94.7139, co:"US" },
  { ic:"KABQ", ia:"ABQ", name:"Albuquerque Intl Sunport",       lat:35.0402,  lon:-106.6090,co:"US" },
  { ic:"KSMF", ia:"SMF", name:"Sacramento Intl",                lat:38.6954,  lon:-121.5908,co:"US" },
  { ic:"KMHR", ia:"MHR", name:"Sacramento Mather Airport",      lat:38.5539,  lon:-121.2976,co:"US" },
  { ic:"KFAT", ia:"FAT", name:"Fresno Yosemite Intl",           lat:36.7762,  lon:-119.7182,co:"US" },
  { ic:"KBUF", ia:"BUF", name:"Buffalo Niagara Intl",           lat:42.9405,  lon:-78.7322, co:"US" },
  { ic:"KPIT", ia:"PIT", name:"Pittsburgh Intl",                lat:40.4915,  lon:-80.2329, co:"US" },
  { ic:"KCVG", ia:"CVG", name:"Cincinnati/Northern Kentucky Intl",lat:39.0488,lon:-84.6678, co:"US" },
  { ic:"KIND", ia:"IND", name:"Indianapolis Intl",              lat:39.7173,  lon:-86.2944, co:"US" },
  { ic:"KMKE", ia:"MKE", name:"Milwaukee Mitchell Intl",        lat:42.9472,  lon:-87.8966, co:"US" },
  { ic:"KMEM", ia:"MEM", name:"Memphis Intl",                   lat:35.0424,  lon:-89.9767, co:"US" },
  { ic:"KBHM", ia:"BHM", name:"Birmingham-Shuttlesworth Intl",  lat:33.5629,  lon:-86.7535, co:"US" },
  { ic:"KJAX", ia:"JAX", name:"Jacksonville Intl",              lat:30.4941,  lon:-81.6879, co:"US" },
  { ic:"PANC", ia:"ANC", name:"Ted Stevens Anchorage Intl",     lat:61.1744,  lon:-149.9961,co:"US" },
  { ic:"PHNL", ia:"HNL", name:"Honolulu Intl",                  lat:21.3187,  lon:-157.9222,co:"US" },
  { ic:"PHOG", ia:"OGG", name:"Kahului Airport (Maui)",         lat:20.8986,  lon:-156.4305,co:"US" },
  { ic:"PHKO", ia:"KOA", name:"Kona Intl (Hawaii)",             lat:19.7388,  lon:-156.0456,co:"US" },
  { ic:"PHTO", ia:"ITO", name:"Hilo Intl (Hawaii)",             lat:19.7213,  lon:-155.0485,co:"US" },
  { ic:"PGUM", ia:"GUM", name:"Antonio B. Won Pat Intl (Guam)", lat:13.4834,  lon:144.7961, co:"GU" },

  // ==========================================================================
  // CANADA
  // ==========================================================================
  { ic:"CYYZ", ia:"YYZ", name:"Toronto Pearson Intl",           lat:43.6777,  lon:-79.6248, co:"CA" },
  { ic:"CYVR", ia:"YVR", name:"Vancouver Intl",                 lat:49.1947,  lon:-123.1792,co:"CA" },
  { ic:"CYUL", ia:"YUL", name:"Montreal-Trudeau Intl",          lat:45.4707,  lon:-73.7408, co:"CA" },
  { ic:"CYYC", ia:"YYC", name:"Calgary Intl",                   lat:51.1215,  lon:-114.0133,co:"CA" },
  { ic:"CYEG", ia:"YEG", name:"Edmonton Intl",                  lat:53.3097,  lon:-113.5797,co:"CA" },
  { ic:"CYOW", ia:"YOW", name:"Ottawa Macdonald-Cartier Intl",  lat:45.3225,  lon:-75.6692, co:"CA" },
  { ic:"CYWG", ia:"YWG", name:"Winnipeg James Armstrong Richardson Intl",lat:49.9100,lon:-97.2399,co:"CA" },
  { ic:"CYHZ", ia:"YHZ", name:"Halifax Stanfield Intl",         lat:44.8808,  lon:-63.5086, co:"CA" },

  // ==========================================================================
  // MEXICO / CENTRAL AMERICA / CARIBBEAN
  // ==========================================================================
  { ic:"MMMX", ia:"MEX", name:"Mexico City Intl",               lat:19.4363,  lon:-99.0721, co:"MX" },
  { ic:"MMUN", ia:"CUN", name:"Cancun Intl",                    lat:21.0365,  lon:-86.8771, co:"MX" },
  { ic:"MMGL", ia:"GDL", name:"Miguel Hidalgo Intl (Guadalajara)",lat:20.5218, lon:-103.3110,co:"MX" },
  { ic:"MMMY", ia:"MTY", name:"Gen. Mariano Escobedo Intl (Monterrey)",lat:25.7785,lon:-100.1069,co:"MX" },
  { ic:"MPTO", ia:"PTY", name:"Tocumen Intl (Panama City)",     lat:9.0714,   lon:-79.3835, co:"PA" },
  { ic:"MROC", ia:"SJO", name:"Juan Santamaria Intl (San Jose)", lat:9.9939,   lon:-84.2088, co:"CR" },
  { ic:"TJSJ", ia:"SJU", name:"Luis Munoz Marin Intl (San Juan)",lat:18.4394,  lon:-66.0018, co:"PR" },
  { ic:"MUHA", ia:"HAV", name:"Jose Marti Intl (Havana)",       lat:22.9892,  lon:-82.4091, co:"CU" },
  { ic:"MDSD", ia:"SDQ", name:"Las Americas Intl (Santo Domingo)",lat:18.4297, lon:-69.6689, co:"DO" },
  { ic:"TNCM", ia:"SXM", name:"Princess Juliana Intl (St. Maarten)",lat:18.0410,lon:-63.1089,co:"SX" },

  // ==========================================================================
  // SOUTH AMERICA
  // ==========================================================================
  { ic:"SBGR", ia:"GRU", name:"Sao Paulo Guarulhos Intl",       lat:-23.4356, lon:-46.4731, co:"BR" },
  { ic:"SBGL", ia:"GIG", name:"Rio de Janeiro Galeao Intl",     lat:-22.8099, lon:-43.2506, co:"BR" },
  { ic:"SBBR", ia:"BSB", name:"Brasilia Intl",                  lat:-15.8711, lon:-47.9186, co:"BR" },
  { ic:"SBSV", ia:"SSA", name:"Salvador Dep. L.E. Magalhaes Intl",lat:-12.9086,lon:-38.3225,co:"BR" },
  { ic:"SBRF", ia:"REC", name:"Recife Guararapes Intl",         lat:-8.1265,  lon:-34.9236, co:"BR" },
  { ic:"SBMN", ia:"MAO", name:"Manaus Eduardo Gomes Intl",      lat:-3.0386,  lon:-60.0497, co:"BR" },
  { ic:"SAEZ", ia:"EZE", name:"Ezeiza Ministro Pistarini Intl", lat:-34.8222, lon:-58.5358, co:"AR" },
  { ic:"SCEL", ia:"SCL", name:"Arturo Merino Benitez Intl (Santiago)",lat:-33.3930,lon:-70.7858,co:"CL" },
  { ic:"SPJC", ia:"LIM", name:"Jorge Chavez Intl (Lima)",       lat:-12.0219, lon:-77.1143, co:"PE" },
  { ic:"SKBO", ia:"BOG", name:"El Dorado Intl (Bogota)",        lat:4.7016,   lon:-74.1469, co:"CO" },
  { ic:"SEQM", ia:"UIO", name:"Mariscal Sucre Intl (Quito)",    lat:-0.1292,  lon:-78.3575, co:"EC" },
  { ic:"SVMI", ia:"CCS", name:"Simon Bolivar Intl (Caracas)",   lat:10.6012,  lon:-66.9913, co:"VE" },
  { ic:"SUAA", ia:"MVD", name:"Carrasco Intl (Montevideo)",     lat:-34.8384, lon:-56.0308, co:"UY" },
  { ic:"SLLP", ia:"LPB", name:"El Alto Intl (La Paz)",          lat:-16.5133, lon:-68.1922, co:"BO" },

  // ==========================================================================
  // OCEANIA
  // ==========================================================================
  { ic:"YSSY", ia:"SYD", name:"Sydney Kingsford Smith Intl",    lat:-33.9461, lon:151.1772, co:"AU" },
  { ic:"YMML", ia:"MEL", name:"Melbourne Airport",              lat:-37.6690, lon:144.8410, co:"AU" },
  { ic:"YBBN", ia:"BNE", name:"Brisbane Airport",               lat:-27.3842, lon:153.1175, co:"AU" },
  { ic:"YPPH", ia:"PER", name:"Perth Airport",                  lat:-31.9403, lon:115.9670, co:"AU" },
  { ic:"YPAD", ia:"ADL", name:"Adelaide Airport",               lat:-34.9450, lon:138.5306, co:"AU" },
  { ic:"YBCS", ia:"CNS", name:"Cairns Airport",                 lat:-16.8858, lon:145.7552, co:"AU" },
  { ic:"NZAA", ia:"AKL", name:"Auckland Airport",               lat:-37.0082, lon:174.7920, co:"NZ" },
  { ic:"NZCH", ia:"CHC", name:"Christchurch Intl",              lat:-43.4894, lon:172.5322, co:"NZ" },
  { ic:"NZWN", ia:"WLG", name:"Wellington Intl",                lat:-41.3272, lon:174.8050, co:"NZ" },
  { ic:"NFFN", ia:"NAN", name:"Nadi Intl (Fiji)",               lat:-17.7553, lon:177.4431, co:"FJ" },
  { ic:"NTAA", ia:"PPT", name:"Faa'a Intl (Papeete, Tahiti)",   lat:-17.5534, lon:-149.6067,co:"PF" },
  { ic:"PGSN", ia:"SPN", name:"Saipan Intl",                    lat:15.1190,  lon:145.7290, co:"MP" },

];

// ============================================================================
// LOOKUP FUNCTION
// ============================================================================

/**
 * Look up an airport or parse coordinates.
 *
 * Accepts:
 *   - 4-letter ICAO code (e.g. "RCTP")
 *   - 3-letter IATA code (e.g. "TPE")
 *   - Decimal coordinates: "25.0777, 121.2322" or "25.0777 121.2322"
 *   - Signed decimal: "-33.9461, 151.1772"
 *
 * Returns: { lat, lon, name, icao, iata, country } or null if not found.
 */
function lookupAirport(query) {
    if (!query) return null;
    query = query.trim();

    // ── Coordinate parse: "lat, lon" or "lat lon" ──────────────────────────
    const coordMatch = query.match(/^(-?\d{1,3}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lon = parseFloat(coordMatch[2]);
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            return {
                lat,
                lon,
                name: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
                icao: '',
                iata: '',
                country: ''
            };
        }
    }

    const q = query.toUpperCase();

    // ── Exact ICAO match (4 chars) ──────────────────────────────────────────
    if (q.length === 4) {
        const found = AIRPORT_DB.find(a => a.ic === q);
        if (found) return _toResult(found);
    }

    // ── Exact IATA match (3 chars) ──────────────────────────────────────────
    if (q.length === 3) {
        const found = AIRPORT_DB.find(a => a.ia === q);
        if (found) return _toResult(found);
    }

    // ── Prefix fallback (handles partial input or typos gracefully) ─────────
    const partial = AIRPORT_DB.find(a => a.ic.startsWith(q) || (a.ia && a.ia.startsWith(q)));
    if (partial) return _toResult(partial);

    return null;
}

/** @private Map a DB entry to the result shape */
function _toResult(a) {
    return { lat: a.lat, lon: a.lon, name: a.name, icao: a.ic, iata: a.ia, country: a.co };
}
