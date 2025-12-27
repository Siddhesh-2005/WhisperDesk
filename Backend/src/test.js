import OpenAI from "openai";
const openai = new OpenAI({
    apiKey:"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"
});

const moderation = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: "",
});

console.log(moderation);