import compare from 'js-struct-compare';
import dotenv from 'dotenv';
import fs from 'fs-jetpack';
import path from 'path';
import _ from 'lodash';
import fetch from 'node-fetch';
import crypto from 'crypto';
import debouncePromise from 'awesome-debounce-promise';
import { execSync } from 'child_process';

const sourceDirName = 'Kenan-Modpack';
const translatedDirName = `Kenan-Modpack-Chinese`;
const translateCacheDirName = `中文翻译`;
const hasChinese = (text) => /[\u4e00-\u9fa5]/.test(text);

const __dirname = '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/';
const translationsToImport = [
  // 'Arcana',
  // 'Artyom_Emporium_v.1',
  // 'Mining_Mod',
  // 'nocts_cata_mod_DDA',
  // 'oa_early_game_mutations_mod',
  // 'PKs_Rebalancing',
  // 'Project_Kawaii',
  // 'secronom',
  // 'vamp_stuff',
  'Fallout_CDDA',
  'MST_Extra',
];
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/Fallout_CDDA' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports/Fallout_CDDA' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/MST_Extra' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports/MST_Extra' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/Arcana' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports/Arcana' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/oa_early_game_mutations_mod' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports/oa_early_game_mutations_mod' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/PKs_Rebalancing' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports/PKs_Rebalancing' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/secronom' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports/secronom' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports/vamp_stuff' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/vamp_stuff' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/Project_Kawaii' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports/Project_Kawaii' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/nocts_cata_mod_DDA' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports/nocts_cata_mod_DDA' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/Mining_Mod' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'
// cp -R -n '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/Kenan-Modpack/Artyom_Emporium_v.1' '/Users/linonetwo/Desktop/repo/CDDA-Kenan-Modpack-Chinese/imports'

const translationsToImportInDir = 'imports';

/**
 * 共享所有Mod翻译的成果，加速翻译，但之后每个mod自己还是存一份
 */
let sharedTranslationCache = {};
const sharedName = '共享';
/**
 * 在启动时调用，加载之前翻译过的内容，无需使用 paratranz 格式，以加速导入
 */
function loadSharedTranslationCache() {
  console.log('加载缓存的翻译');
  let count = 1;
  const sharedPath = path.join(__dirname, translateCacheDirName, `${sharedName}.json`);
  console.log(`加载${sharedName}的翻译 ${sharedPath}`);
  sharedTranslationCache = JSON.parse(fs.read(sharedPath, 'utf8'));
}
function storeSharedTranslationCache() {
  console.log('储存共享的翻译');
  const sharedTranslationCacheFilePath = path.join(__dirname, translateCacheDirName, `${sharedName}.json`);
  fs.write(sharedTranslationCacheFilePath, JSON.stringify(sharedTranslationCache, undefined, '  '));
}

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
    return { ...prev, [item.original]: item.translation };
  }, {});
}
/**
 * 把 paratranz 的翻译条目格式转换回 { original: translation } 的格式
 */
function paratranzToStage(paratranzTranslationsContent) {
  return paratranzTranslationsContent.reduce((prev, item) => {
    return { ...prev, [item.original]: item.stage };
  }, {});
}
/**
 * 把 paratranz 的翻译条目格式转换回 { original: translation } 的格式
 */
function paratranzToContext(paratranzTranslationsContent) {
  return paratranzTranslationsContent.reduce((prev, item) => {
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
      this.contexts = paratranzToContext(
        JSON.parse(_.trim(fs.read(translationCacheFilePath, 'utf8')).replaceAll('\\\\n', '\\n'))
      );
      if (Object.keys(translationCache).length === 0) {
        this.translationCache = paratranzToKV(
          JSON.parse(_.trim(fs.read(translationCacheFilePath, 'utf8')).replaceAll('\\\\n', '\\n'))
        );
      }
    } catch (error) {
      console.error(
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
      try {
        return { ...inspectData, content: JSON.parse(fs.read(filePath)), filePath };
      } catch (error) {
        throw new Error(`${filePath} ${error.message} ${error.stack}`);
      }
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
  const sourceFileContents = _.sortBy(readSourceFiles(sourceModDirPath), 'name');
  const goodFileContents = _.sortBy(readSourceFiles(goodModDirPath), 'name');
  if (sourceFileContents.length !== goodFileContents.length) {
    throw new Error(`Length diff, left: ${sourceFileContents.length} !== right: ${goodFileContents.length}
      You should:
# 手动运行这些，用 execAndLog 不明原因报错
${
  sourceFileContents.length > goodFileContents.length
    ? `
cp -R -n '${__dirname}Kenan-Modpack/${sourceModName}' '${__dirname}imports'`
    : `cp -R -n '${__dirname}imports/${sourceModName}' '${__dirname}Kenan-Modpack'
`
}
`);
  }
  modTranslationCache = new ModCache(translationCacheFilePath, {}, sourceModName);
  for (let index = 0; index < goodFileContents.length; index++) {
    // 检查文件名是否一致
    if (sourceFileContents[index].name !== goodFileContents[index].name) {
      throw new Error(`Name diff, left: ${sourceFileContents[index].name} !== right: ${goodFileContents[index].name}
      Last:
      left: ${sourceFileContents[index - 1].name} !== right: ${goodFileContents[index - 1].name}
      ${JSON.stringify(
        sourceFileContents.map((item) => item.name),
        null,
        '  '
      )} ${JSON.stringify(
        goodFileContents.map((item) => item.name),
        null,
        '  '
      )}
      `);
    }
    if (typeof sourceFileContents[index].content !== 'object' || typeof goodFileContents[index].content !== 'object') {
      continue;
    }
    // 检测内容是否一致
    if (
      Array.isArray(sourceFileContents[index].content) &&
      Array.isArray(goodFileContents[index].content) &&
      sourceFileContents[index].content.length !== goodFileContents[index].content.length
    ) {
      console.warn(`Content length diff ${sourceFileContents[index].name}`);
      continue;
    }
    // 迁移旧版数据
    if (
      Array.isArray(goodFileContents[index].content) &&
      goodFileContents[index].content?.[0]?.name_plural !== undefined
    ) {
      goodFileContents[index].content = goodFileContents[index].content.map((item) => ({
        ...item,
        name: { str: item.name, str_pl: item.name_plural },
      }));
    }
    // 核心部分：比较旧的翻译的mod和新的未翻译mod的区别，来提取出译文-原文对
    const differences = compare(sourceFileContents[index].content, goodFileContents[index].content);
    differences.forEach((diff) => {
      if (
        modTranslationCache.get(diff.left_value) &&
        !hasChinese(diff.left_value) &&
        hasChinese(diff.right_value) &&
        (!modTranslationCache.stages[diff.left_value] ||
          modTranslationCache.stages[diff.left_value] === 1 ||
          modTranslationCache.stages[diff.left_value] === 0)
      ) {
        // 将找到的原文对存起来供以后使用
        modTranslationCache.insertToCache(
          diff.left_value,
          diff.right_value
            .replaceAll(/"(.+)"/g, '“$1”')
            .replaceAll('(', '（')
            .replaceAll(')', '）')
            .replaceAll('。。。', '…')
            .replaceAll(/(?<![\.a-zA-Z0-9])\.(?![\.a-zA-Z0-9])/gm, '。')
            .replaceAll(',', '，')
            .replaceAll('?', '？')
            .replaceAll(':', '：')
            .replaceAll('!', '！')
            .replaceAll('， ', '，')
        );
        modTranslationCache.stages[diff.left_value] = 3;
        // sharedTranslationCache[diff.left_value] = diff.right_value;
      }
    });
  }
}

const execAndLog = (command, options) => console.log(String(execSync(command, options)));
async function main() {
  // loadSharedTranslationCache();
  for (const sourceModName of translationsToImport) {
    console.log(`\n${sourceModName} Translate start!\n`);
    await translateOneMod(sourceModName);
    console.log(`\n${sourceModName} Translate done!\n`);
  }
  // storeSharedTranslationCache();
}
// 执行翻译脚本
main().catch((error) => {
  console.error(
    `Unexpectedly quit, error is`,
    error,
    `${error.message} ${error.stack} ${String(error.stdout)} ${String(error.stderr)}`
  );
  process.exit(1);
});
