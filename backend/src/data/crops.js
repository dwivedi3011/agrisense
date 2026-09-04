// Crop lookup data, sourced from Indian agricultural extension guidance.
// Wheat: DAS (days-after-sowing) milestones from hill/plains extension package
//   (pragya.org Wheat Cultivation Practices) + ICAR phenology studies confirming
//   ~140-145 day total crop duration for North Indian irrigated wheat.
// Tomato: North India sowing windows + NPK schedule from horticulture extension
//   guidance; stage durations from general tomato growth-stage references,
//   cross-checked against National Horticulture Board (nhb.gov.in) harvest timing.
//   NOTE: for tomato, "sowingDate" in the app should be the TRANSPLANTING date,
//   not the nursery seed-sowing date, since that's what farmers track in-field.

export const crops = {
  wheat: {
    label: "Wheat",
    icon: "🌾",
    season: "Rabi",
    sowingWindow: { start: "11-15", end: "12-05" }, // MM-DD, irrigated timely sowing
    trackFrom: "sowing",
    stages: [
      {
        name: "germination",
        durationDays: 25, // through Crown Root Initiation (~20-25 DAS)
        care: "First weeding around day 30-35. Ensure adequate moisture at Crown Root Initiation (~day 20-25) — this is a critical irrigation stage.",
        npk: "1/3 of nitrogen dose applied at sowing along with full phosphorus and potassium.",
      },
      {
        name: "vegetative_tillering",
        durationDays: 35, // day 25-60: tillering (~40-45 DAS) through pre-jointing
        care: "Second weeding around day 45-50. Monitor tiller development — this determines final grain-bearing stems.",
        npk: "Second 1/3 of nitrogen applied during first irrigation (around Crown Root Initiation / early tillering).",
      },
      {
        name: "jointing_to_flowering",
        durationDays: 25, // day 60-85: jointing (~60-65 DAS) to flowering (~80-85 DAS)
        care: "Most sensitive stage for water stress. Watch for aphids and rust as canopy closes.",
        npk: "Final 1/3 of nitrogen applied at spike-initiation stage (~day 60-65, jointing).",
      },
      {
        name: "milk_to_maturity",
        durationDays: 60, // day 85-145: milking (~100-105 DAS), dough (~120-125 DAS), harvest (~140-145 DAS)
        care: "Reduce irrigation as grain hardens through milk and dough stages. Monitor weather closely for harvest timing (~day 140-145).",
        npk: "No further fertilizer needed.",
      },
    ],
  },
  tomato: {
    label: "Tomato",
    icon: "🍅",
    season: "Kharif/Rabi/Zaid (year-round with regional windows)",
    sowingWindow: { start: "06-15", end: "07-15" }, // main North India window: June-July for winter crop
    additionalWindows: [
      { label: "Spring-summer crop", start: "11-01", end: "11-30" },
      { label: "Rainy-season crop", start: "03-01", end: "03-31" },
    ],
    trackFrom: "transplanting", // nursery sowing happens ~4-6 weeks earlier
    stages: [
      {
        name: "post_transplant_establishment",
        durationDays: 20,
        care: "Keep soil consistently moist. Stake or cage plants as they establish. Watch for transplant shock.",
        npk: "Full dose of phosphorus and potassium (100kg/ha each) plus 40kg/ha nitrogen applied at transplanting.",
      },
      {
        name: "vegetative",
        durationDays: 22, // day 20-42, aligned with first flowering ~4-6 weeks post-transplant
        care: "Rapid vegetative growth. Watch for early blight on lower leaves in humid conditions.",
        npk: "40kg/ha nitrogen top-dressing at ~20 days after transplanting.",
      },
      {
        name: "flowering",
        durationDays: 20,
        care: "Ensure consistent watering — irregular watering causes blossom-end rot. Avoid excess nitrogen, which delays flowering.",
        npk: "40kg/ha nitrogen applied just before flowering.",
      },
      {
        name: "fruiting_to_harvest",
        durationDays: 25, // first fruit ripening ~60-70 days post-transplant total
        care: "First picking begins ~60-70 days after transplanting. Watch for late blight in humid conditions. Harvest continues over 10-15 weeks.",
        npk: "Final 40kg/ha nitrogen applied after first harvest, to support continued fruiting.",
      },
    ],
  },
};