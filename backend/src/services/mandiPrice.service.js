import axios from "axios";

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

// Maps our internal crop keys to the commodity names used in the government dataset
const COMMODITY_NAME_MAP = {
  wheat: "Wheat",
  tomato: "Tomato",
};

/**
 * Fetches today's mandi (market) prices for a crop, optionally filtered by state.
 * Returns modal price (most common transaction price) per market.
 */
export async function getMandiPrices(cropKey, state = "Uttar Pradesh") {
  const commodity = COMMODITY_NAME_MAP[cropKey];
  if (!commodity) {
    throw new Error(`No mandi price mapping for crop: ${cropKey}`);
  }

  const response = await axios.get(BASE_URL, {
    params: {
      "api-key": process.env.MANDI_API_KEY,
      format: "json",
      limit: 20,
      "filters[commodity]": commodity,
      "filters[state.keyword]": state,
    },
  });

  const records = response.data.records || [];

  const prices = records.map((r) => ({
    market: r.market,
    district: r.district,
    variety: r.variety,
    minPrice: Number(r.min_price),
    maxPrice: Number(r.max_price),
    modalPrice: Number(r.modal_price),
    arrivalDate: r.arrival_date,
  }));

  // Sort by modal price ascending (cheapest first) - useful if selling vs buying context matters later
  prices.sort((a, b) => a.modalPrice - b.modalPrice);

  const avgModalPrice = prices.length
    ? Math.round(prices.reduce((sum, p) => sum + p.modalPrice, 0) / prices.length)
    : null;

  return {
    commodity,
    state,
    marketsFound: prices.length,
    averageModalPrice: avgModalPrice,
    markets: prices,
  };
}