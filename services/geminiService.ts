
import { GoogleGenAI, Type } from "@google/genai";
import { AISymptomResult } from "../types";

export const analyzeSymptoms = async (symptoms: string): Promise<AISymptomResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following symptoms provided by a patient: "${symptoms}".
    Return a detailed JSON object with possible diseases, severity level, the type of medical specialist to consult, basic precautions, and a clear medical recommendation.
    Ensure the JSON structure matches the requested schema precisely.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          possibleDiseases: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of likely medical conditions.'
          },
          severity: {
            type: Type.STRING,
            description: 'One of: Low, Medium, High, Emergency'
          },
          specialist: {
            type: Type.STRING,
            description: 'The type of specialist the patient should see.'
          },
          precautions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Basic immediate care steps.'
          },
          recommendation: {
            type: Type.STRING,
            description: 'Direct recommendation like "Consult doctor immediately".'
          },
          disclaimer: {
            type: Type.STRING,
            description: 'Standard medical disclaimer.'
          }
        },
        required: ["possibleDiseases", "severity", "specialist", "precautions", "recommendation", "disclaimer"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data as AISymptomResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Could not analyze symptoms at this time.");
  }
};
