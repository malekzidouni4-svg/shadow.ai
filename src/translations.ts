export type Language = 'ar' | 'en';

export interface Translations {
  appName: string;
  modelName: string;
  chatTab: string;
  imageTab: string;
  visionTab: string;
  voiceTab: string;
  promptsTab: string;
  newChat: string;
  previousChats: string;
  noChatsYet: string;
  personas: string;
  howCanIHelp: string;
  thinkingMode: string;
  deepThinking: string;
  fastThinking: string;
  googleSearch: string;
  googleSearchLive: string;
  memory: string;
  memoryTitle: string;
  memoryDesc: string;
  memoryActive: string;
  memoryActiveSub: string;
  memoryInputPlaceholder: string;
  noMemoriesYet: string;
  clearAllMemories: string;
  inputPlaceholder: string;
  listeningSpeech: string;
  micTooltip: string;
  attachImage: string;
  send: string;
  stop: string;
  copy: string;
  copied: string;
  listen: string;
  generatingSpeech: string;
  groundingSources: string;
  quotaWarning: string;
  resetChat: string;
  installApp: string;
  installAppDesc: string;
  searchPrompts: string;
  useInChat: string;
  promptLibraryTitle: string;
  promptLibraryDesc: string;
  imageStudioTitle: string;
  imageStudioDesc: string;
  imagePromptPlaceholder: string;
  generateImage: string;
  generatingImage: string;
  enhancePrompt: string;
  visionTitle: string;
  visionDesc: string;
  uploadDocumentOrImage: string;
  analyzeDocument: string;
  analyzingDocument: string;
  ocrExtract: string;
  summarizeDoc: string;
  solveMath: string;
  auditReceipt: string;
  voiceStudioTitle: string;
  voiceStudioDesc: string;
  voiceInputPlaceholder: string;
  generateVoice: string;
  generatingVoice: string;
  chartInteractive: string;
  chartTotal: string;
  barChart: string;
  lineChart: string;
  areaChart: string;
  pieChart: string;
  viewAsChart: string;
  viewAsTable: string;
  zoomImage: string;
  downloadImage: string;
  insertChartExample: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    appName: 'shadow.ai',
    modelName: 'tera 1.0',
    chatTab: 'محادثة',
    imageTab: 'توليد الصور',
    visionTab: 'فحص المستندات',
    voiceTab: 'صوت',
    promptsTab: 'أوامر',
    newChat: 'محادثة جديدة',
    previousChats: 'المحادثات السابقة',
    noChatsYet: 'لا توجد محادثات سابقة بعد',
    personas: 'الشخصيات الذكية',
    howCanIHelp: 'بمَ يمكنني مساعدتك اليوم؟',
    thinkingMode: 'التفكير المنطقي',
    deepThinking: 'تفكير عميق',
    fastThinking: 'استجابة سريعة',
    googleSearch: 'بحث جوجل',
    googleSearchLive: 'بحث حي متصل',
    memory: 'الذاكرة',
    memoryTitle: 'ذاكرة shadow.ai الذكية',
    memoryDesc: 'تذكر تفضيلاتك وسياق حواراتك السابقة عبر السحابة',
    memoryActive: 'الذاكرة السحابية المستمرة',
    memoryActiveSub: 'استحضار الحقائق وتفضيلاتك تلقائياً وبسرعة فائقة',
    memoryInputPlaceholder: 'أضف حقيقة ليتذكرها (مثال: أعمل كمطور برمجيات...)',
    noMemoriesYet: 'لا توجد حقائق محفوظة بعد. سيتعلم shadow.ai عنك تلقائياً!',
    clearAllMemories: 'مسح كل الذكريات',
    inputPlaceholder: 'اسأل shadow.ai أي شيء أو اطلب رسماً بيانياً...',
    listeningSpeech: 'جارٍ الاستماع لصوتك الآن...',
    micTooltip: 'إملاء صوتي بالمايكروفون',
    attachImage: 'إرفاق صورة أو مستند',
    send: 'إرسال',
    stop: 'إيقاف',
    copy: 'نسخ',
    copied: 'تم النسخ',
    listen: 'استمع',
    generatingSpeech: 'جارٍ تحضير الصوت...',
    groundingSources: 'مصادر بحث جوجل المباشرة:',
    quotaWarning: 'تم الوصول إلى الحد الأقصى المؤقت. يُرجى الانتظار بضع ثوانٍ.',
    resetChat: 'تفريغ المحادثة',
    installApp: 'تطبيق Android',
    installAppDesc: 'تثبيت التطبيق على أندرويد ليعمل كـ App حقيقي',
    searchPrompts: 'ابحث في مكتبة الأوامر...',
    useInChat: 'تطبيق في المحادثة',
    promptLibraryTitle: 'مكتبة الأوامر الذكية',
    promptLibraryDesc: 'أوامر جاهزة ومصممة بعناية فائقة لاستخراج أفضل النتائج',
    imageStudioTitle: 'استوديو الصور والمؤثرات',
    imageStudioDesc: 'حوّل أفكارك وخيالك إلى لوحات ورسوم فائقة الجودة',
    imagePromptPlaceholder: 'صف الفكرة أو المشهد البصري بالتفصيل...',
    generateImage: 'توليد الصورة الآن',
    generatingImage: 'جارٍ إنشاء العمل الفني...',
    enhancePrompt: 'تحسين الوصف بذكاء',
    visionTitle: 'محلل المستندات والصور (Vision & OCR)',
    visionDesc: 'استخراج النصوص العربية، تلخيص الأوراق، وحل المعادلات',
    uploadDocumentOrImage: 'اضغط هنا لرفع صورة أو مستند',
    analyzeDocument: 'بدء تحليل المستند',
    analyzingDocument: 'جارٍ الفحص والاستخراج...',
    ocrExtract: 'استخراج نصوص',
    summarizeDoc: 'تلخيص المستند',
    solveMath: 'حل مسألة',
    auditReceipt: 'فحص فاتورة',
    voiceStudioTitle: 'استوديو النطق والصوت الفائق',
    voiceStudioDesc: 'تحويل أي نص إلى تسجيل صوتي طبيعي عالي النقاء',
    voiceInputPlaceholder: 'اكتب النص المراد نطقه صوتياً...',
    generateVoice: 'توليد الصوت الآن',
    generatingVoice: 'جارٍ تركيب الصوت الطبيعي...',
    chartInteractive: 'رسم بياني تفاعلي',
    chartTotal: 'الإجمالي',
    barChart: 'أعمدة بيانية',
    lineChart: 'منحنى بياني',
    areaChart: 'مساحة بيانية',
    pieChart: 'دائري نسبي',
    viewAsChart: 'عرض كرسم بياني',
    viewAsTable: 'عرض كجدول',
    zoomImage: 'تكبير الصورة',
    downloadImage: 'تحميل الصورة',
    insertChartExample: 'إدراج رسم بياني تجريبي',
  },
  en: {
    appName: 'shadow.ai',
    modelName: 'tera 1.0',
    chatTab: 'Chat',
    imageTab: 'Images',
    visionTab: 'Vision & OCR',
    voiceTab: 'Voice',
    promptsTab: 'Prompts',
    newChat: 'New Chat',
    previousChats: 'Recent Chats',
    noChatsYet: 'No previous conversations yet',
    personas: 'AI Personas',
    howCanIHelp: 'How can shadow.ai assist you today?',
    thinkingMode: 'Thinking Mode',
    deepThinking: 'Deep Reasoning',
    fastThinking: 'Fast Response',
    googleSearch: 'Google Search',
    googleSearchLive: 'Live Web Grounding',
    memory: 'Memory',
    memoryTitle: 'shadow.ai Smart Memory',
    memoryDesc: 'Remember your preferences and conversation context in the Cloud',
    memoryActive: 'Continuous Cloud Memory',
    memoryActiveSub: 'Recall facts and preferences automatically with ultra-fast speed',
    memoryInputPlaceholder: 'Add a fact to remember (e.g., I am a senior developer...)',
    noMemoriesYet: 'No memories saved yet. shadow.ai learns as you chat!',
    clearAllMemories: 'Clear All Memories',
    inputPlaceholder: 'Ask shadow.ai anything or request a chart/data visual...',
    listeningSpeech: 'Listening to your voice...',
    micTooltip: 'Voice dictation',
    attachImage: 'Attach image or document',
    send: 'Send',
    stop: 'Stop',
    copy: 'Copy',
    copied: 'Copied',
    listen: 'Listen',
    generatingSpeech: 'Generating voice...',
    groundingSources: 'Live Google Search Sources:',
    quotaWarning: 'Rate limit reached temporarily. Please wait a few seconds.',
    resetChat: 'Reset Chat',
    installApp: 'Android App',
    installAppDesc: 'Install native app on Android',
    searchPrompts: 'Search prompts...',
    useInChat: 'Use in Chat',
    promptLibraryTitle: 'Prompt Library',
    promptLibraryDesc: 'Carefully engineered prompts for code, data analysis, and research',
    imageStudioTitle: 'AI Visual Studio',
    imageStudioDesc: 'Transform concepts into cinematic artwork and visuals',
    imagePromptPlaceholder: 'Describe the scene or visual concept in detail...',
    generateImage: 'Generate Image',
    generatingImage: 'Rendering artwork...',
    enhancePrompt: 'Enhance Prompt with AI',
    visionTitle: 'Document & Vision Inspector',
    visionDesc: 'OCR text extraction, document summaries, diagrams and math',
    uploadDocumentOrImage: 'Click or drop an image or document here',
    analyzeDocument: 'Analyze Document',
    analyzingDocument: 'Inspecting document...',
    ocrExtract: 'Extract Text',
    summarizeDoc: 'Summarize Document',
    solveMath: 'Solve Math',
    auditReceipt: 'Audit Receipt',
    voiceStudioTitle: 'AI Voice & Speech Studio',
    voiceStudioDesc: 'High-fidelity natural neural speech synthesis',
    voiceInputPlaceholder: 'Enter text to synthesize into speech...',
    generateVoice: 'Generate Voice',
    generatingVoice: 'Synthesizing voice...',
    chartInteractive: 'Interactive Chart',
    chartTotal: 'Total',
    barChart: 'Bar Chart',
    lineChart: 'Line Chart',
    areaChart: 'Area Chart',
    pieChart: 'Pie Chart',
    viewAsChart: 'View as Chart',
    viewAsTable: 'View as Table',
    zoomImage: 'Zoom Image',
    downloadImage: 'Download Image',
    insertChartExample: 'Insert Sample Chart',
  },
};
