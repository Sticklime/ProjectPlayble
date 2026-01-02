/**
 * @fileoverview Image compression utility
 * @description Compresses images in Images directory with configurable quality and format settings
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/**
 * Image compression class
 * Processes images with configurable optimization and format conversion
 */
class ImageCompressor {
  /**
   * ImageCompressor constructor
   * Initializes paths and loads compression configuration
   */
  constructor() {
    this.projectRoot = path.resolve(__dirname, "../..");
    this.configPath = path.join(__dirname, "config.json");
    this.imagesDirectory = path.join(this.projectRoot, "Images");
    this.supportedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    this.compressionConfig = this.loadCompressionConfig();
    this.totalOriginalSize = 0;
    this.totalCompressedSize = 0;
  }

  /**
   * Loads compression configuration from JSON file
   * @returns {Object} Configuration object
   * @throws {Error} If configuration file not found
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
   * Finds uncompressed image files in Images directory
   * @returns {string[]} Array of file paths without _compressed suffix
   *
   * @returns {string[]} Array of uncompressed image file paths
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

    // Apply custom settings
    if (customConfig.maxSize) {
      mergedConfig.maxSize = {
        ...mergedConfig.maxSize,
        ...customConfig.maxSize,
      };
    }

    if (customConfig.quality !== undefined) {
      // In custom config, quality is a number, apply to both types
      mergedConfig.quality = {
        opaque: customConfig.quality,
        transparent: customConfig.quality,
      };
    }

    if (customConfig.outputFormat) {
      // In custom config, single format for all image types
      mergedConfig.outputFormat = {
        opaque: customConfig.outputFormat,
        transparent: customConfig.outputFormat,
      };
    }

    return mergedConfig;
  }

  /**
   * Determines if image has alpha channel (transparency)
   * @param {string} filePath - Image file path
   * @returns {Promise<boolean>} true if image has transparency
   */
  async hasTransparency(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();

      // PNG and WebP can have alpha channel
      if (metadata.channels === 4 || metadata.hasAlpha === true) {
        return true;
      }

      // For PNG, additionally check alpha channel in statistics
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
   * Determines output file and format based on configuration
   * Analyzes image transparency and selects appropriate format
   * @param {string} inputPath - Input file path
   * @param {Object} config - Image configuration
   * @param {boolean} hasAlpha - Whether image has transparency
   * @returns {Object} Object with outputPath and outputFormat
   */
  getOutputPathAndFormat(inputPath, config, hasAlpha) {
    const dir = path.dirname(inputPath);
    const originalExt = path.extname(inputPath).toLowerCase();
    const baseName = path.basename(inputPath, originalExt);

    // Determine output format based on transparency
    let outputFormat = hasAlpha
      ? config.outputFormat.transparent
      : config.outputFormat.opaque;

    // If format is "none", use original
    if (outputFormat === "none") {
      outputFormat = originalExt.slice(1); // remove dot
    }

    // Normalize format
    if (outputFormat === "jpg") {
      outputFormat = "jpeg";
    }

    const outputExt = outputFormat === "jpeg" ? ".jpg" : `.${outputFormat}`;
    const outputPath = path.join(dir, `${baseName}_compressed${outputExt}`);

    return { outputPath, outputFormat };
  }

  /**
   * Applies resize settings to Sharp pipeline
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
