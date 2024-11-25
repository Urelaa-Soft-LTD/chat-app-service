const ROOT_URL = process.env.REMOTE_URL;
const API_URL = `${ROOT_URL ?? "https://api.cart24.qa"}`;

const GET_CHAT_SUGGESTION_API = `${API_URL}/chat-suggestions/id`;
module.exports = {
  ROOT_URL,
  GET_CHAT_SUGGESTION_API,
};

