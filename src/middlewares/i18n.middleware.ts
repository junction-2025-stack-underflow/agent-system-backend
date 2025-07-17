import i18next from "i18next";
import * as middleware from "i18next-http-middleware";
import Backend from "i18next-fs-backend";
import path from "path";

const namespaces = ["translation", "debug"];

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    ns: namespaces,
    defaultNS: "translation",
    preload: ["en", "ar", "fr"],
    backend: {
      loadPath: path.join(process.cwd(), "src/locales/{{lng}}/{{ns}}.json"),
    },
    detection: {
      order: ["header", "querystring", "cookie"], // Detect from request header, querystring, and cookies
      caches: ["cookie"], // Cache language in cookies
    },
  });

export const i18n = middleware.handle(i18next);
