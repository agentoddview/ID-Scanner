export interface AamvaFieldDefinition {
  code: string;
  label: string;
  washingtonLabel?: string;
}

export interface AamvaFieldHelp {
  what: string;
  washingtonUse: string;
  example: string;
}

export interface AamvaFieldSelectOption {
  value: string;
  label: string;
}

export const AAMVA_FIELD_DEFINITIONS: AamvaFieldDefinition[] = [
  { code: "DAA", label: "Full Name", washingtonLabel: "Full legal name" },
  { code: "DAB", label: "Family Name", washingtonLabel: "Family name" },
  { code: "DAC", label: "Given Name", washingtonLabel: "First name" },
  { code: "DAD", label: "Middle Name", washingtonLabel: "Middle name" },
  { code: "DAE", label: "Name Suffix" },
  { code: "DAF", label: "Name Prefix" },
  { code: "DAG", label: "Mailing Street Address1", washingtonLabel: "Mailing address line 1" },
  { code: "DAH", label: "Mailing Street Address2", washingtonLabel: "Mailing address line 2" },
  { code: "DAI", label: "Mailing City", washingtonLabel: "Mailing city" },
  { code: "DAJ", label: "Mailing Jurisdiction Code (State)", washingtonLabel: "Mailing state (WA)" },
  { code: "DAK", label: "Mailing Postal Code", washingtonLabel: "Mailing ZIP" },
  { code: "DAL", label: "Residence Street Address1" },
  { code: "DAM", label: "Residence Street Address2" },
  { code: "DAN", label: "Residence City" },
  { code: "DAO", label: "Residence Jurisdiction Code" },
  { code: "DAP", label: "Residence Postal Code" },
  { code: "DAQ", label: "License or ID Number", washingtonLabel: "Washington license or ID number" },
  { code: "DAR", label: "License Classification Code", washingtonLabel: "Washington class code" },
  { code: "DAS", label: "License Restriction Code", washingtonLabel: "Washington restrictions" },
  { code: "DAT", label: "License Endorsements Code", washingtonLabel: "Washington endorsements" },
  { code: "DAU", label: "Height in FT_IN" },
  { code: "DAV", label: "Height in CM" },
  { code: "DAW", label: "Weight in LBS" },
  { code: "DAX", label: "Weight in KG" },
  { code: "DAY", label: "Eye Color" },
  { code: "DAZ", label: "Hair Color" },
  { code: "DBA", label: "License Expiration Date" },
  { code: "DBB", label: "Date of Birth" },
  { code: "DBC", label: "Sex" },
  { code: "DBD", label: "License or ID Document Issue Date" },
  { code: "DBE", label: "Issue Timestamp" },
  { code: "DBF", label: "Number of Duplicates" },
  { code: "DBG", label: "Medical Indicator Codes" },
  { code: "DBH", label: "Organ Donor" },
  { code: "DBI", label: "Non-Resident Indicator" },
  { code: "DBJ", label: "Unique Customer Identifier" },
  { code: "DBK", label: "Social Security Number" },
  { code: "DBL", label: "Date of Birth" },
  { code: "DBM", label: "Social Security Number" },
  { code: "DBN", label: "Full Name" },
  { code: "DBO", label: "Family Name" },
  { code: "DBP", label: "Given Name" },
  { code: "DBQ", label: "Middle Name or Initial" },
  { code: "DBR", label: "Suffix" },
  { code: "DBS", label: "Prefix" },
  { code: "DCA", label: "Specific Class", washingtonLabel: "Washington specific class" },
  { code: "DCB", label: "Specific Restrictions", washingtonLabel: "Washington specific restrictions" },
  { code: "DCD", label: "Specific Endorsements", washingtonLabel: "Washington specific endorsements" },
  { code: "DCE", label: "Physical Description Weight Range" },
  { code: "DCF", label: "Document Discriminator" },
  { code: "DCG", label: "Country territory of issuance" },
  { code: "DCH", label: "Federal Commercial Vehicle Codes" },
  { code: "DCI", label: "Place of birth" },
  { code: "DCJ", label: "Audit information" },
  { code: "DCK", label: "Inventory Control Number" },
  { code: "DCL", label: "Race Ethnicity" },
  { code: "DCM", label: "Standard vehicle classification" },
  { code: "DCN", label: "Standard endorsement code" },
  { code: "DCO", label: "Standard restriction code" },
  { code: "DCP", label: "Jurisdiction specific vehicle classification description" },
  { code: "DCQ", label: "Jurisdiction-specific" },
  { code: "DCR", label: "Jurisdiction specific restriction code description" },
  { code: "DCS", label: "Last Name" },
  { code: "DCT", label: "First Name" },
  { code: "DCU", label: "Suffix" },
  { code: "DDA", label: "Compliance Type" },
  { code: "DDB", label: "Card Revision Date" },
  { code: "DDC", label: "HazMat Endorsement Expiry Date" },
  { code: "DDD", label: "Limited Duration Document Indicator" },
  { code: "DDE", label: "Family Name Truncation" },
  { code: "DDF", label: "First Names Truncation" },
  { code: "DDG", label: "Middle Names Truncation" },
  { code: "DDH", label: "Under 18 Until" },
  { code: "DDI", label: "Under 19 Until" },
  { code: "DDJ", label: "Under 21 Until" },
  { code: "DDK", label: "Organ Donor Indicator" },
  { code: "DDL", label: "Veteran Indicator" },
  { code: "PAA", label: "Permit Classification Code" },
  { code: "PAB", label: "Permit Expiration Date" },
  { code: "PAC", label: "Permit Identifier" },
  { code: "PAD", label: "Permit IssueDate" },
  { code: "PAE", label: "Permit Restriction Code" },
  { code: "PAF", label: "Permit Endorsement Code" },
  { code: "ZVA", label: "Court Restriction Code", washingtonLabel: "Washington court restriction" },
  { code: "ZxZ", label: "State Specific fields where x is variable" },
  { code: "Zxx", label: "State Specific fields where xx is variable" },
];

export const AAMVA_FIELD_ORDER = AAMVA_FIELD_DEFINITIONS.map((item) => item.code).filter(
  (code) => !code.includes("x"),
);

export const AAMVA_REQUIRED_CORE_CODES = ["DAQ", "DCS", "DAC", "DBB", "DBA", "DBD", "DBC", "DAJ", "DCG"];

export const AAMVA_REQUIRED_CORE_CODES_SET = new Set(AAMVA_REQUIRED_CORE_CODES);

export const AAMVA_WA_DEFAULTS: Record<string, string> = {
  DAJ: "WA",
  DAO: "WA",
  DCG: "USA",
  DBC: "9",
};

export const AAMVA_WA_FIELD_HELP: Record<string, AamvaFieldHelp> = {
  DAQ: {
    what: "Washington license or ID card number.",
    washingtonUse: "Use the exact number on the front of the WA ID card.",
    example: "WDL1234567AB",
  },
  DCS: {
    what: "Primary family/last name.",
    washingtonUse: "Matches the legal surname printed on the WA credential.",
    example: "SMITH",
  },
  DAC: {
    what: "Primary given/first name.",
    washingtonUse: "Use legal first name as it appears on WA ID.",
    example: "JORDAN",
  },
  DAD: {
    what: "Middle name or names.",
    washingtonUse: "Optional if no middle name appears on WA ID.",
    example: "LEE",
  },
  DBA: {
    what: "Credential expiration date.",
    washingtonUse: "Required for WA generation. Use the card's expiration date.",
    example: "2030-08-24",
  },
  DBB: {
    what: "Date of birth.",
    washingtonUse: "Required. Enter holder DOB exactly.",
    example: "1999-01-15",
  },
  DBD: {
    what: "Credential issue date.",
    washingtonUse: "Required for WA generation.",
    example: "2022-08-24",
  },
  DBC: {
    what: "Sex code (1=Male, 2=Female, 9=Not specified).",
    washingtonUse: "WA records commonly encode as 1/2/9 in barcode data.",
    example: "1",
  },
  DAG: {
    what: "Mailing address line 1.",
    washingtonUse: "Street number and name for WA mailing address.",
    example: "9908 WATERS AVE S",
  },
  DAI: {
    what: "Mailing city.",
    washingtonUse: "City associated with mailing address.",
    example: "SEATTLE",
  },
  DAJ: {
    what: "Mailing state/jurisdiction code.",
    washingtonUse: "Required for WA generation and should normally be WA.",
    example: "WA",
  },
  DAK: {
    what: "Mailing postal code.",
    washingtonUse: "WA ZIP (5 or ZIP+4 depending on source data).",
    example: "98118",
  },
  DAR: {
    what: "License class code.",
    washingtonUse: "WA class values like D, C, A, B depending on credential.",
    example: "D",
  },
  DAS: {
    what: "Restriction codes.",
    washingtonUse: "Use WA-specific restriction abbreviations if present.",
    example: "B",
  },
  DAT: {
    what: "Endorsement codes.",
    washingtonUse: "Use WA-specific endorsements for CDL scenarios.",
    example: "N",
  },
  DCF: {
    what: "Document discriminator identifier.",
    washingtonUse: "Unique discriminator tied to printed credential instance.",
    example: "123456789ABCDEF",
  },
  DCG: {
    what: "Issuing country code.",
    washingtonUse: "Required and typically USA for Washington IDs.",
    example: "USA",
  },
  ZVA: {
    what: "State-specific court restriction code.",
    washingtonUse: "WA-specific field when court restrictions are encoded.",
    example: "CR01",
  },
};

export const AAMVA_FIELD_SELECT_OPTIONS: Record<string, AamvaFieldSelectOption[]> = {
  DAJ: [
    { value: "WA", label: "WA - Washington" },
    { value: "OR", label: "OR - Oregon" },
    { value: "ID", label: "ID - Idaho" },
    { value: "CA", label: "CA - California" },
  ],
  DAO: [
    { value: "WA", label: "WA - Washington" },
    { value: "OR", label: "OR - Oregon" },
    { value: "ID", label: "ID - Idaho" },
    { value: "CA", label: "CA - California" },
  ],
  DBC: [
    { value: "1", label: "1 - Male" },
    { value: "2", label: "2 - Female" },
    { value: "9", label: "9 - Not Specified" },
  ],
  DAR: [
    { value: "D", label: "D - Standard Passenger" },
    { value: "C", label: "C - Commercial" },
    { value: "B", label: "B - Commercial Heavy" },
    { value: "A", label: "A - Combination Commercial" },
    { value: "ID", label: "ID - Identification Card" },
  ],
  DAS: [
    { value: "A", label: "A - Corrective Lenses" },
    { value: "B", label: "B - Daylight Only" },
    { value: "C", label: "C - Mechanical Aid" },
    { value: "D", label: "D - Prosthetic Aid" },
    { value: "E", label: "E - Automatic Transmission Only" },
  ],
  DAT: [
    { value: "H", label: "H - Hazardous Materials" },
    { value: "N", label: "N - Tank Vehicle" },
    { value: "P", label: "P - Passenger" },
    { value: "S", label: "S - School Bus" },
    { value: "T", label: "T - Doubles/Triples" },
    { value: "X", label: "X - Tank + HazMat" },
  ],
  DAY: [
    { value: "BLK", label: "Black" },
    { value: "BLU", label: "Blue" },
    { value: "BRO", label: "Brown" },
    { value: "GRY", label: "Gray" },
    { value: "GRN", label: "Green" },
    { value: "HAZ", label: "Hazel" },
    { value: "MAR", label: "Maroon" },
    { value: "PNK", label: "Pink" },
  ],
  DAZ: [
    { value: "BAL", label: "Bald" },
    { value: "BLK", label: "Black" },
    { value: "BLN", label: "Blond" },
    { value: "BRO", label: "Brown" },
    { value: "GRY", label: "Gray" },
    { value: "RED", label: "Red" },
    { value: "SDY", label: "Sandy" },
    { value: "WHI", label: "White" },
  ],
  DCG: [
    { value: "USA", label: "USA - United States" },
    { value: "CAN", label: "CAN - Canada" },
  ],
  DBH: [
    { value: "1", label: "1 - Organ Donor" },
    { value: "0", label: "0 - Not Organ Donor" },
  ],
  DDK: [
    { value: "1", label: "1 - Organ Donor Indicator True" },
    { value: "0", label: "0 - Organ Donor Indicator False" },
  ],
  DDL: [
    { value: "1", label: "1 - Veteran Indicator True" },
    { value: "0", label: "0 - Veteran Indicator False" },
  ],
};
