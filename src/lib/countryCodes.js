/**
 * @file countryCodes.js
 * @description Dataset kode negara seluruh dunia (240+ negara & teritori) dengan integrasi libphonenumber-js,
 * SVG flag icons, dan nama negara dwibahasa (Indonesia & Inggris).
 * Dibuat untuk standarisasi nomor telepon internasional pada Wahidiyah Book.
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * @typedef {Object} CountryInfo
 * @property {string} code - Kode ISO 3166-1 alpha-2 huruf kapital (e.g. 'ID')
 * @property {string} dial - Kode panggil internasional berawalan plus (e.g. '+62')
 * @property {string} dialNum - Kode panggil berupa angka murni (e.g. '62')
 * @property {string} name - Nama negara dalam Bahasa Indonesia
 * @property {string} enName - Nama negara dalam Bahasa Inggris
 * @property {string} flag - Nama berkas SVG bendera tanpa ekstensi (e.g. 'id')
 * @property {boolean} priority - Apakah negara diprioritaskan di bagian atas pemilih
 */

/** @type {CountryInfo[]} */
export const COUNTRY_CODES = [
  {
    "code": "ID",
    "dial": "+62",
    "dialNum": "62",
    "name": "Indonesia",
    "enName": "Indonesia",
    "flag": "id",
    "priority": true
  },
  {
    "code": "MY",
    "dial": "+60",
    "dialNum": "60",
    "name": "Malaysia",
    "enName": "Malaysia",
    "flag": "my",
    "priority": true
  },
  {
    "code": "SG",
    "dial": "+65",
    "dialNum": "65",
    "name": "Singapura",
    "enName": "Singapore",
    "flag": "sg",
    "priority": true
  },
  {
    "code": "BN",
    "dial": "+673",
    "dialNum": "673",
    "name": "Brunei",
    "enName": "Brunei",
    "flag": "bn",
    "priority": true
  },
  {
    "code": "SA",
    "dial": "+966",
    "dialNum": "966",
    "name": "Arab Saudi",
    "enName": "Saudi Arabia",
    "flag": "sa",
    "priority": true
  },
  {
    "code": "AE",
    "dial": "+971",
    "dialNum": "971",
    "name": "Uni Emirat Arab",
    "enName": "United Arab Emirates",
    "flag": "ae",
    "priority": true
  },
  {
    "code": "EG",
    "dial": "+20",
    "dialNum": "20",
    "name": "Mesir",
    "enName": "Egypt",
    "flag": "eg",
    "priority": true
  },
  {
    "code": "TR",
    "dial": "+90",
    "dialNum": "90",
    "name": "Turki",
    "enName": "Türkiye",
    "flag": "tr",
    "priority": true
  },
  {
    "code": "PS",
    "dial": "+970",
    "dialNum": "970",
    "name": "Wilayah Palestina",
    "enName": "Palestinian Territories",
    "flag": "ps",
    "priority": true
  },
  {
    "code": "JO",
    "dial": "+962",
    "dialNum": "962",
    "name": "Yordania",
    "enName": "Jordan",
    "flag": "jo",
    "priority": true
  },
  {
    "code": "YE",
    "dial": "+967",
    "dialNum": "967",
    "name": "Yaman",
    "enName": "Yemen",
    "flag": "ye",
    "priority": true
  },
  {
    "code": "QA",
    "dial": "+974",
    "dialNum": "974",
    "name": "Qatar",
    "enName": "Qatar",
    "flag": "qa",
    "priority": true
  },
  {
    "code": "KW",
    "dial": "+965",
    "dialNum": "965",
    "name": "Kuwait",
    "enName": "Kuwait",
    "flag": "kw",
    "priority": true
  },
  {
    "code": "OM",
    "dial": "+968",
    "dialNum": "968",
    "name": "Oman",
    "enName": "Oman",
    "flag": "om",
    "priority": true
  },
  {
    "code": "BH",
    "dial": "+973",
    "dialNum": "973",
    "name": "Bahrain",
    "enName": "Bahrain",
    "flag": "bh",
    "priority": true
  },
  {
    "code": "US",
    "dial": "+1",
    "dialNum": "1",
    "name": "Amerika Serikat",
    "enName": "United States",
    "flag": "us",
    "priority": true
  },
  {
    "code": "GB",
    "dial": "+44",
    "dialNum": "44",
    "name": "Inggris Raya",
    "enName": "United Kingdom",
    "flag": "gb",
    "priority": true
  },
  {
    "code": "AU",
    "dial": "+61",
    "dialNum": "61",
    "name": "Australia",
    "enName": "Australia",
    "flag": "au",
    "priority": true
  },
  {
    "code": "JP",
    "dial": "+81",
    "dialNum": "81",
    "name": "Jepang",
    "enName": "Japan",
    "flag": "jp",
    "priority": true
  },
  {
    "code": "KR",
    "dial": "+82",
    "dialNum": "82",
    "name": "Korea Selatan",
    "enName": "South Korea",
    "flag": "kr",
    "priority": true
  },
  {
    "code": "AF",
    "dial": "+93",
    "dialNum": "93",
    "name": "Afganistan",
    "enName": "Afghanistan",
    "flag": "af",
    "priority": false
  },
  {
    "code": "ZA",
    "dial": "+27",
    "dialNum": "27",
    "name": "Afrika Selatan",
    "enName": "South Africa",
    "flag": "za",
    "priority": false
  },
  {
    "code": "AL",
    "dial": "+355",
    "dialNum": "355",
    "name": "Albania",
    "enName": "Albania",
    "flag": "al",
    "priority": false
  },
  {
    "code": "DZ",
    "dial": "+213",
    "dialNum": "213",
    "name": "Aljazair",
    "enName": "Algeria",
    "flag": "dz",
    "priority": false
  },
  {
    "code": "AD",
    "dial": "+376",
    "dialNum": "376",
    "name": "Andorra",
    "enName": "Andorra",
    "flag": "ad",
    "priority": false
  },
  {
    "code": "AO",
    "dial": "+244",
    "dialNum": "244",
    "name": "Angola",
    "enName": "Angola",
    "flag": "ao",
    "priority": false
  },
  {
    "code": "AI",
    "dial": "+1",
    "dialNum": "1",
    "name": "Anguilla",
    "enName": "Anguilla",
    "flag": "ai",
    "priority": false
  },
  {
    "code": "AG",
    "dial": "+1",
    "dialNum": "1",
    "name": "Antigua dan Barbuda",
    "enName": "Antigua & Barbuda",
    "flag": "ag",
    "priority": false
  },
  {
    "code": "AR",
    "dial": "+54",
    "dialNum": "54",
    "name": "Argentina",
    "enName": "Argentina",
    "flag": "ar",
    "priority": false
  },
  {
    "code": "AM",
    "dial": "+374",
    "dialNum": "374",
    "name": "Armenia",
    "enName": "Armenia",
    "flag": "am",
    "priority": false
  },
  {
    "code": "AW",
    "dial": "+297",
    "dialNum": "297",
    "name": "Aruba",
    "enName": "Aruba",
    "flag": "aw",
    "priority": false
  },
  {
    "code": "AT",
    "dial": "+43",
    "dialNum": "43",
    "name": "Austria",
    "enName": "Austria",
    "flag": "at",
    "priority": false
  },
  {
    "code": "AZ",
    "dial": "+994",
    "dialNum": "994",
    "name": "Azerbaijan",
    "enName": "Azerbaijan",
    "flag": "az",
    "priority": false
  },
  {
    "code": "BS",
    "dial": "+1",
    "dialNum": "1",
    "name": "Bahama",
    "enName": "Bahamas",
    "flag": "bs",
    "priority": false
  },
  {
    "code": "BD",
    "dial": "+880",
    "dialNum": "880",
    "name": "Bangladesh",
    "enName": "Bangladesh",
    "flag": "bd",
    "priority": false
  },
  {
    "code": "BB",
    "dial": "+1",
    "dialNum": "1",
    "name": "Barbados",
    "enName": "Barbados",
    "flag": "bb",
    "priority": false
  },
  {
    "code": "NL",
    "dial": "+31",
    "dialNum": "31",
    "name": "Belanda",
    "enName": "Netherlands",
    "flag": "nl",
    "priority": false
  },
  {
    "code": "BQ",
    "dial": "+599",
    "dialNum": "599",
    "name": "Belanda Karibia",
    "enName": "Caribbean Netherlands",
    "flag": "bq",
    "priority": false
  },
  {
    "code": "BY",
    "dial": "+375",
    "dialNum": "375",
    "name": "Belarus",
    "enName": "Belarus",
    "flag": "by",
    "priority": false
  },
  {
    "code": "BE",
    "dial": "+32",
    "dialNum": "32",
    "name": "Belgia",
    "enName": "Belgium",
    "flag": "be",
    "priority": false
  },
  {
    "code": "BZ",
    "dial": "+501",
    "dialNum": "501",
    "name": "Belize",
    "enName": "Belize",
    "flag": "bz",
    "priority": false
  },
  {
    "code": "BJ",
    "dial": "+229",
    "dialNum": "229",
    "name": "Benin",
    "enName": "Benin",
    "flag": "bj",
    "priority": false
  },
  {
    "code": "BM",
    "dial": "+1",
    "dialNum": "1",
    "name": "Bermuda",
    "enName": "Bermuda",
    "flag": "bm",
    "priority": false
  },
  {
    "code": "BT",
    "dial": "+975",
    "dialNum": "975",
    "name": "Bhutan",
    "enName": "Bhutan",
    "flag": "bt",
    "priority": false
  },
  {
    "code": "BO",
    "dial": "+591",
    "dialNum": "591",
    "name": "Bolivia",
    "enName": "Bolivia",
    "flag": "bo",
    "priority": false
  },
  {
    "code": "BA",
    "dial": "+387",
    "dialNum": "387",
    "name": "Bosnia dan Herzegovina",
    "enName": "Bosnia & Herzegovina",
    "flag": "ba",
    "priority": false
  },
  {
    "code": "BW",
    "dial": "+267",
    "dialNum": "267",
    "name": "Botswana",
    "enName": "Botswana",
    "flag": "bw",
    "priority": false
  },
  {
    "code": "BR",
    "dial": "+55",
    "dialNum": "55",
    "name": "Brasil",
    "enName": "Brazil",
    "flag": "br",
    "priority": false
  },
  {
    "code": "BG",
    "dial": "+359",
    "dialNum": "359",
    "name": "Bulgaria",
    "enName": "Bulgaria",
    "flag": "bg",
    "priority": false
  },
  {
    "code": "BF",
    "dial": "+226",
    "dialNum": "226",
    "name": "Burkina Faso",
    "enName": "Burkina Faso",
    "flag": "bf",
    "priority": false
  },
  {
    "code": "BI",
    "dial": "+257",
    "dialNum": "257",
    "name": "Burundi",
    "enName": "Burundi",
    "flag": "bi",
    "priority": false
  },
  {
    "code": "CZ",
    "dial": "+420",
    "dialNum": "420",
    "name": "Ceko",
    "enName": "Czechia",
    "flag": "cz",
    "priority": false
  },
  {
    "code": "TD",
    "dial": "+235",
    "dialNum": "235",
    "name": "Chad",
    "enName": "Chad",
    "flag": "td",
    "priority": false
  },
  {
    "code": "CL",
    "dial": "+56",
    "dialNum": "56",
    "name": "Cile",
    "enName": "Chile",
    "flag": "cl",
    "priority": false
  },
  {
    "code": "CI",
    "dial": "+225",
    "dialNum": "225",
    "name": "Côte d’Ivoire",
    "enName": "Côte d’Ivoire",
    "flag": "ci",
    "priority": false
  },
  {
    "code": "CW",
    "dial": "+599",
    "dialNum": "599",
    "name": "Curaçao",
    "enName": "Curaçao",
    "flag": "cw",
    "priority": false
  },
  {
    "code": "DK",
    "dial": "+45",
    "dialNum": "45",
    "name": "Denmark",
    "enName": "Denmark",
    "flag": "dk",
    "priority": false
  },
  {
    "code": "DM",
    "dial": "+1",
    "dialNum": "1",
    "name": "Dominika",
    "enName": "Dominica",
    "flag": "dm",
    "priority": false
  },
  {
    "code": "EC",
    "dial": "+593",
    "dialNum": "593",
    "name": "Ekuador",
    "enName": "Ecuador",
    "flag": "ec",
    "priority": false
  },
  {
    "code": "SV",
    "dial": "+503",
    "dialNum": "503",
    "name": "El Salvador",
    "enName": "El Salvador",
    "flag": "sv",
    "priority": false
  },
  {
    "code": "ER",
    "dial": "+291",
    "dialNum": "291",
    "name": "Eritrea",
    "enName": "Eritrea",
    "flag": "er",
    "priority": false
  },
  {
    "code": "EE",
    "dial": "+372",
    "dialNum": "372",
    "name": "Estonia",
    "enName": "Estonia",
    "flag": "ee",
    "priority": false
  },
  {
    "code": "SZ",
    "dial": "+268",
    "dialNum": "268",
    "name": "eSwatini",
    "enName": "Eswatini",
    "flag": "sz",
    "priority": false
  },
  {
    "code": "ET",
    "dial": "+251",
    "dialNum": "251",
    "name": "Etiopia",
    "enName": "Ethiopia",
    "flag": "et",
    "priority": false
  },
  {
    "code": "FJ",
    "dial": "+679",
    "dialNum": "679",
    "name": "Fiji",
    "enName": "Fiji",
    "flag": "fj",
    "priority": false
  },
  {
    "code": "PH",
    "dial": "+63",
    "dialNum": "63",
    "name": "Filipina",
    "enName": "Philippines",
    "flag": "ph",
    "priority": false
  },
  {
    "code": "FI",
    "dial": "+358",
    "dialNum": "358",
    "name": "Finlandia",
    "enName": "Finland",
    "flag": "fi",
    "priority": false
  },
  {
    "code": "GA",
    "dial": "+241",
    "dialNum": "241",
    "name": "Gabon",
    "enName": "Gabon",
    "flag": "ga",
    "priority": false
  },
  {
    "code": "GM",
    "dial": "+220",
    "dialNum": "220",
    "name": "Gambia",
    "enName": "Gambia",
    "flag": "gm",
    "priority": false
  },
  {
    "code": "GE",
    "dial": "+995",
    "dialNum": "995",
    "name": "Georgia",
    "enName": "Georgia",
    "flag": "ge",
    "priority": false
  },
  {
    "code": "GH",
    "dial": "+233",
    "dialNum": "233",
    "name": "Ghana",
    "enName": "Ghana",
    "flag": "gh",
    "priority": false
  },
  {
    "code": "GI",
    "dial": "+350",
    "dialNum": "350",
    "name": "Gibraltar",
    "enName": "Gibraltar",
    "flag": "gi",
    "priority": false
  },
  {
    "code": "GL",
    "dial": "+299",
    "dialNum": "299",
    "name": "Greenland",
    "enName": "Greenland",
    "flag": "gl",
    "priority": false
  },
  {
    "code": "GD",
    "dial": "+1",
    "dialNum": "1",
    "name": "Grenada",
    "enName": "Grenada",
    "flag": "gd",
    "priority": false
  },
  {
    "code": "GP",
    "dial": "+590",
    "dialNum": "590",
    "name": "Guadeloupe",
    "enName": "Guadeloupe",
    "flag": "gp",
    "priority": false
  },
  {
    "code": "GU",
    "dial": "+1",
    "dialNum": "1",
    "name": "Guam",
    "enName": "Guam",
    "flag": "gu",
    "priority": false
  },
  {
    "code": "GT",
    "dial": "+502",
    "dialNum": "502",
    "name": "Guatemala",
    "enName": "Guatemala",
    "flag": "gt",
    "priority": false
  },
  {
    "code": "GG",
    "dial": "+44",
    "dialNum": "44",
    "name": "Guernsey",
    "enName": "Guernsey",
    "flag": "gg",
    "priority": false
  },
  {
    "code": "GN",
    "dial": "+224",
    "dialNum": "224",
    "name": "Guinea",
    "enName": "Guinea",
    "flag": "gn",
    "priority": false
  },
  {
    "code": "GQ",
    "dial": "+240",
    "dialNum": "240",
    "name": "Guinea Ekuatorial",
    "enName": "Equatorial Guinea",
    "flag": "gq",
    "priority": false
  },
  {
    "code": "GW",
    "dial": "+245",
    "dialNum": "245",
    "name": "Guinea-Bissau",
    "enName": "Guinea-Bissau",
    "flag": "gw",
    "priority": false
  },
  {
    "code": "GY",
    "dial": "+592",
    "dialNum": "592",
    "name": "Guyana",
    "enName": "Guyana",
    "flag": "gy",
    "priority": false
  },
  {
    "code": "GF",
    "dial": "+594",
    "dialNum": "594",
    "name": "Guyana Prancis",
    "enName": "French Guiana",
    "flag": "gf",
    "priority": false
  },
  {
    "code": "HT",
    "dial": "+509",
    "dialNum": "509",
    "name": "Haiti",
    "enName": "Haiti",
    "flag": "ht",
    "priority": false
  },
  {
    "code": "HN",
    "dial": "+504",
    "dialNum": "504",
    "name": "Honduras",
    "enName": "Honduras",
    "flag": "hn",
    "priority": false
  },
  {
    "code": "HK",
    "dial": "+852",
    "dialNum": "852",
    "name": "Hong Kong DAK Tiongkok",
    "enName": "Hong Kong SAR China",
    "flag": "hk",
    "priority": false
  },
  {
    "code": "HU",
    "dial": "+36",
    "dialNum": "36",
    "name": "Hungaria",
    "enName": "Hungary",
    "flag": "hu",
    "priority": false
  },
  {
    "code": "IN",
    "dial": "+91",
    "dialNum": "91",
    "name": "India",
    "enName": "India",
    "flag": "in",
    "priority": false
  },
  {
    "code": "IQ",
    "dial": "+964",
    "dialNum": "964",
    "name": "Irak",
    "enName": "Iraq",
    "flag": "iq",
    "priority": false
  },
  {
    "code": "IR",
    "dial": "+98",
    "dialNum": "98",
    "name": "Iran",
    "enName": "Iran",
    "flag": "ir",
    "priority": false
  },
  {
    "code": "IE",
    "dial": "+353",
    "dialNum": "353",
    "name": "Irlandia",
    "enName": "Ireland",
    "flag": "ie",
    "priority": false
  },
  {
    "code": "IS",
    "dial": "+354",
    "dialNum": "354",
    "name": "Islandia",
    "enName": "Iceland",
    "flag": "is",
    "priority": false
  },
  {
    "code": "IL",
    "dial": "+972",
    "dialNum": "972",
    "name": "Israel",
    "enName": "Israel",
    "flag": "il",
    "priority": false
  },
  {
    "code": "IT",
    "dial": "+39",
    "dialNum": "39",
    "name": "Italia",
    "enName": "Italy",
    "flag": "it",
    "priority": false
  },
  {
    "code": "JM",
    "dial": "+1",
    "dialNum": "1",
    "name": "Jamaika",
    "enName": "Jamaica",
    "flag": "jm",
    "priority": false
  },
  {
    "code": "DE",
    "dial": "+49",
    "dialNum": "49",
    "name": "Jerman",
    "enName": "Germany",
    "flag": "de",
    "priority": false
  },
  {
    "code": "JE",
    "dial": "+44",
    "dialNum": "44",
    "name": "Jersey",
    "enName": "Jersey",
    "flag": "je",
    "priority": false
  },
  {
    "code": "DJ",
    "dial": "+253",
    "dialNum": "253",
    "name": "Jibuti",
    "enName": "Djibouti",
    "flag": "dj",
    "priority": false
  },
  {
    "code": "NC",
    "dial": "+687",
    "dialNum": "687",
    "name": "Kaledonia Baru",
    "enName": "New Caledonia",
    "flag": "nc",
    "priority": false
  },
  {
    "code": "KH",
    "dial": "+855",
    "dialNum": "855",
    "name": "Kamboja",
    "enName": "Cambodia",
    "flag": "kh",
    "priority": false
  },
  {
    "code": "CM",
    "dial": "+237",
    "dialNum": "237",
    "name": "Kamerun",
    "enName": "Cameroon",
    "flag": "cm",
    "priority": false
  },
  {
    "code": "CA",
    "dial": "+1",
    "dialNum": "1",
    "name": "Kanada",
    "enName": "Canada",
    "flag": "ca",
    "priority": false
  },
  {
    "code": "KZ",
    "dial": "+7",
    "dialNum": "7",
    "name": "Kazakhstan",
    "enName": "Kazakhstan",
    "flag": "kz",
    "priority": false
  },
  {
    "code": "KE",
    "dial": "+254",
    "dialNum": "254",
    "name": "Kenya",
    "enName": "Kenya",
    "flag": "ke",
    "priority": false
  },
  {
    "code": "AX",
    "dial": "+358",
    "dialNum": "358",
    "name": "Kepulauan Aland",
    "enName": "Åland Islands",
    "flag": "ax",
    "priority": false
  },
  {
    "code": "KY",
    "dial": "+1",
    "dialNum": "1",
    "name": "Kepulauan Cayman",
    "enName": "Cayman Islands",
    "flag": "ky",
    "priority": false
  },
  {
    "code": "CC",
    "dial": "+61",
    "dialNum": "61",
    "name": "Kepulauan Cocos (Keeling)",
    "enName": "Cocos (Keeling) Islands",
    "flag": "cc",
    "priority": false
  },
  {
    "code": "CK",
    "dial": "+682",
    "dialNum": "682",
    "name": "Kepulauan Cook",
    "enName": "Cook Islands",
    "flag": "ck",
    "priority": false
  },
  {
    "code": "FK",
    "dial": "+500",
    "dialNum": "500",
    "name": "Kepulauan Falkland",
    "enName": "Falkland Islands",
    "flag": "fk",
    "priority": false
  },
  {
    "code": "FO",
    "dial": "+298",
    "dialNum": "298",
    "name": "Kepulauan Faroe",
    "enName": "Faroe Islands",
    "flag": "fo",
    "priority": false
  },
  {
    "code": "MP",
    "dial": "+1",
    "dialNum": "1",
    "name": "Kepulauan Mariana Utara",
    "enName": "Northern Mariana Islands",
    "flag": "mp",
    "priority": false
  },
  {
    "code": "MH",
    "dial": "+692",
    "dialNum": "692",
    "name": "Kepulauan Marshall",
    "enName": "Marshall Islands",
    "flag": "mh",
    "priority": false
  },
  {
    "code": "NF",
    "dial": "+672",
    "dialNum": "672",
    "name": "Kepulauan Norfolk",
    "enName": "Norfolk Island",
    "flag": "nf",
    "priority": false
  },
  {
    "code": "SB",
    "dial": "+677",
    "dialNum": "677",
    "name": "Kepulauan Solomon",
    "enName": "Solomon Islands",
    "flag": "sb",
    "priority": false
  },
  {
    "code": "SJ",
    "dial": "+47",
    "dialNum": "47",
    "name": "Kepulauan Svalbard dan Jan Mayen",
    "enName": "Svalbard & Jan Mayen",
    "flag": "sj",
    "priority": false
  },
  {
    "code": "TC",
    "dial": "+1",
    "dialNum": "1",
    "name": "Kepulauan Turks dan Caicos",
    "enName": "Turks & Caicos Islands",
    "flag": "tc",
    "priority": false
  },
  {
    "code": "VI",
    "dial": "+1",
    "dialNum": "1",
    "name": "Kepulauan Virgin Amerika Serikat",
    "enName": "U.S. Virgin Islands",
    "flag": "vi",
    "priority": false
  },
  {
    "code": "VG",
    "dial": "+1",
    "dialNum": "1",
    "name": "Kepulauan Virgin Britania Raya",
    "enName": "British Virgin Islands",
    "flag": "vg",
    "priority": false
  },
  {
    "code": "WF",
    "dial": "+681",
    "dialNum": "681",
    "name": "Kepulauan Wallis dan Futuna",
    "enName": "Wallis & Futuna",
    "flag": "wf",
    "priority": false
  },
  {
    "code": "KG",
    "dial": "+996",
    "dialNum": "996",
    "name": "Kirgizstan",
    "enName": "Kyrgyzstan",
    "flag": "kg",
    "priority": false
  },
  {
    "code": "KI",
    "dial": "+686",
    "dialNum": "686",
    "name": "Kiribati",
    "enName": "Kiribati",
    "flag": "ki",
    "priority": false
  },
  {
    "code": "CO",
    "dial": "+57",
    "dialNum": "57",
    "name": "Kolombia",
    "enName": "Colombia",
    "flag": "co",
    "priority": false
  },
  {
    "code": "KM",
    "dial": "+269",
    "dialNum": "269",
    "name": "Komoro",
    "enName": "Comoros",
    "flag": "km",
    "priority": false
  },
  {
    "code": "CG",
    "dial": "+242",
    "dialNum": "242",
    "name": "Kongo - Brazzaville",
    "enName": "Congo - Brazzaville",
    "flag": "cg",
    "priority": false
  },
  {
    "code": "CD",
    "dial": "+243",
    "dialNum": "243",
    "name": "Kongo - Kinshasa",
    "enName": "Congo - Kinshasa",
    "flag": "cd",
    "priority": false
  },
  {
    "code": "KP",
    "dial": "+850",
    "dialNum": "850",
    "name": "Korea Utara",
    "enName": "North Korea",
    "flag": "kp",
    "priority": false
  },
  {
    "code": "XK",
    "dial": "+383",
    "dialNum": "383",
    "name": "Kosovo",
    "enName": "Kosovo",
    "flag": "xk",
    "priority": false
  },
  {
    "code": "CR",
    "dial": "+506",
    "dialNum": "506",
    "name": "Kosta Rika",
    "enName": "Costa Rica",
    "flag": "cr",
    "priority": false
  },
  {
    "code": "HR",
    "dial": "+385",
    "dialNum": "385",
    "name": "Kroasia",
    "enName": "Croatia",
    "flag": "hr",
    "priority": false
  },
  {
    "code": "CU",
    "dial": "+53",
    "dialNum": "53",
    "name": "Kuba",
    "enName": "Cuba",
    "flag": "cu",
    "priority": false
  },
  {
    "code": "LA",
    "dial": "+856",
    "dialNum": "856",
    "name": "Laos",
    "enName": "Laos",
    "flag": "la",
    "priority": false
  },
  {
    "code": "LV",
    "dial": "+371",
    "dialNum": "371",
    "name": "Latvia",
    "enName": "Latvia",
    "flag": "lv",
    "priority": false
  },
  {
    "code": "LB",
    "dial": "+961",
    "dialNum": "961",
    "name": "Lebanon",
    "enName": "Lebanon",
    "flag": "lb",
    "priority": false
  },
  {
    "code": "LS",
    "dial": "+266",
    "dialNum": "266",
    "name": "Lesotho",
    "enName": "Lesotho",
    "flag": "ls",
    "priority": false
  },
  {
    "code": "LR",
    "dial": "+231",
    "dialNum": "231",
    "name": "Liberia",
    "enName": "Liberia",
    "flag": "lr",
    "priority": false
  },
  {
    "code": "LY",
    "dial": "+218",
    "dialNum": "218",
    "name": "Libya",
    "enName": "Libya",
    "flag": "ly",
    "priority": false
  },
  {
    "code": "LI",
    "dial": "+423",
    "dialNum": "423",
    "name": "Liechtenstein",
    "enName": "Liechtenstein",
    "flag": "li",
    "priority": false
  },
  {
    "code": "LT",
    "dial": "+370",
    "dialNum": "370",
    "name": "Lituania",
    "enName": "Lithuania",
    "flag": "lt",
    "priority": false
  },
  {
    "code": "LU",
    "dial": "+352",
    "dialNum": "352",
    "name": "Luksemburg",
    "enName": "Luxembourg",
    "flag": "lu",
    "priority": false
  },
  {
    "code": "MG",
    "dial": "+261",
    "dialNum": "261",
    "name": "Madagaskar",
    "enName": "Madagascar",
    "flag": "mg",
    "priority": false
  },
  {
    "code": "MO",
    "dial": "+853",
    "dialNum": "853",
    "name": "Makau DAK Tiongkok",
    "enName": "Macao SAR China",
    "flag": "mo",
    "priority": false
  },
  {
    "code": "MK",
    "dial": "+389",
    "dialNum": "389",
    "name": "Makedonia Utara",
    "enName": "North Macedonia",
    "flag": "mk",
    "priority": false
  },
  {
    "code": "MV",
    "dial": "+960",
    "dialNum": "960",
    "name": "Maladewa",
    "enName": "Maldives",
    "flag": "mv",
    "priority": false
  },
  {
    "code": "MW",
    "dial": "+265",
    "dialNum": "265",
    "name": "Malawi",
    "enName": "Malawi",
    "flag": "mw",
    "priority": false
  },
  {
    "code": "ML",
    "dial": "+223",
    "dialNum": "223",
    "name": "Mali",
    "enName": "Mali",
    "flag": "ml",
    "priority": false
  },
  {
    "code": "MT",
    "dial": "+356",
    "dialNum": "356",
    "name": "Malta",
    "enName": "Malta",
    "flag": "mt",
    "priority": false
  },
  {
    "code": "MA",
    "dial": "+212",
    "dialNum": "212",
    "name": "Maroko",
    "enName": "Morocco",
    "flag": "ma",
    "priority": false
  },
  {
    "code": "MQ",
    "dial": "+596",
    "dialNum": "596",
    "name": "Martinik",
    "enName": "Martinique",
    "flag": "mq",
    "priority": false
  },
  {
    "code": "MR",
    "dial": "+222",
    "dialNum": "222",
    "name": "Mauritania",
    "enName": "Mauritania",
    "flag": "mr",
    "priority": false
  },
  {
    "code": "MU",
    "dial": "+230",
    "dialNum": "230",
    "name": "Mauritius",
    "enName": "Mauritius",
    "flag": "mu",
    "priority": false
  },
  {
    "code": "YT",
    "dial": "+262",
    "dialNum": "262",
    "name": "Mayotte",
    "enName": "Mayotte",
    "flag": "yt",
    "priority": false
  },
  {
    "code": "MX",
    "dial": "+52",
    "dialNum": "52",
    "name": "Meksiko",
    "enName": "Mexico",
    "flag": "mx",
    "priority": false
  },
  {
    "code": "FM",
    "dial": "+691",
    "dialNum": "691",
    "name": "Mikronesia",
    "enName": "Micronesia",
    "flag": "fm",
    "priority": false
  },
  {
    "code": "MD",
    "dial": "+373",
    "dialNum": "373",
    "name": "Moldova",
    "enName": "Moldova",
    "flag": "md",
    "priority": false
  },
  {
    "code": "MC",
    "dial": "+377",
    "dialNum": "377",
    "name": "Monako",
    "enName": "Monaco",
    "flag": "mc",
    "priority": false
  },
  {
    "code": "MN",
    "dial": "+976",
    "dialNum": "976",
    "name": "Mongolia",
    "enName": "Mongolia",
    "flag": "mn",
    "priority": false
  },
  {
    "code": "ME",
    "dial": "+382",
    "dialNum": "382",
    "name": "Montenegro",
    "enName": "Montenegro",
    "flag": "me",
    "priority": false
  },
  {
    "code": "MS",
    "dial": "+1",
    "dialNum": "1",
    "name": "Montserrat",
    "enName": "Montserrat",
    "flag": "ms",
    "priority": false
  },
  {
    "code": "MZ",
    "dial": "+258",
    "dialNum": "258",
    "name": "Mozambik",
    "enName": "Mozambique",
    "flag": "mz",
    "priority": false
  },
  {
    "code": "MM",
    "dial": "+95",
    "dialNum": "95",
    "name": "Myanmar (Burma)",
    "enName": "Myanmar (Burma)",
    "flag": "mm",
    "priority": false
  },
  {
    "code": "NA",
    "dial": "+264",
    "dialNum": "264",
    "name": "Namibia",
    "enName": "Namibia",
    "flag": "na",
    "priority": false
  },
  {
    "code": "NR",
    "dial": "+674",
    "dialNum": "674",
    "name": "Nauru",
    "enName": "Nauru",
    "flag": "nr",
    "priority": false
  },
  {
    "code": "NP",
    "dial": "+977",
    "dialNum": "977",
    "name": "Nepal",
    "enName": "Nepal",
    "flag": "np",
    "priority": false
  },
  {
    "code": "NE",
    "dial": "+227",
    "dialNum": "227",
    "name": "Niger",
    "enName": "Niger",
    "flag": "ne",
    "priority": false
  },
  {
    "code": "NG",
    "dial": "+234",
    "dialNum": "234",
    "name": "Nigeria",
    "enName": "Nigeria",
    "flag": "ng",
    "priority": false
  },
  {
    "code": "NI",
    "dial": "+505",
    "dialNum": "505",
    "name": "Nikaragua",
    "enName": "Nicaragua",
    "flag": "ni",
    "priority": false
  },
  {
    "code": "NU",
    "dial": "+683",
    "dialNum": "683",
    "name": "Niue",
    "enName": "Niue",
    "flag": "nu",
    "priority": false
  },
  {
    "code": "NO",
    "dial": "+47",
    "dialNum": "47",
    "name": "Norwegia",
    "enName": "Norway",
    "flag": "no",
    "priority": false
  },
  {
    "code": "PK",
    "dial": "+92",
    "dialNum": "92",
    "name": "Pakistan",
    "enName": "Pakistan",
    "flag": "pk",
    "priority": false
  },
  {
    "code": "PW",
    "dial": "+680",
    "dialNum": "680",
    "name": "Palau",
    "enName": "Palau",
    "flag": "pw",
    "priority": false
  },
  {
    "code": "PA",
    "dial": "+507",
    "dialNum": "507",
    "name": "Panama",
    "enName": "Panama",
    "flag": "pa",
    "priority": false
  },
  {
    "code": "PG",
    "dial": "+675",
    "dialNum": "675",
    "name": "Papua Nugini",
    "enName": "Papua New Guinea",
    "flag": "pg",
    "priority": false
  },
  {
    "code": "PY",
    "dial": "+595",
    "dialNum": "595",
    "name": "Paraguay",
    "enName": "Paraguay",
    "flag": "py",
    "priority": false
  },
  {
    "code": "PE",
    "dial": "+51",
    "dialNum": "51",
    "name": "Peru",
    "enName": "Peru",
    "flag": "pe",
    "priority": false
  },
  {
    "code": "PL",
    "dial": "+48",
    "dialNum": "48",
    "name": "Polandia",
    "enName": "Poland",
    "flag": "pl",
    "priority": false
  },
  {
    "code": "PF",
    "dial": "+689",
    "dialNum": "689",
    "name": "Polinesia Prancis",
    "enName": "French Polynesia",
    "flag": "pf",
    "priority": false
  },
  {
    "code": "PT",
    "dial": "+351",
    "dialNum": "351",
    "name": "Portugal",
    "enName": "Portugal",
    "flag": "pt",
    "priority": false
  },
  {
    "code": "FR",
    "dial": "+33",
    "dialNum": "33",
    "name": "Prancis",
    "enName": "France",
    "flag": "fr",
    "priority": false
  },
  {
    "code": "PR",
    "dial": "+1",
    "dialNum": "1",
    "name": "Puerto Riko",
    "enName": "Puerto Rico",
    "flag": "pr",
    "priority": false
  },
  {
    "code": "AC",
    "dial": "+247",
    "dialNum": "247",
    "name": "Pulau Ascension",
    "enName": "Ascension Island",
    "flag": "sh-ac",
    "priority": false
  },
  {
    "code": "IM",
    "dial": "+44",
    "dialNum": "44",
    "name": "Pulau Man",
    "enName": "Isle of Man",
    "flag": "im",
    "priority": false
  },
  {
    "code": "CX",
    "dial": "+61",
    "dialNum": "61",
    "name": "Pulau Natal",
    "enName": "Christmas Island",
    "flag": "cx",
    "priority": false
  },
  {
    "code": "CF",
    "dial": "+236",
    "dialNum": "236",
    "name": "Republik Afrika Tengah",
    "enName": "Central African Republic",
    "flag": "cf",
    "priority": false
  },
  {
    "code": "DO",
    "dial": "+1",
    "dialNum": "1",
    "name": "Republik Dominika",
    "enName": "Dominican Republic",
    "flag": "do",
    "priority": false
  },
  {
    "code": "RE",
    "dial": "+262",
    "dialNum": "262",
    "name": "Réunion",
    "enName": "Réunion",
    "flag": "re",
    "priority": false
  },
  {
    "code": "RO",
    "dial": "+40",
    "dialNum": "40",
    "name": "Rumania",
    "enName": "Romania",
    "flag": "ro",
    "priority": false
  },
  {
    "code": "RU",
    "dial": "+7",
    "dialNum": "7",
    "name": "Rusia",
    "enName": "Russia",
    "flag": "ru",
    "priority": false
  },
  {
    "code": "RW",
    "dial": "+250",
    "dialNum": "250",
    "name": "Rwanda",
    "enName": "Rwanda",
    "flag": "rw",
    "priority": false
  },
  {
    "code": "EH",
    "dial": "+212",
    "dialNum": "212",
    "name": "Sahara Barat",
    "enName": "Western Sahara",
    "flag": "eh",
    "priority": false
  },
  {
    "code": "BL",
    "dial": "+590",
    "dialNum": "590",
    "name": "Saint Barthélemy",
    "enName": "St. Barthélemy",
    "flag": "bl",
    "priority": false
  },
  {
    "code": "SH",
    "dial": "+290",
    "dialNum": "290",
    "name": "Saint Helena",
    "enName": "St. Helena",
    "flag": "sh",
    "priority": false
  },
  {
    "code": "KN",
    "dial": "+1",
    "dialNum": "1",
    "name": "Saint Kitts dan Nevis",
    "enName": "St. Kitts & Nevis",
    "flag": "kn",
    "priority": false
  },
  {
    "code": "LC",
    "dial": "+1",
    "dialNum": "1",
    "name": "Saint Lucia",
    "enName": "St. Lucia",
    "flag": "lc",
    "priority": false
  },
  {
    "code": "MF",
    "dial": "+590",
    "dialNum": "590",
    "name": "Saint Martin",
    "enName": "St. Martin",
    "flag": "mf",
    "priority": false
  },
  {
    "code": "PM",
    "dial": "+508",
    "dialNum": "508",
    "name": "Saint Pierre dan Miquelon",
    "enName": "St. Pierre & Miquelon",
    "flag": "pm",
    "priority": false
  },
  {
    "code": "VC",
    "dial": "+1",
    "dialNum": "1",
    "name": "Saint Vincent dan Grenadine",
    "enName": "St. Vincent & Grenadines",
    "flag": "vc",
    "priority": false
  },
  {
    "code": "WS",
    "dial": "+685",
    "dialNum": "685",
    "name": "Samoa",
    "enName": "Samoa",
    "flag": "ws",
    "priority": false
  },
  {
    "code": "AS",
    "dial": "+1",
    "dialNum": "1",
    "name": "Samoa Amerika",
    "enName": "American Samoa",
    "flag": "as",
    "priority": false
  },
  {
    "code": "SM",
    "dial": "+378",
    "dialNum": "378",
    "name": "San Marino",
    "enName": "San Marino",
    "flag": "sm",
    "priority": false
  },
  {
    "code": "ST",
    "dial": "+239",
    "dialNum": "239",
    "name": "Sao Tome dan Principe",
    "enName": "São Tomé & Príncipe",
    "flag": "st",
    "priority": false
  },
  {
    "code": "NZ",
    "dial": "+64",
    "dialNum": "64",
    "name": "Selandia Baru",
    "enName": "New Zealand",
    "flag": "nz",
    "priority": false
  },
  {
    "code": "SN",
    "dial": "+221",
    "dialNum": "221",
    "name": "Senegal",
    "enName": "Senegal",
    "flag": "sn",
    "priority": false
  },
  {
    "code": "RS",
    "dial": "+381",
    "dialNum": "381",
    "name": "Serbia",
    "enName": "Serbia",
    "flag": "rs",
    "priority": false
  },
  {
    "code": "SC",
    "dial": "+248",
    "dialNum": "248",
    "name": "Seychelles",
    "enName": "Seychelles",
    "flag": "sc",
    "priority": false
  },
  {
    "code": "SL",
    "dial": "+232",
    "dialNum": "232",
    "name": "Sierra Leone",
    "enName": "Sierra Leone",
    "flag": "sl",
    "priority": false
  },
  {
    "code": "SX",
    "dial": "+1",
    "dialNum": "1",
    "name": "Sint Maarten",
    "enName": "Sint Maarten",
    "flag": "sx",
    "priority": false
  },
  {
    "code": "CY",
    "dial": "+357",
    "dialNum": "357",
    "name": "Siprus",
    "enName": "Cyprus",
    "flag": "cy",
    "priority": false
  },
  {
    "code": "SK",
    "dial": "+421",
    "dialNum": "421",
    "name": "Slovakia",
    "enName": "Slovakia",
    "flag": "sk",
    "priority": false
  },
  {
    "code": "SI",
    "dial": "+386",
    "dialNum": "386",
    "name": "Slovenia",
    "enName": "Slovenia",
    "flag": "si",
    "priority": false
  },
  {
    "code": "SO",
    "dial": "+252",
    "dialNum": "252",
    "name": "Somalia",
    "enName": "Somalia",
    "flag": "so",
    "priority": false
  },
  {
    "code": "ES",
    "dial": "+34",
    "dialNum": "34",
    "name": "Spanyol",
    "enName": "Spain",
    "flag": "es",
    "priority": false
  },
  {
    "code": "LK",
    "dial": "+94",
    "dialNum": "94",
    "name": "Sri Lanka",
    "enName": "Sri Lanka",
    "flag": "lk",
    "priority": false
  },
  {
    "code": "SD",
    "dial": "+249",
    "dialNum": "249",
    "name": "Sudan",
    "enName": "Sudan",
    "flag": "sd",
    "priority": false
  },
  {
    "code": "SS",
    "dial": "+211",
    "dialNum": "211",
    "name": "Sudan Selatan",
    "enName": "South Sudan",
    "flag": "ss",
    "priority": false
  },
  {
    "code": "SY",
    "dial": "+963",
    "dialNum": "963",
    "name": "Suriah",
    "enName": "Syria",
    "flag": "sy",
    "priority": false
  },
  {
    "code": "SR",
    "dial": "+597",
    "dialNum": "597",
    "name": "Suriname",
    "enName": "Suriname",
    "flag": "sr",
    "priority": false
  },
  {
    "code": "SE",
    "dial": "+46",
    "dialNum": "46",
    "name": "Swedia",
    "enName": "Sweden",
    "flag": "se",
    "priority": false
  },
  {
    "code": "CH",
    "dial": "+41",
    "dialNum": "41",
    "name": "Swiss",
    "enName": "Switzerland",
    "flag": "ch",
    "priority": false
  },
  {
    "code": "TW",
    "dial": "+886",
    "dialNum": "886",
    "name": "Taiwan",
    "enName": "Taiwan",
    "flag": "tw",
    "priority": false
  },
  {
    "code": "TJ",
    "dial": "+992",
    "dialNum": "992",
    "name": "Tajikistan",
    "enName": "Tajikistan",
    "flag": "tj",
    "priority": false
  },
  {
    "code": "CV",
    "dial": "+238",
    "dialNum": "238",
    "name": "Tanjung Verde",
    "enName": "Cape Verde",
    "flag": "cv",
    "priority": false
  },
  {
    "code": "TZ",
    "dial": "+255",
    "dialNum": "255",
    "name": "Tanzania",
    "enName": "Tanzania",
    "flag": "tz",
    "priority": false
  },
  {
    "code": "TH",
    "dial": "+66",
    "dialNum": "66",
    "name": "Thailand",
    "enName": "Thailand",
    "flag": "th",
    "priority": false
  },
  {
    "code": "TL",
    "dial": "+670",
    "dialNum": "670",
    "name": "Timor Leste",
    "enName": "Timor-Leste",
    "flag": "tl",
    "priority": false
  },
  {
    "code": "CN",
    "dial": "+86",
    "dialNum": "86",
    "name": "Tiongkok",
    "enName": "China",
    "flag": "cn",
    "priority": false
  },
  {
    "code": "TG",
    "dial": "+228",
    "dialNum": "228",
    "name": "Togo",
    "enName": "Togo",
    "flag": "tg",
    "priority": false
  },
  {
    "code": "TK",
    "dial": "+690",
    "dialNum": "690",
    "name": "Tokelau",
    "enName": "Tokelau",
    "flag": "tk",
    "priority": false
  },
  {
    "code": "TO",
    "dial": "+676",
    "dialNum": "676",
    "name": "Tonga",
    "enName": "Tonga",
    "flag": "to",
    "priority": false
  },
  {
    "code": "TT",
    "dial": "+1",
    "dialNum": "1",
    "name": "Trinidad dan Tobago",
    "enName": "Trinidad & Tobago",
    "flag": "tt",
    "priority": false
  },
  {
    "code": "TA",
    "dial": "+290",
    "dialNum": "290",
    "name": "Tristan da Cunha",
    "enName": "Tristan da Cunha",
    "flag": "sh-ta",
    "priority": false
  },
  {
    "code": "TN",
    "dial": "+216",
    "dialNum": "216",
    "name": "Tunisia",
    "enName": "Tunisia",
    "flag": "tn",
    "priority": false
  },
  {
    "code": "TM",
    "dial": "+993",
    "dialNum": "993",
    "name": "Turkmenistan",
    "enName": "Turkmenistan",
    "flag": "tm",
    "priority": false
  },
  {
    "code": "TV",
    "dial": "+688",
    "dialNum": "688",
    "name": "Tuvalu",
    "enName": "Tuvalu",
    "flag": "tv",
    "priority": false
  },
  {
    "code": "UG",
    "dial": "+256",
    "dialNum": "256",
    "name": "Uganda",
    "enName": "Uganda",
    "flag": "ug",
    "priority": false
  },
  {
    "code": "UA",
    "dial": "+380",
    "dialNum": "380",
    "name": "Ukraina",
    "enName": "Ukraine",
    "flag": "ua",
    "priority": false
  },
  {
    "code": "UY",
    "dial": "+598",
    "dialNum": "598",
    "name": "Uruguay",
    "enName": "Uruguay",
    "flag": "uy",
    "priority": false
  },
  {
    "code": "UZ",
    "dial": "+998",
    "dialNum": "998",
    "name": "Uzbekistan",
    "enName": "Uzbekistan",
    "flag": "uz",
    "priority": false
  },
  {
    "code": "VU",
    "dial": "+678",
    "dialNum": "678",
    "name": "Vanuatu",
    "enName": "Vanuatu",
    "flag": "vu",
    "priority": false
  },
  {
    "code": "VA",
    "dial": "+39",
    "dialNum": "39",
    "name": "Vatikan",
    "enName": "Vatican City",
    "flag": "va",
    "priority": false
  },
  {
    "code": "VE",
    "dial": "+58",
    "dialNum": "58",
    "name": "Venezuela",
    "enName": "Venezuela",
    "flag": "ve",
    "priority": false
  },
  {
    "code": "VN",
    "dial": "+84",
    "dialNum": "84",
    "name": "Vietnam",
    "enName": "Vietnam",
    "flag": "vn",
    "priority": false
  },
  {
    "code": "IO",
    "dial": "+246",
    "dialNum": "246",
    "name": "Wilayah Inggris di Samudra Hindia",
    "enName": "British Indian Ocean Territory",
    "flag": "io",
    "priority": false
  },
  {
    "code": "GR",
    "dial": "+30",
    "dialNum": "30",
    "name": "Yunani",
    "enName": "Greece",
    "flag": "gr",
    "priority": false
  },
  {
    "code": "ZM",
    "dial": "+260",
    "dialNum": "260",
    "name": "Zambia",
    "enName": "Zambia",
    "flag": "zm",
    "priority": false
  },
  {
    "code": "ZW",
    "dial": "+263",
    "dialNum": "263",
    "name": "Zimbabwe",
    "enName": "Zimbabwe",
    "flag": "zw",
    "priority": false
  }
];

/** @type {CountryInfo} */
export const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // Indonesia (+62)

/**
 * Mencari data negara berdasarkan kode ISO (ID, MY), dial (+62, 62), atau nama negara.
 * @param {string} codeOrDial - Kode ISO, dial number, atau teks query
 * @returns {CountryInfo} Objek data negara atau DEFAULT_COUNTRY jika tidak ditemukan
 */
export function findCountry(codeOrDial) {
  if (!codeOrDial) return DEFAULT_COUNTRY;
  const cleaned = String(codeOrDial).trim().toUpperCase();
  return (
    COUNTRY_CODES.find(
      (c) =>
        c.code === cleaned ||
        c.dial === cleaned ||
        c.dialNum === cleaned ||
        c.dial === `+${cleaned}` ||
        c.name.toUpperCase() === cleaned ||
        c.enName.toUpperCase() === cleaned
    ) || DEFAULT_COUNTRY
  );
}

/**
 * Mengurai string nomor HP menjadi informasi terstruktur menggunakan libphonenumber-js
 * dengan fallback tangguh untuk nomor yang sedang diketik sebagian.
 * 
 * @param {string} rawPhone - String nomor telepon mentah
 * @param {CountryInfo} [fallbackCountry=DEFAULT_COUNTRY] - Negara cadangan jika tidak terdeteksi
 * @returns {{ country: CountryInfo, nationalNumber: string, fullPhone: string, isValid: boolean }}
 */
export function parsePhoneNumber(rawPhone, fallbackCountry = DEFAULT_COUNTRY) {
  if (!rawPhone) {
    return { country: fallbackCountry, nationalNumber: '', fullPhone: '', isValid: false };
  }

  let cleaned = String(rawPhone).trim();

  // 1. Coba parse menggunakan libphonenumber-js
  try {
    const defaultRegion = fallbackCountry?.code || 'ID';
    const parsed = parsePhoneNumberFromString(cleaned, defaultRegion);
    if (parsed) {
      const country = findCountry(parsed.country || defaultRegion);
      return {
        country,
        nationalNumber: parsed.nationalNumber || '',
        fullPhone: parsed.countryCallingCode + (parsed.nationalNumber || ''),
        isValid: parsed.isValid()
      };
    }
  } catch (err) {
    // Lanjutkan ke heuristic fallback jika libphonenumber gagal
  }

  // 2. Heuristic manual untuk pengetikan bertahap (as-you-type)
  let digits = cleaned.replace(/[^0-9+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);

  // Jika diawali 08 (format nomor lokal Indonesia)
  if (digits.startsWith('08')) {
    return {
      country: DEFAULT_COUNTRY,
      nationalNumber: digits.slice(1),
      fullPhone: '62' + digits.slice(1),
      isValid: digits.length >= 10 && digits.length <= 14
    };
  }

  // Cek kecocokan dialNum dari negara prioritas lalu seluruh negara
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dialNum.length - a.dialNum.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dialNum) && digits.length > c.dialNum.length) {
      const nat = digits.slice(c.dialNum.length);
      return {
        country: c,
        nationalNumber: nat,
        fullPhone: c.dialNum + nat,
        isValid: nat.length >= 6 && nat.length <= 15
      };
    }
  }

  // Fallback ke negara yang sedang dipilih
  let nat = digits;
  if (nat.startsWith('0')) nat = nat.slice(1);
  return {
    country: fallbackCountry,
    nationalNumber: nat,
    fullPhone: (fallbackCountry?.dialNum || '62') + nat,
    isValid: nat.length >= 6 && nat.length <= 15
  };
}

/**
 * Memformat nomor telepon ke format internasional standar E.164 (tanpa tanda plus, siap untuk gateway WhatsApp).
 * Contoh: '0812-3456-7890' -> '6281234567890'
 * 
 * @param {string} phone - Nomor telepon input
 * @param {string} [defaultRegion='ID'] - Region default jika tidak memiliki dial code
 * @returns {string} Nomor telepon dalam digit E.164
 */
export function formatToWhatsAppE164(phone, defaultRegion = 'ID') {
  if (!phone) return '';
  const parsed = parsePhoneNumber(phone, findCountry(defaultRegion));
  return parsed.fullPhone;
}
