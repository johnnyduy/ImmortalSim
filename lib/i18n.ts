import type { Lang, LocalizedText, TextResource, Stats } from '../types';
import uiEn from '../locales/en/ui.json';
import uiVi from '../locales/vi/ui.json';
import sectEn from '../locales/en/sects.json';
import sectVi from '../locales/vi/sects.json';
import uiZh from '../locales/zh/ui.json';
import sectZh from '../locales/zh/sects.json';

export const defaultLanguage = 'en';
export const supportedLanguages = ['en', 'vi', 'zh'] as const;

export const uiText: Record<string, Record<string, string>> = {
  en: uiEn,
  vi: uiVi,
  zh: uiZh,
};

export const sects = {
  en: sectEn,
  vi: sectVi,
  zh: sectZh,
};

export const translatedRealms: Record<string, LocalizedText> = {
  'Mortal': {
    en: 'Mortal',
    vi: 'Phàm Nhân',
    zh: '凡人',
  },
  'Qi Refinement': {
    en: 'Qi Refinement',
    vi: 'Luyện Khí',
    zh: '炼气',
  },
  'Foundation Establishment': {
    en: 'Foundation Establishment',
    vi: 'Trúc Cơ',
    zh: '筑基',
  },
  'Golden Core': {
    en: 'Golden Core',
    vi: 'Kim Đan',
    zh: '金丹',
  },
  'Nascent Soul': {
    en: 'Nascent Soul',
    vi: 'Nguyên Anh',
    zh: '元婴',
  },
};

export const defaultMessages: Record<string, LocalizedText> = {
  startLife: {
    en: 'A new life begins. The first year is full of possibility.',
    vi: 'Một kiếp mới bắt đầu. Năm đầu đầy khả năng.',
    zh: '崭新的一生开始。第一年充满了无限可能。',
  },
  journeyStarts: {
    en: 'Your cultivation journey starts in the mortal realm.',
    vi: 'Hành trình tu chân của bạn bắt đầu ở cảnh giới phàm trần.',
    zh: '你的修仙之旅始于凡人界。',
  },
  reincarnation: {
    en: 'A new life stretches before you, carrying memory and inheritance.',
    vi: 'Một kiếp mới trải dài trước mắt, mang theo ký ức và thừa kế.',
    zh: '承载着记忆与传承，新的一生在眼前展开。',
  },
  choiceProgress: {
    en: 'Age {age}: {event} -> {choice}',
    vi: 'Tuổi {age}: {event} -> {choice}',
    zh: '{age}岁: {event} -> {choice}',
  },
  choiceSummary: {
    en: '{choice} (Age {age})',
    vi: '{choice} (Tuổi {age})',
    zh: '{choice} ({age}岁)',
  },
  deathAtAge: {
    en: 'Death at age {age}.',
    vi: 'Chết ở tuổi {age}.',
    zh: '于{age}岁逝世。',
  },
};

export const normalizeTextResource = (text: TextResource): LocalizedText => {
  if (typeof text === 'string') {
    return {
      vi: text,
      en: text,
    };
  }
  return text;
};

export const renderText = (template: string, params?: Record<string, string | number>): string => {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
};

export const getLocalizedText = (
  text: TextResource,
  lang: Lang,
  params?: Record<string, string | number>,
): string => {
  const normalized = normalizeTextResource(text);
  const template = normalized[lang] ?? normalized[defaultLanguage] ?? Object.values(normalized)[0] ?? '';
  return renderText(template, params);
};

export const renderLocalizedTemplate = (
  template: LocalizedText,
  params: Record<string, string | number | TextResource> = {},
): LocalizedText => {
  const allLangs = new Set<string>(Object.keys(template));

  Object.values(params).forEach((value) => {
    if (typeof value === 'object') {
      Object.keys(value).forEach((lang) => allLangs.add(lang));
    }
  });

  const buildValue = (lang: string, value: string | number | TextResource) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    const normalized = normalizeTextResource(value);
    return normalized[lang as keyof LocalizedText] ?? normalized[defaultLanguage as keyof LocalizedText] ?? Object.values(normalized)[0] ?? '';
  };

  return Object.fromEntries(
    Array.from(allLangs).map((lang) => {
      const paramsForLang: Record<string, string | number> = {};
      Object.entries(params).forEach(([key, value]) => {
        paramsForLang[key] = buildValue(lang, value);
      });
      return [lang, renderText(template[lang as keyof LocalizedText] ?? template[defaultLanguage as keyof LocalizedText] ?? '', paramsForLang)];
    }),
  ) as LocalizedText;
};

// translateDeathReason (Hàm dịch lý do tịch diệt/tử vong của nhân vật)
export const translateDeathReason = (
  state: { stats: Stats; age: number },
): LocalizedText => {
  if (state.stats.health <= 0) {
    return {
      en: 'Your body could not withstand the pain of your cultivation choices.',
      vi: 'Thân thể bạn không chịu nổi đau đớn từ lựa chọn tu chân.',
      zh: '你的肉体无法承受修炼带来的痛苦。',
    };
  }
  // Chết do hết Thọ Nguyên (lifespan) thay vì 100 tuổi cứng
  if (state.age >= state.stats.lifespan) {
    return {
      en: 'Your lifespan has run out; even cultivators must bow to time when the Dao is incomplete.',
      vi: 'Thọ nguyên đã cạn kiệt; tu sĩ cũng phải chịu thua thời gian khi đại đạo chưa thành.',
      zh: '寿元已尽；大道未成，修士亦需向岁月低头。',
    };
  }
  if (state.stats.karma <= -10) {
    return {
      en: 'A dark fate consumes you as karmic debt collapses your spirit.',
      vi: 'Định mệnh u tối nuốt chửng bạn khi nợ nghiệp phá hủy tinh thần.',
      zh: '业力深重，灵魂崩溃，被黑暗的命运吞噬。',
    };
  }
  return {
    en: 'Your journey ended unexpectedly.',
    vi: 'Hành trình của bạn kết thúc ngoài dự kiến.',
    zh: '你的修仙之旅意外地结束了。',
  };
};
