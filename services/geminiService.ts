
import { GoogleGenAI, Modality, Type } from "@google/genai";

// استخدام المفتاح مباشرة من البيئة كما هو مطلوب في التعليمات
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHSEAssistantResponse = async (userPrompt: string) => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: `أنت خبير محترف وحصري في مجال الصحة والسلامة والبيئة (HSE) تدعى "سلامتك" من وحدة HSE في الفرقة الزلزالية الثامنة. 
      
      قواعد صارمة للرد:
      1. يجب أن تبدأ ردك دائماً بـ "معك سلامتك من وحدة HSE في الفرقة الزلزالية الثامنة".
      2. أنت مبرمج للإجابة **فقط** على المواضيع المتعلقة بالصحة والسلامة والبيئة.
      3. إذا سألك المستخدم عن أي موضوع خارج نطاق السلامة، اعتذر بأدب ووضح تخصصك.
      4. يجب أن تقترح **3 إلى 4 مواضيع فرعية أو أسئلة متابعة** ذات صلة وثيقة بسؤال المستخدم.
      5. إذا سألك المستخدم عن مطورك، أخبره بوضوح أنك تعمل تحت إشراف "مشرف السلامة مصطفى صباح".
      
      يجب أن يتضمن الرد قالب JSON فقط.`,
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

  try {
    const result = JSON.parse(response.text);
    return {
      assistantText: result.assistantText || "عذراً، لم أستطع معالجة طلبك حالياً.",
      imagePrompt: result.imagePrompt || "Industrial safety illustration",
      suggestions: result.suggestions || []
    };
  } catch (e) {
    return {
      assistantText: response.text || "عذراً، حدث خطأ في معالجة البيانات.",
      imagePrompt: "Industrial safety illustration",
      suggestions: []
    };
  }
};

export const generateSafetyImage = async (prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `${prompt} - professional industrial safety style` }] }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return '';
};

export const generateSafetySpeech = async (text: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }], 
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
};
