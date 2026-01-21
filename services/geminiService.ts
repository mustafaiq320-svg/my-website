
import { GoogleGenAI, Modality, Type } from "@google/genai";

export const getHSEAssistantResponse = async (userPrompt: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: `أنت خبير محترف وحصري في مجال الصحة والسلامة والبيئة (HSE) تدعى "سلامتك" من وحدة HSE في الفرقة الزلزالية الثامنة. 
        قواعد صارمة:
        1. ابدأ دائماً بـ "معك سلامتك من وحدة HSE في الفرقة الزلزالية الثامنة".
        2. أجب فقط على مواضيع السلامة.
        3. اقترح 3 أسئلة متابعة.
        4. مطورك هو "مشرف السلامة مصطفى صباح".
        يجب أن يكون الرد JSON فقط.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assistantText: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["assistantText", "imagePrompt", "suggestions"],
        },
      },
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);
    
    return {
      assistantText: result.assistantText || "عذراً، لم أستطع صياغة الرد بشكل صحيح.",
      imagePrompt: result.imagePrompt || "Industrial safety illustration",
      suggestions: result.suggestions || []
    };
  } catch (e) {
    console.error("Gemini Assistant Error:", e);
    return {
      assistantText: "حدث خطأ في الاتصال بخبير السلامة. يرجى المحاولة مرة أخرى.",
      imagePrompt: "Safety warning icon",
      suggestions: ["ما هي إجراءات السلامة الأساسية؟", "كيف أبلغ عن خطر؟"]
    };
  }
};

export const generateSafetyImage = async (prompt: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `${prompt} - professional high resolution safety style` }] }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Image generation failed:", e);
  }
  return '';
};

export const generateSafetySpeech = async (text: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }], 
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: 'Kore' } 
          } 
        }
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
  } catch (e) {
    console.error("Speech generation failed:", e);
    return '';
  }
};
