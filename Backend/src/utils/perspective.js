import axios from "axios";

const PERSPECTIVE_URL =
  "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze";

const ALL_ATTRIBUTES = {
  TOXICITY: {},
  SEVERE_TOXICITY: {},
  INSULT: {},
  PROFANITY: {},
  THREAT: {},
  SEXUALLY_EXPLICIT: {},
  IDENTITY_ATTACK: {},
  HARASSMENT: {},
  HARASSMENT_THREAT: {}
};

export async function perspectiveClient(text) {
  if (!text || !text.trim()) {
    return {
      attributeScores: Object.fromEntries(
        Object.keys(ALL_ATTRIBUTES).map(attr => [
          attr,
          { summaryScore: { value: 0 } }
        ])
      )
    };
  }

  try {
    const response = await axios.post(
      `${PERSPECTIVE_URL}?key=${process.env.PERSPECTIVE_API_KEY}`,
      {
        comment: { text: text.trim() },
        languages: ["en", "hi"],
        requestedAttributes: ALL_ATTRIBUTES,
        doNotStore: true
      },
      { timeout: 5000 }
    );

    return response.data;
  } catch (err) {
    console.error(
      "⚠️ Perspective API Warning:",
      err.response?.data?.error?.message || err.message
    );

    // Conservative fallback: assume medium risk on all attributes
    return {
      attributeScores: Object.fromEntries(
        Object.keys(ALL_ATTRIBUTES).map(attr => [
          attr,
          { summaryScore: { value: 0.5 } }
        ])
      ),
      isFallback: true
    };
  }
}
