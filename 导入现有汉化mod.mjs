import compare from 'js-struct-compare';
import dotenv from 'dotenv';
import fs from 'fs-jetpack';
import path from 'path';
import _ from 'lodash';
import fetch from 'node-fetch';
import crypto from 'crypto';
import debouncePromise from 'awesome-debounce-promise';

const sourceDirName = 'Kenan-Modpack';
const translatedDirName = `Kenan-Modpack-Chinese`;
const translateCacheDirName = `中文翻译`;

const __dirname = '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/';
const translationsToImport = ['secronom'];
const translationsToImportInDir = 'imports';

const TRANSLATION_ERROR = 'Translation Error';

/**
 *  paratranz 的翻译条目格式，保存到文件时保存为此格式，读取时反序列化为 original: translation 放入 cache
  * 来自 https://paratranz.cn/projects/create
 *  
 [
  {
    "key": "KEY 键值",
    "original": "source text 原文",
    "translation": "translation text 译文",
    "context": "string meta info, context, etc. 上下文或其他信息"
  },
  {
    "key": "KEY 键值 2",
    "original": "source text 原文 2",
    "translation": "translation text 译文 2"
  }
] 
*/
function kvToParatranz(kvTranslationsCache, stages, contexts) {
  return _.sortBy(
    Object.entries(kvTranslationsCache).map(([original, translation]) => {
      return {
        key: crypto.createHash('md5').update(original).digest('hex'),
        original,
        translation,
        context: contexts[original],
        stage: stages[original],
      };
    }),
    'original'
  );
}
/**
 * 把 paratranz 的翻译条目格式转换回 { original: translation } 的格式
 */
function paratranzToKV(paratranzTranslationsContent) {
  return paratranzTranslationsContent.reduce((prev, item) => {
    if (item.translation?.includes(TRANSLATION_ERROR)) {
      return { ...prev, [item.original]: TRANSLATION_ERROR };
    }
    return { ...prev, [item.original]: item.translation };
  }, {});
}
/**
 * 把 paratranz 的翻译条目格式转换回 { original: translation } 的格式
 */
function paratranzToStage(paratranzTranslationsContent) {
  return paratranzTranslationsContent.reduce((prev, item) => {
    if (item.translation?.includes(TRANSLATION_ERROR)) {
      return { ...prev, [item.original]: TRANSLATION_ERROR };
    }
    return { ...prev, [item.original]: item.stage };
  }, {});
}
/**
 * 把 paratranz 的翻译条目格式转换回 { original: translation } 的格式
 */
function paratranzToContext(paratranzTranslationsContent) {
  return paratranzTranslationsContent.reduce((prev, item) => {
    if (item.translation?.includes(TRANSLATION_ERROR)) {
      return { ...prev, [item.original]: TRANSLATION_ERROR };
    }
    return { ...prev, [item.original]: item.context };
  }, {});
}

class ModCache {
  modName;
  stages = {};
  contexts = {};
  translationCache = {};
  translationCacheFilePath;
  /**
   * 初始化翻译缓存，没传第二个参数时，尝试从文件系统里加载有之前翻译和润色过的内容的翻译缓存，如果该翻译缓存文件不存在，就创建一个出来
   */
  constructor(translationCacheFilePath, translationCache = {}, modName, stages) {
    this.modName = modName;
    this.translationCacheFilePath = translationCacheFilePath;
    this.debouncedWriteTranslationCache = _.debounce(this.writeTranslationCache.bind(this), 1000);
    try {
      this.stages =
        stages ??
        paratranzToStage(JSON.parse(_.trim(fs.read(translationCacheFilePath, 'utf8')).replaceAll('\\\\n', '\\n')));
      this.contexts = paratranzToContext(JSON.parse(_.trim(fs.read(translationCacheFilePath, 'utf8')).replaceAll('\\\\n', '\\n')));
      if (Object.keys(translationCache).length === 0) {
        this.translationCache = paratranzToKV(
          JSON.parse(_.trim(fs.read(translationCacheFilePath, 'utf8')).replaceAll('\\\\n', '\\n'))
        );
      }
    } catch (error) {
      logger.error(
        `ModCache error ${translationCacheFilePath}, create empty translation cache to fs ${translationCache}, errorMessage is\n ${error.message} ${error.stack}\n`
      );
      process.exit(1);
      // this.writeTranslationCache(translationCacheFilePath, {});
    }
  }

  setContext(key, value) {
    this.contexts[key] = value;
  }

  writeTranslationCache(
    translationCacheFilePath = this.translationCacheFilePath,
    translationCache = this.translationCache
  ) {
    return fs.write(
      translationCacheFilePath,
      JSON.stringify(kvToParatranz(translationCache, this.stages, this.contexts), undefined, ' ')
    );
  }

  insertToCache(key, value) {
    this.translationCache[key] = value;
    this.debouncedWriteTranslationCache();
  }

  /**
   * 从本Mod翻译内容缓存或全局翻译缓存里获取内容，优先本Mod缓存
   */
  get(key) {
    if (this.translationCache[key] !== undefined) {
      const translatedValue = this.translationCache[key];
      // 如果本地翻译没有此内容，就用共享翻译资源刷新此mod翻译
      if (this.translationCache[key] === undefined) {
        this.insertToCache(key, translatedValue);
      }
      return translatedValue;
    }
  }
}

/**
 * 读取原始文件内容，打平成一维数组，并带上路径信息
 * @param {string} 原始mod文件夹的地址
 */
function readSourceFiles(sourceModDirPath) {
  const folders = fs.inspectTree(sourceModDirPath);
  const foldersWithContent = getFileJSON(folders, path.dirname(sourceModDirPath));
  return foldersWithContent;
}

/**
 * 递归把文件内容塞进文件树里
 * @param {Object} inspectData https://www.npmjs.com/package/fs-jetpack#inspecttreepath-options
 * @param {string | undefined} parentPath 用于拼凑 filePath 用的父级路径
 */
function getFileJSON(inspectData, parentPath = '') {
  const filePath = path.join(parentPath, inspectData.name);
  if (inspectData.type === 'file') {
    if (inspectData.name === '.DS_Store') return;
    if (inspectData.name.endsWith('json')) {
      // JSON 文件
      return { ...inspectData, content: JSON.parse(fs.read(filePath)), filePath };
    } else {
      // png 贴图等
      return { ...inspectData, rawContent: fs.read(filePath, 'buffer'), filePath };
    }
  }
  if (inspectData.type === 'dir') {
    return _.compact(inspectData.children.flatMap((item) => getFileJSON(item, filePath)));
  }
}

/**
 * 开始翻译，一次翻译一个 Mod
 * @param {string} sourceModName 源文件夹里要翻译的 mod 的名字
 */
async function translateOneMod(sourceModName) {
  const translationCacheFilePath = path.join(__dirname, translateCacheDirName, `${sourceModName}.json`);
  const sourceModDirPath = path.join(__dirname, sourceDirName, sourceModName);
  const goodModDirPath = path.join(__dirname, translationsToImportInDir, sourceModName);
  let modTranslationCache;
  try {
    const sourceFileContents = _.sortBy(readSourceFiles(sourceModDirPath), 'name');
    const goodFileContents = _.sortBy(readSourceFiles(goodModDirPath), 'name');
    if (sourceFileContents.length !== goodFileContents.length) {
      throw new Error(`Length diff, left: ${sourceFileContents.length} !== right: ${goodFileContents.length}`);
    }
    modTranslationCache = new ModCache(translationCacheFilePath, {}, sourceModName);
    for (let index = 0; index < goodFileContents.length; index++) {
      if (sourceFileContents[index].name !== goodFileContents[index].name) {
        throw new Error(
          `Name diff, left: ${sourceFileContents[index].name} !== right: ${goodFileContents[index].name}`
        );
      }
      const differences = compare(sourceFileContents[index].content, goodFileContents[index].content);
      differences.forEach((diff) => {
        const hasChinese = /[\u4e00-\u9fa5]/.test(diff.right_value);
        if (modTranslationCache.get(diff.left_value) && hasChinese) {
          modTranslationCache.insertToCache(diff.left_value, diff.right_value);
        }
      });
    }
    modTranslationCache.writeTranslationCache();
  } catch (error) {
    console.error(`translateOneMod failed for ${sourceModName} ${error.message} ${error.stack}`);
  }
}

async function main() {
  for (const sourceModName of translationsToImport) {
    console.log(`\n${sourceModName} Translate start!\n`);
    await translateOneMod(sourceModName);
    console.log(`\n${sourceModName} Translate done!\n`);
  }
}
// 执行翻译脚本
main().catch((error) => {
  console.error(`Unexpectedly quit, error is ${error.message} ${error.stack}`);
  console.error(error, `${error.message} ${error.stack}`);
  process.exit(1);
});
