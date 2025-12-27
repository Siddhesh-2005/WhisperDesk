import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Uses Gemini AI to perform deep moderation, category validation, and tag generation.
 * @param {string} content - The post content
 * @param {string} userCategory - The category selected by the user
 * @returns {Promise<Object>} { decision: 'APPROVED'|'REJECTED', category: string, suggestedTags: string[], reason: string }
 */
export async function checkWithGemini(content, userCategory) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" } // FORCES JSON OUTPUT
        });

        const prompt = `
            System Instruction:
            You are a moderator for an anonymous Indian college app. 
            You understand Hinglish (Hindi written in English script) and common Indian slang.

            Task:
            1. Safety: Reject if the text contains high-level toxicity, self-harm, or illegal medical advice.
            2. Categorization: Validate if the post matches the category: "${userCategory}". 
               Categories available: [confession, academics, career, relationships, rant, help, general].
               If the post matches a different category better, switch it.
            3. Tagging: Generate 3 relevant hashtags.

            Post Content: "${content}"

            Return ONLY this JSON structure:
            {
                "decision": "APPROVED" or "REJECTED",
                "category": "final category name",
                "suggestedTags": ["tag1", "tag2", "tag3"],
                "reason": "short explanation if rejected, otherwise empty"
            }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Safety check for parsing
        return JSON.parse(responseText);

    } catch (error) {
        console.error("⚠️ Gemini API Error:", error.message);
        // Fallback: If Gemini fails, we default to APPROVED but keep user category
        return {
            decision: "APPROVED",
            category: userCategory || "general",
            suggestedTags: [],
            reason: "AI Fallback"
        };
    }
}