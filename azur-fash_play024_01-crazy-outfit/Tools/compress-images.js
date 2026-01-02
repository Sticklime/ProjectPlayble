/**
 * compress-images.js
 *
 * Скрипт для автоматической компрессии изображений
 *
 * ОПИСАНИЕ:
 * Этот скрипт автоматически находит и сжимает все несжатые изображения в директории Images.
 * Он применяет различные методы оптимизации для уменьшения размера файлов без значительной
 * потери качества изображения. Поддерживает автоматическое определение прозрачности изображений
 * и применение соответствующих настроек компрессии.
 *
 * ОСНОВНЫЕ ФУНКЦИИ:
 * - Автоматический поиск несжатых файлов изображений (без суффикса _compressed)
 * - Автоматическое определение прозрачности изображений
 * - Применение настраиваемых методов компрессии через конфигурационный файл
 * - Поддержка изменения выходного формата изображения
 * - Индивидуальные настройки для конкретных изображений
 * - Ограничение максимального размера изображений
 *
 * ПОДДЕРЖИВАЕМЫЕ ФОРМАТЫ:
 * - JPEG/JPG: оптимизация с поддержкой MozJPEG
 * - PNG: компрессия с настраиваемым уровнем сжатия
 * - WebP: современный формат с высокой степенью сжатия
 * - AVIF: новейший формат с превосходным сжатием
 * - none: сохранение исходного формата
 *
 * МЕТОДЫ ОПТИМИЗАЦИИ:
 * - MaxSize: ограничение максимального размера изображения
 * - Quality: настройка качества сжатия
 * - Format conversion: конвертация в другие форматы
 * - Transparency detection: автоматическое определение прозрачности
 *
 * ИСПОЛЬЗОВАНИЕ:
 * npm run compress-images
 *
 * КОНФИГУРАЦИЯ:
 * Настройки компрессии находятся в файле Tools/configs/image-compression-config.json
 * - default.outputFormat.opaque: формат для непрозрачных изображений
 * - default.outputFormat.transparent: формат для прозрачных изображений
 * - custom: индивидуальные настройки с единым outputFormat
 *
 * ВЫХОДНЫЕ ФАЙЛЫ:
 * - {имя_изображения}_compressed.{расширение} - сжатые версии изображений
 * - При указании outputFormat создается файл с новым расширением
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/**
 * Класс для компрессии изображений
 *
 * Обрабатывает изображения различных форматов, применяя настраиваемые
 * методы оптимизации и поддерживая конвертацию форматов с автоматическим
 * определением прозрачности
 */
class ImageCompressor {
  /**
   * Конструктор класса ImageCompressor
   *
   * Инициализирует пути к файлам и загружает конфигурацию компрессии.
   *
   * @property {string} projectRoot - Корневая директория проекта
   * @property {string} configPath - Путь к файлу конфигурации (Tools/configs/image-compression-config.json)
   * @property {string} imagesDirectory - Директория с изображениями
   * @property {string[]} supportedExtensions - Поддерживаемые расширения файлов
   * @property {Object} compressionConfig - Загруженная конфигурация компрессии
   * @property {number} totalOriginalSize - Общий размер оригинальных файлов в байтах
   * @property {number} totalCompressedSize - Общий размер сжатых файлов в байтах
   */
  constructor() {
    this.projectRoot = path.resolve(__dirname, "..");
    this.configPath = path.join(
      __dirname,
      "configs",
      "image-compression-config.json",
    );
    this.imagesDirectory = path.join(this.projectRoot, "Images");
    this.supportedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
    this.compressionConfig = this.loadCompressionConfig();
    this.totalOriginalSize = 0;
    this.totalCompressedSize = 0;
  }

  /**
   * Загружает конфигурацию компрессии из JSON файла
   *
   * @returns {Object} Объект с настройками компрессии
   * @throws {Error} Если файл конфигурации не найден в Tools/configs/
   */
  loadCompressionConfig() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(
        "Missing image-compression-config.json in configs directory.",
      );
    }
    return JSON.parse(fs.readFileSync(this.configPath, "utf8"));
  }

  /**
   * Находит все несжатые файлы изображений в директории Images
   *
   * Рекурсивно сканирует директорию и возвращает пути к файлам,
   * которые имеют поддерживаемые расширения, но не содержат суффикс _compressed
   *
   * @returns {string[]} Массив путей к несжатым файлам изображений
   */
  findUncompressedImageFiles() {
    const allFiles = this.walkDirectory(this.imagesDirectory);
    return allFiles.filter((filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const baseName = path.basename(filePath, ext);
      return (
        this.supportedExtensions.includes(ext) &&
        !baseName.endsWith("_compressed")
      );
    });
  }

  /**
   * Рекурсивно обходит директорию и собирает все файлы
   *
   * @param {string} directory - Путь к директории для сканирования
   * @returns {string[]} Массив путей ко всем найденным файлам
   */
  walkDirectory(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.walkDirectory(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Получает конфигурацию компрессии для конкретного изображения
   *
   * Объединяет дефолтные настройки с кастомными настройками
   * для конкретного изображения (если они заданы).
   *
   * @param {string} imageName - Имя изображения (без расширения)
   * @returns {Object} Объединенная конфигурация компрессии
   */
  getImageConfig(imageName) {
    const defaultConfig = this.compressionConfig.default;
    const customConfig = this.compressionConfig.custom?.[imageName] || {};

    // Создаем объединенную конфигурацию
    const mergedConfig = {
      maxSize: { ...defaultConfig.maxSize },
      quality: { ...defaultConfig.quality },
      outputFormat: { ...defaultConfig.outputFormat },
    };

    // Применяем кастомные настройки
    if (customConfig.maxSize) {
      mergedConfig.maxSize = {
        ...mergedConfig.maxSize,
        ...customConfig.maxSize,
      };
    }

    if (customConfig.quality !== undefined) {
      // В кастомной конфигурации quality - это число, применяем к обоим типам
      mergedConfig.quality = {
        opaque: customConfig.quality,
        transparent: customConfig.quality,
      };
    }

    if (customConfig.outputFormat) {
      // В кастомной конфигурации один формат для всех типов изображений
      mergedConfig.outputFormat = {
        opaque: customConfig.outputFormat,
        transparent: customConfig.outputFormat,
      };
    }

    return mergedConfig;
  }

  /**
   * Определяет, имеет ли изображение альфа-канал (прозрачность)
   *
   * @param {string} filePath - Путь к файлу изображения
   * @returns {Promise<boolean>} true если изображение имеет прозрачность
   */
  async hasTransparency(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();

      // PNG и WebP могут иметь альфа-канал
      if (metadata.channels === 4 || metadata.hasAlpha === true) {
        return true;
      }

      // Для PNG дополнительно проверяем наличие альфа-канала в статистике
      if (path.extname(filePath).toLowerCase() === ".png") {
        const stats = await sharp(filePath).stats();
        return stats.channels.length === 4;
      }

      return false;
    } catch (error) {
      console.warn(
        `⚠️  Could not detect transparency for ${filePath}, assuming opaque`,
      );
      return false;
    }
  }

  /**
   * Определяет выходной файл и формат на основе конфигурации
   *
   * Анализирует прозрачность изображения и выбирает соответствующий
   * выходной формат из конфигурации. Поддерживает значение "none"
   * для сохранения исходного формата.
   *
   * @param {string} inputPath - Путь к входному файлу
   * @param {Object} config - Конфигурация изображения
   * @param {boolean} hasAlpha - Имеет ли изображение прозрачность
   * @returns {Object} Объект с outputPath и outputFormat
   */
  getOutputPathAndFormat(inputPath, config, hasAlpha) {
    const dir = path.dirname(inputPath);
    const originalExt = path.extname(inputPath).toLowerCase();
    const baseName = path.basename(inputPath, originalExt);

    // Определяем выходной формат на основе прозрачности
    let outputFormat = hasAlpha
      ? config.outputFormat.transparent
      : config.outputFormat.opaque;

    // Если формат "none", используем исходный
    if (outputFormat === "none") {
      outputFormat = originalExt.slice(1); // убираем точку
    }

    // Нормализуем формат
    if (outputFormat === "jpg") {
      outputFormat = "jpeg";
    }

    const outputExt = outputFormat === "jpeg" ? ".jpg" : `.${outputFormat}`;
    const outputPath = path.join(dir, `${baseName}_compressed${outputExt}`);

    return { outputPath, outputFormat };
  }

  /**
   * Применяет настройки изменения размера к pipeline Sharp
   *
   * @param {Object} pipeline - Pipeline Sharp
   * @param {Object} maxSizeConfig - Конфигурация максимального размера
   * @returns {Object} Модифицированный pipeline
   */
  applyResizeTransform(pipeline, maxSizeConfig) {
    if (!maxSizeConfig || (!maxSizeConfig.width && !maxSizeConfig.height)) {
      return pipeline;
    }

    return pipeline.resize({
      width: maxSizeConfig.width || null,
      height: maxSizeConfig.height || null,
      fit: maxSizeConfig.fit || "inside",
      withoutEnlargement: maxSizeConfig.withoutEnlargement !== false,
    });
  }

  /**
   * Применяет настройки компрессии в зависимости от формата
   *
   * Выбирает соответствующие настройки компрессии и применяет их
   * к pipeline Sharp в зависимости от выходного формата изображения.
   *
   * @param {Object} pipeline - Pipeline Sharp
   * @param {string} outputFormat - Выходной формат изображения
   * @param {number} quality - Качество сжатия (0-100)
   * @param {boolean} hasAlpha - Имеет ли изображение прозрачность
   * @returns {Object} Модифицированный pipeline с настройками компрессии
   */
  applyCompressionTransform(pipeline, outputFormat, quality, hasAlpha) {
    switch (outputFormat) {
      case "jpeg":
        return pipeline.jpeg({
          quality: quality,
          mozjpeg: true,
          progressive: quality < 90,
        });

      case "png":
        return pipeline.png({
          quality: quality,
          compressionLevel: Math.max(
            1,
            Math.min(9, Math.round((100 - quality) / 12)),
          ),
          progressive: quality < 90,
        });

      case "webp":
        return pipeline.webp({
          quality: quality,
          lossless: quality >= 95,
        });

      case "avif":
        return pipeline.avif({
          quality: quality,
          lossless: quality >= 95,
        });

      default:
        console.warn(`⚠️  Unsupported output format: ${outputFormat}`);
        return pipeline;
    }
  }

  /**
   * Форматирует размер файла в человекочитаемом формате
   *
   * @param {number} bytes - Размер в байтах
   * @returns {string} Отформатированный размер (например, "1.23 MB")
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (bytes / Math.pow(k, i)).toFixed(2) + " " + units[i];
  }

  /**
   * Обрабатывает отдельный файл изображения
   *
   * Выполняет полный цикл обработки:
   * 1. Определяет прозрачность изображения
   * 2. Загружает соответствующую конфигурацию
   * 3. Применяет изменение размера (если настроено)
   * 4. Применяет компрессию в соответствии с форматом
   * 5. Сохраняет результат с суффиксом _compressed
   * 6. Отслеживает размеры файлов для статистики
   *
   * @param {string} filePath - Путь к исходному файлу изображения
   */
  async processImageFile(filePath) {
    const originalExt = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, originalExt);

    console.log(
      `➡️  Processing: ${path.relative(this.imagesDirectory, filePath)}`,
    );

    try {
      // Получаем размер оригинального файла
      const originalStats = fs.statSync(filePath);
      const originalSize = originalStats.size;
      this.totalOriginalSize += originalSize;

      // Определяем прозрачность
      const hasAlpha = await this.hasTransparency(filePath);
      const transparencyStatus = hasAlpha ? "transparent" : "opaque";

      // Получаем конфигурацию для этого изображения
      const config = this.getImageConfig(baseName);

      // Определяем выходной путь и формат
      const { outputPath, outputFormat } = this.getOutputPathAndFormat(
        filePath,
        config,
        hasAlpha,
      );

      // Получаем качество на основе прозрачности
      const quality = hasAlpha
        ? config.quality.transparent
        : config.quality.opaque;

      console.log(
        `📊 Type: ${transparencyStatus}, Format: ${outputFormat}, Quality: ${quality}`,
      );

      if (originalExt.slice(1) !== outputFormat) {
        console.log(`🔄 Converting to ${outputFormat.toUpperCase()}`);
      }

      // Создаем pipeline для обработки
      let pipeline = sharp(filePath);

      // Применяем изменение размера
      if (config.maxSize) {
        pipeline = this.applyResizeTransform(pipeline, config.maxSize);
      }

      // Применяем компрессию в зависимости от выходного формата
      pipeline = this.applyCompressionTransform(
        pipeline,
        outputFormat,
        quality,
        hasAlpha,
      );

      await pipeline.toFile(outputPath);

      // Получаем размер сжатого файла
      const compressedStats = fs.statSync(outputPath);
      const compressedSize = compressedStats.size;
      this.totalCompressedSize += compressedSize;

      // Вычисляем процент сжатия
      const compressionRatio = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(1);
      const compressionInfo =
        compressedSize < originalSize
          ? `(-${compressionRatio}%)`
          : `(+${Math.abs(compressionRatio)}%)`;

      console.log(
        `✅ Written: ${path.relative(this.imagesDirectory, outputPath)} ` +
          `${this.formatFileSize(compressedSize)} ${compressionInfo}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed: ${path.relative(this.imagesDirectory, filePath)}\n`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  /**
   * Находит все сжатые файлы изображений, для которых существует оригинал
   *
   * Сканирует директорию и находит файлы с суффиксом _compressed,
   * проверяя при этом наличие соответствующего оригинального файла.
   *
   * @returns {string[]} Массив путей к сжатым файлам с существующими оригиналами
   */
  findCompressedImagesWithOriginals() {
    const allFiles = this.walkDirectory(this.imagesDirectory);
    const compressedFiles = [];

    for (const filePath of allFiles) {
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();

      // Проверяем, является ли файл сжатым
      if (
        fileName.includes("_compressed") &&
        this.supportedExtensions.includes(ext)
      ) {
        // Извлекаем базовое имя без _compressed и расширения
        const baseNameWithExt = fileName.replace("_compressed", "");
        const baseName = path.basename(
          baseNameWithExt,
          path.extname(baseNameWithExt),
        );
        const directory = path.dirname(filePath);

        // Ищем оригинальный файл с любым поддерживаемым расширением
        const originalExists = this.supportedExtensions.some((originalExt) => {
          const originalPath = path.join(directory, baseName + originalExt);
          return fs.existsSync(originalPath);
        });

        if (originalExists) {
          compressedFiles.push(filePath);
        }
      }
    }

    return compressedFiles;
  }

  /**
   * Удаляет все сжатые изображения, для которых существуют оригиналы
   *
   * Находит и удаляет файлы с суффиксом _compressed, но только если
   * для них существуют соответствующие оригинальные файлы.
   */
  cleanupCompressedImages() {
    const compressedFiles = this.findCompressedImagesWithOriginals();

    if (compressedFiles.length === 0) {
      console.log("🧹 No compressed images to clean up");
      return;
    }

    console.log(
      `🧹 Cleaning up ${compressedFiles.length} compressed images...`,
    );

    let deleted = 0;
    let failed = 0;

    for (const filePath of compressedFiles) {
      try {
        fs.unlinkSync(filePath);
        console.log(
          `   🗑️  Deleted: ${path.relative(this.imagesDirectory, filePath)}`,
        );
        deleted++;
      } catch (error) {
        console.error(
          `   ❌ Failed to delete: ${path.relative(this.imagesDirectory, filePath)}`,
        );
        failed++;
      }
    }

    console.log(
      `✨ Cleanup complete: ${deleted} deleted${failed > 0 ? `, ${failed} failed` : ""}`,
    );
  }

  /**
   * Обрабатывает все найденные файлы изображений
   *
   * Основной метод, который:
   * 1. Очищает существующие сжатые изображения
   * 2. Находит все несжатые файлы изображений
   * 3. Обрабатывает каждый файл с применением соответствующих настроек
   * 4. Выводит статистику обработки
   */
  async processAllImages() {
    // Сначала очищаем существующие сжатые файлы
    this.cleanupCompressedImages();
    console.log(); // Пустая строка для разделения

    const imageFiles = this.findUncompressedImageFiles();

    if (imageFiles.length === 0) {
      console.log("No uncompressed images found in /Images");
      return;
    }

    console.log(`🖼️  Found ${imageFiles.length} images to process`);

    let processed = 0;
    let failed = 0;

    for (const filePath of imageFiles) {
      try {
        await this.processImageFile(filePath);
        processed++;
      } catch (error) {
        console.error(
          `❌ Failed: ${path.relative(this.imagesDirectory, filePath)}\n`,
          error instanceof Error ? error.message : error,
        );
        failed++;
      }
    }

    console.log(`\n✨ Processing complete:`);
    console.log(`   ✅ Processed: ${processed}`);
    if (failed > 0) {
      console.log(`   ❌ Failed: ${failed}`);
    }

    // Показываем статистику размеров файлов
    if (processed > 0) {
      const totalSavings = this.totalOriginalSize - this.totalCompressedSize;
      const totalCompressionRatio = (
        (totalSavings / this.totalOriginalSize) *
        100
      ).toFixed(1);

      console.log(`\n📊 Size Analysis:`);
      console.log(
        `   📁 Original total: ${this.formatFileSize(this.totalOriginalSize)}`,
      );
      console.log(
        `   📦 Compressed total: ${this.formatFileSize(this.totalCompressedSize)}`,
      );

      if (totalSavings > 0) {
        console.log(
          `   💾 Space saved: ${this.formatFileSize(totalSavings)} (${totalCompressionRatio}%)`,
        );
      } else if (totalSavings < 0) {
        console.log(
          `   📈 Size increased: ${this.formatFileSize(Math.abs(totalSavings))} (+${Math.abs(totalCompressionRatio)}%)`,
        );
      } else {
        console.log(`   ⚖️  Size unchanged`);
      }
    }
  }
}

/**
 * Запуск процесса компрессии изображений
 *
 * Создает экземпляр компрессора и запускает обработку всех файлов.
 * В случае критической ошибки завершает процесс с кодом 1.
 */
const compressor = new ImageCompressor();
compressor.processAllImages().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
