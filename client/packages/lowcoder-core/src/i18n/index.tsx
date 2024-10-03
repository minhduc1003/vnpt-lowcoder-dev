import * as localeData from "./locales";
import IntlMessageFormat from "intl-messageformat";
import log from "loglevel";
import { Fragment } from "react";

// this is a copy of the translator from ../../lib/index.js
// TODO: check if this file is used at all

const defaultLocale = "en";

let locales = [defaultLocale];

// Falk - Adapted the central translator to check if a localStorage key is existing.
const uiLanguage = localStorage.getItem('lowcoder_uiLanguage');
if (globalThis.navigator) {
  if (uiLanguage) {  
    locales = [uiLanguage];
  } 
  else if (navigator.languages && navigator.languages.length > 0) {
    locales = [...navigator.languages];
  } else {
    locales = [navigator.language || ((navigator as any).userLanguage as string) || defaultLocale];
  }
}

interface LocaleInfo {
  locale: string; // e.g. "en-US", "zh-Hans-CN"
  language: string; // e.g. "zh"
  region?: string; // e.g. "CN"
}

function parseLocale(s: string): LocaleInfo | undefined {
  const locale = s.trim();
  if (!locale) {
    return;
  }
  try {
    if (Intl.Locale) {
      const { language, region } = new Intl.Locale(locale);
      return { locale, language, region };
    }
    const parts = locale.split("-");
    const r = parts.slice(1, 3).find((t) => t.length === 2);
    return { locale, language: parts[0].toLowerCase(), region: r?.toUpperCase() };
  } catch (e) {
    log.error(`Parse locale:${locale} failed.`, e);
  }
}

function parseLocales(list: string[]): LocaleInfo[] {
  return list.map(parseLocale).filter((t) => t) as LocaleInfo[];
}

const fallbackLocaleInfos = parseLocales(
  locales.includes(defaultLocale) ? locales : [...locales, defaultLocale]
);

export const i18n = {
  locales, // all locales
  ...fallbackLocaleInfos[0],
};

export function getValueByLocale<T>(defaultValue: T, func: (info: LocaleInfo) => T | undefined) {
  for (const info of fallbackLocaleInfos) {
    const t = func(info);
    if (t !== undefined) {
      return t;
    }
  }
  return defaultValue;
}

function getDataByLocale<T>(
  fileData: any,
  suffix: "" | "Obj",
  filterLocales?: string,
  targetLocales?: string[]
) {

  let localeInfos = [...fallbackLocaleInfos];

  const targetLocaleInfo = parseLocales(targetLocales || []);
  if (targetLocaleInfo.length > 0) {
    localeInfos = [...targetLocaleInfo, ...localeInfos];
  }

  const filterNames = parseLocales((filterLocales ?? "").split(","))
    .map((l) => l.language + (l.region ?? ""))
    .filter((s) => fileData[s + suffix] !== undefined);

  const names = [
    ...localeInfos
      .flatMap(({ language, region }) => [
        region ? language + region : undefined,
        language,
        filterNames.find((n) => n.startsWith(language)),
      ])
      .filter((s) => s && (!filterLocales || filterNames.includes(s))),
    ...filterNames,
  ].map((s) => s + suffix);

  for (const name of names) {
    const data = fileData[name];
    if (data !== undefined) {
      return { data: data as T, language: name.slice(0, 2) };
    }
  }
  
  console.error(`Not found ${names}`);
  // return fallback data for en language
  return { data: fileData['en'], language: 'en'};
  // throw new Error(`Not found ${names}`);
}

type AddDot<T extends string> = T extends "" ? "" : `.${T}`;
type ValidKey<T> = Exclude<keyof T, symbol>;

// nested leaf keys
type NestedKey<T> = (
  T extends object ? { [K in ValidKey<T>]: `${K}${AddDot<NestedKey<T[K]>>}` }[ValidKey<T>] : ""
) extends infer D
  ? Extract<D, string>
  : never;

type AddPrefix<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K];
};

const globalMessageKeyPrefix = "@";
const globalMessages = Object.fromEntries(
  Object.entries(getDataByLocale<typeof localeData.en>(localeData, "").data).map(([k, v]) => [
    globalMessageKeyPrefix + k,
    v,
  ])
) as AddPrefix<typeof localeData.en, typeof globalMessageKeyPrefix>;

type GlobalMessageKey = NestedKey<typeof globalMessages>;
type VariableValue = string | number | boolean | Date | React.ReactNode;

export class Translator<Messages extends object> {
  private readonly messages: Messages & typeof globalMessages;

  // language of Translator, can be different from i18n.language
  readonly language: string;

  constructor(fileData: object, filterLocales?: string, locales?: string[]) {
    const { data, language } = getDataByLocale<Messages>(fileData, "", filterLocales, locales);
    this.messages = Object.assign({}, data, globalMessages);
    this.language = language;
    this.trans = this.trans.bind(this);
    this.transToNode = this.transToNode.bind(this);
  }

  trans(
    key: NestedKey<Messages> | GlobalMessageKey,
    variables?: Record<string, VariableValue>
  ): string {
    return this.transToNode(key, variables).toString();
  }

  transToNode(
    key: NestedKey<Messages> | GlobalMessageKey,
    variables?: Record<string, VariableValue>
  ) {
    const message = this.getMessage(key);
    const node = new IntlMessageFormat(message, i18n.locale).format(variables);
    if (Array.isArray(node)) {
      return node.map((n, i) => <Fragment key={i}>{n}</Fragment>);
    }
    return node;
  }

  private getMessage(key: NestedKey<Messages> | GlobalMessageKey) {
    let message = this.getNestedMessage(this.messages, key);
  
    // Fallback to English if the message is not found
    if (message === undefined) {
      message = this.getNestedMessage(localeData.en, key); // Assuming localeData.en contains English translations
    }
  
    // If still not found, return a default message or the key itself
    if (message === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      message = `oups! ${key}`;
    }
  
    return message;
  }

  private getNestedMessage(obj: any, key: string) {
    for (const k of key.split(".")) {
      if (obj !== undefined) {
        obj = obj[k];
      }
    }
    return obj;
  }

}

export function getI18nObjects<I18nObjects>(fileData: object, filterLocales?: string) {
  return getDataByLocale<I18nObjects>(fileData, "Obj", filterLocales)?.data;
}
