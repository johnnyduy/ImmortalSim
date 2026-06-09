import type { Lang, LocalizedText, TextResource, Stats } from '../types';
import uiEn from '../locales/en/ui.json';
import uiVi from '../locales/vi/ui.json';
import sectEn from '../locales/en/sects.json';
import sectVi from '../locales/vi/sects.json';

export const defaultLanguage = 'en';
export const supportedLanguages = ['en', 'vi'] as const;

export const uiText: Record<string, Record<string, string>> = {
  en: uiEn,
  vi: uiVi,
};

export const sects = {
  en: sectEn,
  vi: sectVi,
};

export const translatedRealms: Record<string, LocalizedText> = {
  'Mortal': {
    en: 'Mortal',
    vi: 'Phàm Nhân',
  },
  'Qi Refinement': {
    en: 'Qi Refinement',
    vi: 'Luyện Khí',
  },
  'Foundation Establishment': {
    en: 'Foundation Establishment',
    vi: 'Trúc Cơ',
  },
  'Golden Core': {
    en: 'Golden Core',
    vi: 'Kim Đan',
  },
  'Nascent Soul': {
    en: 'Nascent Soul',
    vi: 'Nguyên Anh',
  },
};

export const defaultMessages: Record<string, LocalizedText> = {
  startLife: {
    en: 'A new life begins. The first year is full of possibility.',
    vi: 'Một kiếp mới bắt đầu. Năm đầu đầy khả năng.',
  },
  journeyStarts: {
    en: 'Your cultivation journey starts in the mortal realm.',
    vi: 'Hành trình tu chân của bạn bắt đầu ở cảnh giới phàm trần.',
  },
  reincarnation: {
    en: 'A new life stretches before you, carrying memory and inheritance.',
    vi: 'Một kiếp mới trải dài trước mắt, mang theo ký ức và thừa kế.',
  },
  choiceProgress: {
    en: 'Age {age}: {event} -> {choice}',
    vi: 'Tuổi {age}: {event} -> {choice}',
  },
  choiceSummary: {
    en: '{choice} (Age {age})',
    vi: '{choice} (Tuổi {age})',
  },
  deathAtAge: {
    en: 'Death at age {age}.',
    vi: 'Chết ở tuổi {age}.',
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
    };
  }
  // Chết do hết Thọ Nguyên (lifespan) thay vì 100 tuổi cứng
  if (state.age >= state.stats.lifespan) {
    return {
      en: 'Your lifespan has run out; even cultivators must bow to time when the Dao is incomplete.',
      vi: 'Thọ nguyên đã cạn kiệt; tu sĩ cũng phải chịu thua thời gian khi đại đạo chưa thành.',
    };
  }
  if (state.stats.karma <= -10) {
    return {
      en: 'A dark fate consumes you as karmic debt collapses your spirit.',
      vi: 'Định mệnh u tối nuốt chửng bạn khi nợ nghiệp phá hủy tinh thần.',
    };
  }
  return {
    en: 'Your journey ended unexpectedly.',
    vi: 'Hành trình của bạn kết thúc ngoài dự kiến.',
  };
};
