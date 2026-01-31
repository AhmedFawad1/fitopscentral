const countries = [
  { name: "Afghanistan", iso: "AF", dial: "+93", flag: "🇦🇫", min: 9, max: 9 },
  { name: "Albania", iso: "AL", dial: "+355", flag: "🇦🇱", min: 9, max: 9 },
  { name: "Algeria", iso: "DZ", dial: "+213", flag: "🇩🇿", min: 9, max: 9 },
  { name: "Andorra", iso: "AD", dial: "+376", flag: "🇦🇩", min: 6, max: 9 },
  { name: "Angola", iso: "AO", dial: "+244", flag: "🇦🇴", min: 9, max: 9 },
  { name: "Argentina", iso: "AR", dial: "+54", flag: "🇦🇷", min: 10, max: 11 },
  { name: "Armenia", iso: "AM", dial: "+374", flag: "🇦🇲", min: 8, max: 8 },
  { name: "Australia", iso: "AU", dial: "+61", flag: "🇦🇺", min: 9, max: 9 },
  { name: "Austria", iso: "AT", dial: "+43", flag: "🇦🇹", min: 10, max: 13 },
  { name: "Azerbaijan", iso: "AZ", dial: "+994", flag: "🇦🇿", min: 9, max: 9 },

  { name: "Bahrain", iso: "BH", dial: "+973", flag: "🇧🇭", min: 8, max: 8 },
  { name: "Bangladesh", iso: "BD", dial: "+880", flag: "🇧🇩", min: 10, max: 10 },
  { name: "Belgium", iso: "BE", dial: "+32", flag: "🇧🇪", min: 9, max: 9 },
  { name: "Brazil", iso: "BR", dial: "+55", flag: "🇧🇷", min: 10, max: 11 },
  { name: "Canada", iso: "CA", dial: "+1", flag: "🇨🇦", min: 10, max: 10 },
  { name: "China", iso: "CN", dial: "+86", flag: "🇨🇳", min: 11, max: 11 },

  { name: "Egypt", iso: "EG", dial: "+20", flag: "🇪🇬", min: 10, max: 10 },
  { name: "France", iso: "FR", dial: "+33", flag: "🇫🇷", min: 9, max: 9 },
  { name: "Germany", iso: "DE", dial: "+49", flag: "🇩🇪", min: 10, max: 13 },
  { name: "India", iso: "IN", dial: "+91", flag: "🇮🇳", min: 10, max: 10 },
  { name: "Indonesia", iso: "ID", dial: "+62", flag: "🇮🇩", min: 9, max: 12 },
  { name: "Iran", iso: "IR", dial: "+98", flag: "🇮🇷", min: 10, max: 10 },
  { name: "Iraq", iso: "IQ", dial: "+964", flag: "🇮🇶", min: 10, max: 10 },
  { name: "Ireland", iso: "IE", dial: "+353", flag: "🇮🇪", min: 9, max: 9 },
  { name: "Italy", iso: "IT", dial: "+39", flag: "🇮🇹", min: 9, max: 10 },

  { name: "Japan", iso: "JP", dial: "+81", flag: "🇯🇵", min: 10, max: 10 },
  { name: "Jordan", iso: "JO", dial: "+962", flag: "🇯🇴", min: 9, max: 9 },

  { name: "Kenya", iso: "KE", dial: "+254", flag: "🇰🇪", min: 9, max: 9 },
  { name: "Kuwait", iso: "KW", dial: "+965", flag: "🇰🇼", min: 8, max: 8 },

  { name: "Malaysia", iso: "MY", dial: "+60", flag: "🇲🇾", min: 9, max: 10 },
  { name: "Mexico", iso: "MX", dial: "+52", flag: "🇲🇽", min: 10, max: 10 },

  { name: "Netherlands", iso: "NL", dial: "+31", flag: "🇳🇱", min: 9, max: 9 },
  { name: "New Zealand", iso: "NZ", dial: "+64", flag: "🇳🇿", min: 9, max: 9 },
  { name: "Nigeria", iso: "NG", dial: "+234", flag: "🇳🇬", min: 10, max: 10 },

  { name: "Norway", iso: "NO", dial: "+47", flag: "🇳🇴", min: 8, max: 8 },

  { name: "Oman", iso: "OM", dial: "+968", flag: "🇴🇲", min: 8, max: 8 },

  { name: "Pakistan", iso: "PK", dial: "+92", flag: "🇵🇰", min: 10, max: 10 },
  { name: "Philippines", iso: "PH", dial: "+63", flag: "🇵🇭", min: 10, max: 10 },
  { name: "Poland", iso: "PL", dial: "+48", flag: "🇵🇱", min: 9, max: 9 },
  { name: "Portugal", iso: "PT", dial: "+351", flag: "🇵🇹", min: 9, max: 9 },

  { name: "Qatar", iso: "QA", dial: "+974", flag: "🇶🇦", min: 8, max: 8 },

  { name: "Russia", iso: "RU", dial: "+7", flag: "🇷🇺", min: 10, max: 10 },

  { name: "Saudi Arabia", iso: "SA", dial: "+966", flag: "🇸🇦", min: 9, max: 9 },
  { name: "Singapore", iso: "SG", dial: "+65", flag: "🇸🇬", min: 8, max: 8 },
  { name: "South Africa", iso: "ZA", dial: "+27", flag: "🇿🇦", min: 9, max: 9 },
  { name: "South Korea", iso: "KR", dial: "+82", flag: "🇰🇷", min: 9, max: 10 },
  { name: "Spain", iso: "ES", dial: "+34", flag: "🇪🇸", min: 9, max: 9 },
  { name: "Sweden", iso: "SE", dial: "+46", flag: "🇸🇪", min: 9, max: 9 },
  { name: "Sri Lanka", iso: "LK", dial: "+94", flag: "🇱🇰", min: 9, max: 9 },
  { name: "Switzerland", iso: "CH", dial: "+41", flag: "🇨🇭", min: 9, max: 9 },

  { name: "Thailand", iso: "TH", dial: "+66", flag: "🇹🇭", min: 9, max: 9 },
  { name: "Turkey", iso: "TR", dial: "+90", flag: "🇹🇷", min: 10, max: 10 },

  { name: "United Arab Emirates", iso: "AE", dial: "+971", flag: "🇦🇪", min: 9, max: 9 },
  { name: "United Kingdom", iso: "GB", dial: "+44", flag: "🇬🇧", min: 10, max: 11 },
  { name: "United States", iso: "US", dial: "+1", flag: "🇺🇸", min: 10, max: 10 },

  { name: "Vietnam", iso: "VN", dial: "+84", flag: "🇻🇳", min: 9, max: 10 },
  { name: "Yemen", iso: "YE", dial: "+967", flag: "🇾🇪", min: 9, max: 9 },
  { name: "Zimbabwe", iso: "ZW", dial: "+263", flag: "🇿🇼", min: 9, max: 9 },
];

export function validatePhoneNumber(number) {
    let validatedNumber = null
    number = number.replace(/\s+/g, ''); // remove spaces
    if(!number) return null;
  for (let country of countries) {
    if (number.startsWith(country.dial)) {
        validatedNumber = removeLeadingPlus(number);
    }
  }
  return validatedNumber || `92${number}`; // return original number if no match found
}
const removeLeadingPlus = (number) => {
    if (number.startsWith('+')) {
        return number.slice(1);
    }
    return number;
}
export default countries;
