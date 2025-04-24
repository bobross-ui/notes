import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    // Get the note text from the request body
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request body. "text" field is required.' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    // Initialize the model with the updated model name
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create an improved prompt for better formatted summaries
    const prompt = `Summarize this note content in a clean, minimal format:

${text}

Format requirements:
1. Start immediately with the content - NO introductory phrases like "Here's a summary" or "In summary"
2. Use a single asterisk (*) at the start of each key point (with a space after the asterisk)
3. For category headings, use: ** Category Name ** (with spaces around the text)
4. Keep it brief and focused on actionable items
5. Include only the essential information
6. Use simple, direct language with no fluff`;

    // Generate the summary
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    // Return the summary
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in summarization API:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
} 