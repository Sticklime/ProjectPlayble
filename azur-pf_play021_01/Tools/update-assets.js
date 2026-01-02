/**
 * @fileoverview Утилита для обновления ресурсов
 * @description Этот скрипт автоматически сканирует директории проекта на наличие ресурсов
 * и обновляет раздел Assets в Settings/default.json, сохраняя комментарии и форматирование.
 */

const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const {
  parseTree,
  findNodeAtLocation,
  printParseErrorCode,
} = require("jsonc-parser");

/**
 * Класс AssetUpdater обрабатывает автоматическое обнаружение ресурсов и обновление конфигурации
 * @class
 */
class AssetUpdater {
  /**
   * Создаёт экземпляр AssetUpdater
   * @param {string} projectRoot - Путь к корневой директории проекта
   */
  constructor(projectRoot) {
    this.projectRoot = path.resolve(projectRoot);
    this.settingsPath = path.join(this.projectRoot, "Settings", "default.json");

    /**
     * Сопоставление расширений файлов с типами ресурсов
     * @type {Object.<string, string>}
     */
    this.assetTypes = {
      ".glb": "glb", // Файлы 3D-моделей
      ".mp3": "sound", // Аудиофайлы (MP3)
      ".wav": "sound", // Аудиофайлы (WAV)
      ".jpg": "image", // Файлы изображений (JPEG)
      ".jpeg": "image", // Файлы изображений (JPEG)
      ".png": "image", // Файлы изображений (PNG)
      ".webp": "image", // Файлы изображений (WebP)
      ".avif": "image", // Файлы изображений (AVIF)
      ".css": "web-font", // Файлы описания шрифтов
    };

    /**
     * Сопоставление названий папок с разрешёнными типами ресурсов
     * @type {Object.<string, string[]>}
     */
    this.folders = {
      Images: ["image"], // Папка Images содержит ресурсы изображений
      Data: ["glb"], // Папка Data содержит ресурсы 3D-моделей
      Sounds: ["sound"], // Папка Sounds содержит аудио ресурсы
      Fonts: ["web-font"], // Папка Fonts содержит ресурсы шрифтов
    };

    /**
     * Порядок, в котором типы ресурсов должны появляться в конфигурации
     * @type {string[]}
     */
    this.assetOrder = ["image", "glb", "sound", "web-font"];

    /**
     * Набор ключей ресурсов, которые должны появляться первыми в конфигурации
     * @type {Set<string>}
     */
    this.priorityKeys = new Set([
      "background-loading",
      "banner-icon",
      "banner-star",
      "close-button",
      "icon",
      "logotype",
    ]);
  }

  /**
   * Основной метод обновления, который сканирует ресурсы и обновляет конфигурацию
   * @async
   * @returns {Promise<void>}
   * @throws {Error} Если чтение или запись файлов завершается неудачей
   */
  async update() {
    // Собираем все ресурсы из директорий проекта
    const { priority, rest } = this.collectAssets();
    const combined = { ...priority, ...rest };

    // Читаем текущий файл настроек
    const raw = fs.readFileSync(this.settingsPath, "utf-8");

    // Заменяем блок Assets, сохраняя комментарии
    const updatedRaw = this.replaceAssetsBlock(raw, combined);
    fs.writeFileSync(this.settingsPath, updatedRaw, "utf-8");
    console.log("✅ Assets updated in default.json (comments preserved)");

    // Форматируем файл с помощью Prettier
    const prettierConfig = await prettier.resolveConfig(this.settingsPath);
    const formatted = await prettier.format(updatedRaw, {
      ...prettierConfig,
      filepath: this.settingsPath,
    });
    fs.writeFileSync(this.settingsPath, formatted, "utf8");
    console.log("✨ Format with Prettier.");
  }

  /**
   * Собирает все ресурсы из директорий проекта и организует их
   * @returns {{priority: Object, rest: Object}} Разделённые приоритетные и обычные ресурсы
   * @description Этот метод:
   * - Сканирует все настроенные папки на наличие поддерживаемых файлов ресурсов
   * - Обрабатывает сжатые варианты (файлы, заканчивающиеся на _compressed)
   * - Разделяет приоритетные ресурсы от обычных
   * - Сортирует ресурсы по типу и названию
   * - Исключает отдельные изображения, если существует Images.glb
   */
  collectAssets() {
    const all = new Map();
    let hasImagesGlb = false;

    // Сканируем каждую настроенную папку
    for (const [folder, allowedTypes] of Object.entries(this.folders)) {
      const absFolder = path.join(this.projectRoot, folder);
      if (!fs.existsSync(absFolder)) continue;

      const files = this.walkFiles(absFolder);
      for (const filePath of files) {
        const ext = path.extname(filePath).toLowerCase();
        const type = this.assetTypes[ext];

        // Пропускаем, если тип файла не распознан или не разрешён в этой папке
        if (!type || !allowedTypes.includes(type)) continue;

        // Создаём относительный путь с прямыми слешами
        const relPath = path
          .relative(this.projectRoot, filePath)
          .replace(/\\/g, "/");
        const baseName = path.basename(filePath, ext);

        // Проверяем, существует ли Images.glb (содержит все изображения как текстуры)
        if (type === "glb" && baseName === "Images") {
          hasImagesGlb = true;
        }

        // Обрабатываем сжатые варианты - предпочитаем сжатые несжатым
        const isCompressed = baseName.endsWith("_compressed");
        const key = isCompressed
          ? baseName.replace(/_compressed$/, "")
          : baseName;

        // Добавляем в карту, если не существует или если это сжатая версия
        if (!all.has(key) || isCompressed) {
          all.set(key, { type, url: relPath });
        }
      }
    }

    // Разделяем приоритетные ресурсы от остальных
    const priority = {};
    const restEntries = [];

    for (const [key, value] of all.entries()) {
      if (this.priorityKeys.has(key)) {
        priority[key] = value;
      } else if (!(hasImagesGlb && value.type === "image")) {
        // Исключаем отдельные изображения, если существует Images.glb
        restEntries.push([key, value]);
      }
    }

    // Сортируем неприоритетные ресурсы по порядку типов, затем по алфавиту
    restEntries.sort(([k1, a1], [k2, a2]) => {
      const o1 = this.assetOrder.indexOf(a1.type);
      const o2 = this.assetOrder.indexOf(a2.type);
      if (o1 !== o2) return o1 - o2;
      return k1.localeCompare(k2);
    });

    const rest = Object.fromEntries(restEntries);

    return { priority, rest };
  }

  /**
   * Рекурсивно обходит директорию и возвращает все пути файлов
   * @param {string} dir - Директория для обхода
   * @returns {string[]} Массив абсолютных путей файлов
   */
  walkFiles(dir) {
    const out = [];
    const recurse = (folder) => {
      const entries = fs.readdirSync(folder, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) recurse(full);
        else out.push(full);
      }
    };
    recurse(dir);
    return out;
  }

  /**
   * Заменяет блок Assets в JSON, сохраняя комментарии
   * @param {string} raw - Исходное содержимое файла настроек
   * @param {Object} newAssets - Новый объект ресурсов для вставки
   * @returns {string} Обновлённое содержимое файла с новыми ресурсами
   * @throws {Error} Если парсинг завершается неудачей или раздел Assets не найден
   */
  replaceAssetsBlock(raw, newAssets) {
    const errors = [];
    // Парсим как JSONC для обработки комментариев
    const root = parseTree(raw, errors, { allowTrailingComma: true });

    if (errors.length > 0) {
      for (const err of errors) {
        console.error("❌ Parsing error:", printParseErrorCode(err.error));
      }
      process.exit(1);
    }

    // Находим узел Assets в дереве JSON
    const node = findNodeAtLocation(root, ["Assets"]);
    if (!node) {
      console.error("❌ Cannot find `Assets` in default.json");
      process.exit(1);
    }

    // Заменяем только значение Assets, сохраняя всё остальное
    const start = node.offset;
    const end = node.offset + node.length;
    const json = JSON.stringify(newAssets, null, 2);
    const before = raw.slice(0, start);
    const after = raw.slice(end);
    return before + json + after;
  }
}

const updater = new AssetUpdater(path.join(__dirname, ".."));
updater.update().catch(console.error);
