import { GoogleGenAI } from "@google/genai";
import { DiagnosisResult } from "../types";

// Removed redundant local DiagnosisResult interface; now imported from ../types

export const getAIDiagnosis = async (deviceModel: string, issueDescription: string): Promise<DiagnosisResult | null> => {
  if (!process.env.API_KEY) return null;
  
  // Initialize right before call to ensure up-to-date key access
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are an expert repair technician. 
    Use Google Search to find real-world solutions, common faults, recalls, and forum discussions for the following device and issue.
    
    Device: ${deviceModel}
    Reported Issue: ${issueDescription}
    
    Based on the search results and your technical knowledge, provide:
    1. A list of potential causes (most likely to least likely).
    2. Recommended diagnostic steps.
    3. Estimated difficulty level (1-10).
    4. A concise summary of the issue including any specific known faults found in search.

    Output format: JSON only. Do not include markdown formatting.
    Schema:
    {
      "causes": ["cause 1", "cause 2"],
      "steps": ["step 1", "step 2"],
      "difficulty": 5,
      "summary": "..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        tools: [{googleSearch: {}}],
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    let text = response.text;
    if (!text) return null;

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(text);

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = chunks
        ?.filter((c: any) => c.web)
        .map((c: any) => ({ title: c.web.title, url: c.web.uri })) || [];

    return { ...result, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const summarizeJobNotes = async (notes: string): Promise<string> => {
   if (!process.env.API_KEY) return "API Key not configured.";
   
   const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

   try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a polite customer support agent for a repair shop.
      Task: Read the following technical notes from a technician and write a short, friendly status update message to the customer (for WhatsApp/SMS).
      
      Constraints:
      - Remove internal jargon.
      - Focus on progress and next steps.
      - Keep it under 40 words.
      - Do not include placeholders like [Customer Name], just the message body.
      - Use 1-2 friendly emojis.
      
      Technician Notes: "${notes}"`,
    });
    return response.text || "";
   } catch (error) {
     return "Error summarizing notes.";
   }
};

export const generateQuoteContent = async (customerName: string, items: {name: string, price: number}[], storeName: string): Promise<{terms: string, email: string}> => {
  if (!process.env.API_KEY) return { terms: '', email: '' };

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const itemList = items.map(i => `${i.name} ($${i.price})`).join(', ');

  const prompt = `
    Context: Repair Shop "${storeName}". Customer: "${customerName}".
    Items in Quote: ${itemList}.

    Task 1: Generate professional "Terms & Scope of Work" specific to these items (max 50 words). Focus on warranty limitations.
    Task 2: Generate a short, polite email to the customer attaching this quote.

    Output Format (JSON):
    {
      "terms": "...",
      "email": "..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error(error);
    return { terms: 'Standard warranty applies.', email: `Dear ${customerName}, please find your quote attached.` };
  }
};

export const generateInvoiceDetails = async (customerName: string, items: {name: string, price: number}[], total: number): Promise<{note: string, terms: string}> => {
  if (!process.env.API_KEY) return { note: 'Thank you for your business.', terms: 'Due upon receipt.' };

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const itemList = items.map(i => i.name).join(', ');

  const prompt = `
    Generate invoice details for customer "${customerName}".
    Items: ${itemList}.
    Total: ${total}.

    Output JSON with two fields:
    1. "note": A polite, professional closing note for the invoice (max 1 sentence).
    2. "terms": A short payment terms phrase (e.g. "Payment due upon receipt").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { note: 'Thank you for your business.', terms: 'Due upon receipt.' };
  }
};

export const generateEInvoiceProfile = async (customerName: string): Promise<{
  buyerTin: string;
  buyerRegNo: string;
  buyerSst: string;
  buyerMsic: string;
  classification: string;
}> => {
  const fallback = { buyerTin: '', buyerRegNo: '', buyerSst: '', buyerMsic: '95211', classification: '001' };
  if (!process.env.API_KEY) return fallback;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Generate plausible Malaysia E-Invoice (MyInvois) details for a customer named "${customerName}".
    
    Rules:
    1. If the name sounds like a company (e.g., contains Sdn Bhd, Enterprise, Trading), generate a Company TIN (starts with C) and a Registration Number.
    2. If the name sounds like an individual, generate an Individual TIN (starts with IG) and leave Registration Number empty.
    3. Use "001" for Classification (General) unless it's clearly automotive ("002") or construction ("003").
    4. Provide a standard MSIC code (default 95211 for repair if unsure).
    5. SST is optional (leave empty if individual).

    Output JSON format:
    {
      "buyerTin": "IG...",
      "buyerRegNo": "...",
      "buyerSst": "...",
      "buyerMsic": "...",
      "classification": "..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("E-Invoice Gen Error", error);
    return fallback;
  }
};

export const editImageWithAI = async (imageBase64: string, promptText: string): Promise<string | null> => {
  if (!process.env.API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return null;

  const mimeType = matches[1];
  const data = matches[2];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data,
            },
          },
          {
            text: promptText,
          },
        ],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Editing Error:", error);
    return null;
  }
};