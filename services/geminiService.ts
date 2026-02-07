
import { GoogleGenAI, Type } from "@google/genai";

// Always initialize with process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async suggestProjectPlan(projectName: string, description: string) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise o projeto "${projectName}" (${description}) e sugira uma estrutura de fases e tarefas para execução eficiente.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              phases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    tasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          estimatedHours: { type: Type.NUMBER }
                        },
                        required: ["title", "estimatedHours"]
                      }
                    }
                  },
                  required: ["name", "tasks"]
                }
              }
            },
            required: ["phases"]
          }
        }
      });
      // Correctly access .text property as a getter, not a method
      const text = response.text;
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error("Error suggesting project plan:", error);
      return null;
    }
  }
};
