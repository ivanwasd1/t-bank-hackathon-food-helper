import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, Cuisine, Goal } from "../types";

export const identifyIngredientsFromImage = async (base64Image: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Identify the food items and ingredients in this image. Return a simple JSON array of strings, e.g., ['Milk', 'Eggs', 'Spinach']. Do not wrap in markdown."
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (e) {
    console.error("Gemini Vision Error", e);
    return [];
  }
};

export const generateRecipeSuggestions = async (
  ingredients: string[], 
  preferences: { goal: Goal, cuisines: Cuisine[], veg: boolean }
): Promise<Partial<Recipe>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Create 3 unique, creative meal recipes based on the following constraints:
    - Available Ingredients: ${ingredients.join(', ')} (You can add common pantry items like oil, salt, pepper).
    - User Goal: ${preferences.goal}
    - Cuisines: ${preferences.cuisines.join(', ')}
    - Vegetarian: ${preferences.veg}
    
    Return the response as a JSON array of objects strictly following this schema:
    {
      "title": string,
      "calories": number,
      "protein": string (e.g. "20g"),
      "time": string (e.g. "30 mins"),
      "cuisine": string (One of the requested cuisines),
      "ingredients": [{"name": string, "quantity": string, "inFridge": boolean}],
      "steps": string[]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    
    const text = response.text;
    if (!text) return [];
    const data = JSON.parse(text);
    return data.map((r: any) => ({
        ...r,
        tags: [preferences.goal, r.cuisine]
    }));
  } catch (e) {
    console.error("Gemini Recipe Gen Error", e);
    return [];
  }
};