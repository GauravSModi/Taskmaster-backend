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


// const generateResponse = async (instructions, query, temp, max_tokens, top_p) => {
const generateResponse = async (prompt) => {
    console.log('Prompt:', prompt);
    const instructions = "Generate a list with the following prompt. Only return list (labelled with 'points'), with an appropriate title (labelled with 'title'). Don't divide list into sub-lists. Make it reasonably sized, max 15 items. Return in JSON format.";
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
                    "content": prompt
                }
            ],
            // TODO: take input from user about how createive or long they want response
            // temperature: temp,
            // max_tokens: max_tokens,
            // top_p: top_p
            temperature: 0.7,
            max_tokens: 500,
            top_p: 1,
        });
        if (completion.choices[0]){
            // console.log("c:", completion)
            let response = completion.choices[0].message.content;
            response = JSON.parse(response);
            console.log(response)

            return [200, response.title, response.points]
        }
    } catch (error) {
        console.log("Error communicating with OpenAI API:", error);
        throw error;
    }
};


module.exports = {
    generateResponse
}