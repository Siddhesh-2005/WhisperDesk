import axios from "axios";

const PERSPECTIVE_URL = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze";

export async function perspectiveClient(text) {
    if (!text || !text.trim()) {
        return { 
            attributeScores: { 
                TOXICITY: { summaryScore: { value: 0 } }, 
                INSULT: { summaryScore: { value: 0 } } 
            } 
        };
    }

    try {
        const response = await axios.post(
            `${PERSPECTIVE_URL}?key=${process.env.PERSPECTIVE_API_KEY}`,
            {
                comment: { text: text.trim() },
                languages: ["en", "hi"], 
                requestedAttributes: {
                    TOXICITY: {},
                    INSULT: {} 
                },
                doNotStore: true 
            },
            { timeout: 5000 } 
        );

        return response.data;
    } catch (err) {

        console.error("⚠️ Perspective API Warning:", err.response?.data?.error?.message || err.message);
        
        return {
            attributeScores: {
                TOXICITY: { summaryScore: { value: 0.5 } },
                INSULT: { summaryScore: { value: 0.5 } }
            },
            isFallback: true
        };
    }
}