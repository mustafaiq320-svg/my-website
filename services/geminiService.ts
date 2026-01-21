
import { GoogleGenAI, Modality, Type } from "@google/genai";

const getApiKey = () => {
  try {
    // محاولة جلب المفتاح من البيئة
    return (window as any).process?.env?.API_KEY || '';
  } catch (e) {
    return '';
  }
};

export const getHSEAssistantResponse = async (userPrompt: string) => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: `أنت خبير محترف وحصري في مجال الصحة والسلامة والبيئة (HSE) تدعى "سلامتك" من وحدة HSE في الفرقة الزلزالية الثامنة. 
      
      قواعد صارمة للرد:
      1. يجب أن تبدأ ردك دائماً بـ "معك سلامتك من وحدة HSE في الفرقة الزلزالية الثامنة".
      2. أنت مبرمج للإجابة **فقط** على المواضيع المتعلقة بالصحة والسلامة والبيئة.
      3. إذا سألك المستخدم عن أي موضوع خارج نطاق السلامة، اعتذر بأدب ووضح تخصصك.
      4. يجب أن تقترح **3 إلى 4 مواضيع فرعية أو أسئلة متابعة** ذات صلة وثيقة بسؤال المستخدم لمساعدته على التعمق في إجراءات السلامة.
      5. إذا سألك المستخدم "من هو رئيسك؟" أو "من صنعك؟" أو "من هو مطورك؟" ، أخبره بوضوح أنك تعمل تحت إشراف وتطوير "مشرف السلامة مصطفى صباح".
      
      يجب أن يتضمن ردك في قالب JSON: 
      1. assistantText: النص العربي التفصيلي للنصيحة.
      2. imagePrompt: وصف إنجليزي للصورة.
      3. suggestions: مصفوفة نصوص (Array of strings) تحتوي على الاقتراحات الفرعية.`,
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
      imagePrompt: result.imagePrompt || "Safety equipment illustration",
      suggestions: result.suggestions || []
    };
  } catch (e) {
    return {
      assistantText: response.text || "عذراً، حدث خطأ في معالجة البيانات.",
      imagePrompt: "Safety equipment illustration",
      suggestions: []
    };
  }
};

export const generateSafetyImage = async (prompt: string) => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `${prompt} - industrial safety aesthetic` }] }
  });

  let imageUrl = '';
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }
  return imageUrl;
};

export const generateSafetySpeech = async (text: string) => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
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
