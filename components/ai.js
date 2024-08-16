require('dotenv').config();
const OpenAI = require('openai');
const axios = require('axios');

// Check for required environment variables
// if (!process.env.OPENAI_API_KEY || !process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CX || !process.env.BING_API_KEY) {
//     throw new Error('Missing required environment variables');
// }

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing required environment variables');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


const generateResponse = async (instructions, query, temp, max_tokens, top_p) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    "role": "system",
                    "content": instructions
                },
                {
                    "role": "user",
                    "content": query
                }
            ],
            temperature: temp,
            max_tokens: max_tokens,
            top_p: top_p
        });
        if (completion.choices[0]){
            console.log(completion.choices[0].message.content);
            return completion.choices[0];
        }
    } catch (error) {
        console.log("Error communicating with OpenAI API:", error);
        throw error;
    }
};
