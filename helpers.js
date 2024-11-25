const axios = require("axios");
const fetchSuggestionAns = async (url, params) => {
  try {
    console.log('Fetching suggestion', url, params);
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching suggestion:", error);
    throw new Error("Failed to fetch suggestion");
  }
};

module.exports = {
  fetchSuggestionAns,
};
