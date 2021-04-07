const BaiduTranslate = require('baidu-translate');
const promiseRetry = require('promise-retry');
const dotenv = require('dotenv');
const fs = require('fs-jetpack');
const path = require('path');
const _ = require('lodash');
const fetch = require('node-fetch');
const crypto = require('crypto');
const debouncePromise = require('awesome-debounce-promise').default;

const wikiSiteBase = 'https://onetwo.ren/CDDA-Kenan-Modpack-Chinese/#';
const sourceDirName = 'Kenan-Modpack';
const translatedDirName = `Kenan-Modpack-汉化版`;
const translateCacheDirName = `中文翻译`;
const cddaWikiFolder = path.join(__dirname, 'wiki', 'tiddlers', 'cdda');
/**
 * 作为高质量翻译源的 mod，会指导其他 mod 的翻译
 */
const highQualityMods = ['nocts_cata_mod_DDA', 'secronom', 'Arcana'];

const getFakeId = (item, index) =>
  typeof item?.id === 'string'
    ? item.id
    : item?.type === 'recipe' && item.result && item.difficulty
    ? `${item.result}(difficulty${item.difficulty})`
    : item?.type === 'speech' && item.speaker
    ? `${Array.isArray(item.speaker) ? item.speaker[0] : item.speaker}→${index}`
    : item?.type === 'AMMO' || item?.type === 'COMESTIBLE'
    ? item.abstract
    : `[${index}]`;
const getContext = (sourceModName, item, index) => `${sourceModName}→${item.type}→${getFakeId(item, index)}`;

let logCounter = 0;
let logs = [];
let errors = [];
const logger = {
  log: (...message) => {
    console.log(...message);
    logs.push(`Log${logCounter++} ${message.join(' ')}\n`);
    debouncedFlushLog();
  },
  error: (...message) => {
    console.error(...message);
    errors.push(`Log${logCounter++} ${message.join(' ')}\n`);
    debouncedFlushLog();
  },
  flush: () => {
    fs.append(path.join(__dirname, 'log.log'), logs.join('\n'));
    fs.append(path.join(__dirname, 'error.log'), errors.join('\n'));
    logs = [];
    errors = [];
  },
};
const debouncedFlushLog = _.debounce(logger.flush, 1000);

// 创建容纳翻译的文件夹
fs.dir(path.join(__dirname, translatedDirName));
fs.dir(path.join(__dirname, translateCacheDirName));
fs.dir(path.join(__dirname, cddaWikiFolder));
//  首先读取 Kenan-Modpack 文件夹里的所有文件名
const sourceModDirs = _.sortedUniq(
  fs.list(path.resolve(__dirname, 'Kenan-Modpack')).filter((name) => name !== '.DS_Store')
);
// 别忘了把百度翻译 API 的 .env 文件黏贴到文件夹里！
// 搜狗的网上搜到了别人的 https://github.com/lunaragon/Translator/blob/b91481c4254ee01b3ce8eae1cea6586c33066e69/competitors/sougou.js#L6  	const PID = '059ad85853c5f20e54508cebf85287cd' const SECRET_KEY = 'c447fe597dc86f8c586cf7adef9dec21'
dotenv.config();
const sougouTranslate = async (value) => {
  const random = Math.floor(Math.random() * 1000000);
  const toHash = `${process.env.SOUGOU_TRANSLATION_APP_ID}${value}${random}${process.env.SOUGOU_TRANSLATION_SECRET}`;
  // 搜狗居然还在用过时的 x-www-form-urlencoded ，令人震惊
  const body = new URLSearchParams();
  body.append('q', value);
  body.append('from', 'en');
  body.append('to', 'zh-CHS');
  body.append('pid', process.env.SOUGOU_TRANSLATION_APP_ID);
  body.append('salt', String(random));
  body.append('sign', crypto.createHash('md5').update(toHash).digest('hex'));
  const response = await fetch('http://fanyi.sogou.com/reventondc/api/sogouTranslate', {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  }).then(function (response) {
    return response.json();
  });
  if (response.errorCode === '0') {
    return response.translation;
  }
  throw new Error(response?.errorCode + response?.message);
};
const baiduTranslateRaw = new BaiduTranslate(
  process.env.BAIDU_TRANSLATION_APP_ID,
  process.env.BAIDU_TRANSLATION_SECRET,
  'zh',
  'en'
);
const baiduTranslate = async (value) => {
  const results = await baiduTranslateRaw(value);
  const { trans_result: result } = results;
  if (result && result.length > 0) {
    const [{ dst }] = result;
    return dst;
  }
  throw new Error(`百度翻译又跪了 result: ${JSON.stringify(results)}`);
};
/**
 * 先尝试百度再尝试搜狗
 * @param {string} value 待翻译的值
 * @returns
 */
const unionTranslate = (value) =>
  baiduTranslate(value).catch((error) =>
    sougouTranslate(value).catch((error2) => {
      throw new Error(error.message + error2.message);
    })
  );

const tags = {
  '</color>': '2222',
  '<color_red>': '2223',
  '<color_light_red>': '2323',
  '<color_dark_red>': '2423',
  '<color_white>': '2224',
  '<color_light_white>': '2324',
  '<color_dark_white>': '2424',
  '<color_green>': '2225',
  '<color_light_green>': '2325',
  '<color_dark_green>': '2425',
  '<color_yellow>': '2226',
  '<color_light_yellow>': '2326',
  '<color_dark_yellow>': '2426',
  '<color_magenta>': '2227',
  '<color_light_magenta>': '2327',
  '<color_dark_magenta>': '2427',
  '<color_cyan>': '2228',
  '<color_light_cyan>': '2328',
  '<color_dark_cyan>': '2428',
  '<color_blue>': '2229',
  '<color_light_blue>': '2329',
  '<color_dark_blue>': '2429',
  '<color_gray>': '2230',
  '<color_light_gray>': '2330',
  '<color_dark_gray>': '2430',
  '<color_pink>': '2231',
  '<color_light_pink>': '2331',
  '<color_dark_pink>': '2431',
  '<color_brown>': '2232',
  '<color_light_brown>': '2332',
  '<color_dark_brown>': '2432',
  '<good>': '5555',
  '</good>': '5655',
  '<name_b>': '5556',
  '<thirsty>': '5557',
  '<swear!>': '5558',
  '<sad>': '5559',
  '<greet>': '5560',
  '<no>': '5561',
  '<im_leaving_you>': '5562',
  '<ill_kill_you>': '5563',
  '<ill_die>': '5564',
  '<wait>': '5565',
  '<no_faction>': '5566',
  '<name_g>': '5567',
  '<keep_up>': '5568',
  '<yawn>': '5569',
  '<very>': '5570',
  '<okay>': '5571',
  '<really>': '5572',
  '<let_me_pass>': '5573',
  '<done_mugging>': '5574',
  '<happy>': '5575',
  '<drop_it>': '5576',
  '<swear>': '5577',
  '<lets_talk>': '5578',
  '<hands_up>': '5579',
  '<move>': '5580',
  '<hungry>': '5581',
  '<fuck_you>': '5582',
  '<npcname>': '6666',
  '<yrwp>': '6667',
  '<mywp>': '6668',
  '<ammo>': '6669',
  '<info>': '6670',
  '</info>': '6671',
  '<the_cataclysm>': '6672',
  '<chitchat_player_responses>': '6673',
  '<speech_warning>': '6674',
  '<sweetie>': '6675',
  '<shoggoth_chat>': '6676',
};
const mapTo111 = {
  '%1$s': '1111',
  '%2$s': '1112',
  '%3$s': '1113',
  '%s': '1114',
  ...tags,
  '\n\n': '7777',
  '\n': '8888',
};
if (_.uniq(Object.keys(mapTo111).map((key) => mapTo111[key])).length !== Object.keys(mapTo111).length) {
  throw new Error('mapTo111 有重复的 key');
}
function replaceNto1111(text) {
  // 防止 %2$s 影响了翻译，先替换成不会被翻译的占位符，然后之后再替换回来
  // 移除前后空格，以免影响搜狗翻译的字符串拼接，它居然要求前后不能有个空格
  return _.trim(Object.keys(mapTo111).reduce((acc, key) => acc.replaceAll(key, ` ${mapTo111[key]}  `), text));
}
function replace1111toN(text) {
  // 防止 %2$s 影响了翻译
  return Object.keys(mapTo111).reduce((acc, key) => acc.replaceAll(mapTo111[key], key), text);
}

const TRANSLATION_ERROR = 'Translation Error';
/**
 * 使用百度翻译，带重试
 * @param {string | undefined} value 要翻译的字符串，可以为空，为空就返回空
 */
function tryTranslation(value) {
  if (typeof value !== 'string') return Promise.resolve(value);
  if (!_.trim(value)) return Promise.resolve('');
  let lastResult = 'null';
  let retryCount = 0;

  const stringToTranslate = replaceNto1111(value);
  return promiseRetry(
    (retry, number) => {
      return unionTranslate(stringToTranslate)
        .then((result) => {
          if (typeof result === 'string') {
            return replace1111toN(result);
          }
          lastResult = result;
          retryCount = number;
          retry();
        })
        .catch((error) => {
          logger.error('Translate failed', error.message, `stringToTranslate:\n${stringToTranslate}`);
          retryCount = number;
          retry();
        });
    },
    { retries: 10, maxTimeout: 10000, randomize: true }
  ).catch((error) => {
    const errorMessage = `${TRANSLATION_ERROR}1: ${error.message} ${error.stack}\nresult:\n${lastResult}\nFrom:\n${value}\nstringToTranslate:\n${stringToTranslate}\nRetryCount: ${retryCount}\nRetry Again\n--\n\n `;
    logger.error(errorMessage);
    return TRANSLATION_ERROR;
  });
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
 * 所有 mod 的 cache
 */
const modTranslationCaches = {};
/**
 * 共享所有Mod翻译的成果，加速翻译，但之后每个mod自己还是存一份
 */
let sharedTranslationCache = {};
const sharedName = '共享';
/**
 * 在启动时调用，加载之前翻译过的内容，无需使用 paratranz 格式，以加速导入
 */
function loadSharedTranslationCache() {
  logger.log('加载缓存的翻译');
  let count = 1;
  const sharedPath = path.join(__dirname, translateCacheDirName, `${sharedName}.json`);
  // logger.log(`加载${sharedName}的翻译 ${sharedPath}`);
  // sharedTranslationCache = JSON.parse(fs.read(sharedPath, 'utf8'));
  for (const sourceModName of highQualityMods) {
    logger.log(`加载缓存的翻译 ${count++}/${highQualityMods.length} ${sourceModName}`);
    try {
      const translationCacheFilePath = path.join(__dirname, translateCacheDirName, `${sourceModName}.json`);
      const kvCacheContent = paratranzToKV(
        JSON.parse(_.trim(fs.read(translationCacheFilePath, 'utf8')).replaceAll('\\\\n', '\\n'))
      );
      const cacheForThisMod = new ModCache(translationCacheFilePath, kvCacheContent, sourceModName);
      modTranslationCaches[sourceModName] = cacheForThisMod;
      sharedTranslationCache = {
        ...sharedTranslationCache,
        ...kvCacheContent,
      };
    } catch (error) {
      logger.error(`loadSharedTranslationCache ${translationCacheFilePath} Error: ${error.message} ${error.stack}`);
    }
  }
}
function storeSharedTranslationCache() {
  logger.log('储存共享的翻译');
  const sharedTranslationCacheFilePath = path.join(__dirname, translateCacheDirName, `${sharedName}.json`);
  fs.write(sharedTranslationCacheFilePath, JSON.stringify(sharedTranslationCache, undefined, '  '));
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
    if (!value.includes(TRANSLATION_ERROR)) {
      sharedTranslationCache[key] = value;
    }
    this.debouncedWriteTranslationCache();
  }

  /**
   * 从本Mod翻译内容缓存或全局翻译缓存里获取内容，优先本Mod缓存
   */
  get(key) {
    if (this.translationCache[key] !== undefined || sharedTranslationCache[key] !== undefined) {
      const translatedValue = this.translationCache[key] ?? sharedTranslationCache[key]; /*  ?? translationCache[key] */
      // 如果本地翻译没有此内容，就用共享翻译资源刷新此mod翻译
      if (this.translationCache[key] === undefined) {
        this.insertToCache(key, translatedValue);
      }
      return translatedValue;
    }
  }
}

/**
 * 尝试使用缓存的内容，没有就实际翻译
 * @param {string} value 待翻译的字符串
 * @param {ModCache} modTranslationCache 此mod的翻译缓存文件
 */
async function translateWithCache(value, modTranslationCache, context) {
  if (value === undefined) return undefined;
  if (value === '') return '';
  logger.log(`\nTranslating ${value}\n`);
  let translatedValue = modTranslationCache.get(value);
  // 有时候 tag 没有被正确翻译，原文里有 tag，结果里没有
  const hasNotTranslatedTag =
    typeof translatedValue === 'string' &&
    Object.keys(tags).some((key) => value.includes(key) && !translatedValue.includes(key));
  if (hasNotTranslatedTag) {
    logger.error(`之前的翻译有问题，没有 tag：\n${value}\n${translatedValue}\n`);
  }
  if (translatedValue !== undefined /*  && !hasNotTranslatedTag */) {
    logger.log(`Use Cached version ${translatedValue}\n--\n`);
  } else {
    // 没有缓存，就更新缓存
    logger.log(`No Cached Translation for ${value}\n`);
    translatedValue = await tryTranslation(value);
    logger.log(`New Translation ${value}\n -> ${translatedValue}\n`);
    modTranslationCache.insertToCache(value, translatedValue);
  }
  modTranslationCache.setContext(value, context);
  return translatedValue;
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
 * 把处理过的结果写到 CN mod 文件夹里
 * @param {Object[]} foldersWithContent 一维数组，基本类似于 inspectData https://www.npmjs.com/package/fs-jetpack#inspecttreepath-options ，但是多了 content 包含 JSON parse 过的文件内容，以及 filePath 是完整的原始文件路径
 */
function writeToCNMod(foldersWithContent) {
  const writeContent = (content) => {
    const newFilePath = content.filePath.replace(`${sourceDirName}/`, `${translatedDirName}/`);
    logger.log('newFilePath', newFilePath);
    if (content.content) {
      // JSON 文件
      fs.write(newFilePath, JSON.stringify(content.content, undefined, '  '));
    } else if (content.rawContent) {
      // png 贴图等
      fs.write(newFilePath, content.rawContent);
    }
  };
  if (Array.isArray(foldersWithContent)) {
    for (const inspectDataWithContent of foldersWithContent) {
      writeContent(inspectDataWithContent);
    }
  } else if (typeof foldersWithContent === 'object' && typeof inspectDataWithContent?.type === 'string') {
    writeContent(foldersWithContent);
  } else {
    throw new Error(`Error Bad Data ${JSON.stringify(inspectDataWithContent)}`);
  }
}

async function writeTiddlerToWikiAndTranslate(sourceModName, jsonName, item, translator) {
  // 把内容写到 wiki 里
  fs.write(
    path.join(cddaWikiFolder, jsonName),
    `tags: ${item.type} ${sourceModName} ${getFakeId(item.id)}
creator: 林一二
title: ${jsonName.replace('.tid', '')}
type: text/vnd.tiddlywiki
`
  );
  fs.append(path.join(cddaWikiFolder, jsonName), '\n\n!! 原文\n\n```json\n');
  fs.append(path.join(cddaWikiFolder, jsonName), JSON.stringify(item, undefined, '  '));
  fs.append(path.join(cddaWikiFolder, jsonName), '\n```\n\n');
  translator(item);
  // 把翻译后的内容写到 wiki 里
  fs.append(path.join(cddaWikiFolder, jsonName), '\n\n!! 汉化\n\n```json\n');
  fs.append(path.join(cddaWikiFolder, jsonName), JSON.stringify(item, undefined, '  '));
  fs.append(path.join(cddaWikiFolder, jsonName), '\n```\n\n');
}

/**
 *
 * @param {Object} fileItem 基本类似于 inspectData https://www.npmjs.com/package/fs-jetpack#inspecttreepath-options ，但是多了 content 包含 JSON parse 过的文件内容
 * @param {ModCache} modTranslationCache 此mod的翻译缓存文件
 */
async function translateStringsInContent(fileItem, modTranslationCache, sourceModName) {
  if (Array.isArray(fileItem.content)) {
    // 文件的内容一般是一维数组
    for (let index = 0; index < fileItem.content.length; index++) {
      const item = fileItem.content[index];
      const translators = getCDDATranslator(modTranslationCache, sourceModName, item, index);
      const translator = translators[item.type];
      if (!translator) {
        logger.error(`没有 ${item.type} 的翻译器`);
      } else {
        const jsonName = `${getContext(sourceModName, item, index)}.tid`;
        await writeTiddlerToWikiAndTranslate(sourceModName, jsonName, item, translator);
      }
    }
    return fileItem;
  } else if (fileItem.rawContent) {
    return fileItem;
  } else {
    const translators = getCDDATranslator(modTranslationCache, sourceModName, fileItem.content, 0);
    const translator = translators[fileItem.content?.type];
    if (!translator) {
      logger.error(`没有 ${fileItem.content?.type ?? fileItem.content?.type} 的翻译器`);
    } else {
      const jsonName = `${getContext(sourceModName, fileItem.content, 0)}.tid`;
      await writeTiddlerToWikiAndTranslate(sourceModName, jsonName, fileItem.content, translator);
    }
    return fileItem;
  }
}

/**
 * 获取 translator 对象，内含从各种 CDDA JSON 里提取待翻译字段的翻译器
 * @param {ModCache} modTranslationCache 此mod的翻译缓存文件
 */
function getCDDATranslator(modTranslationCache, sourceModName, fullItem, index) {
  const translators = {};
  const translateFunction = (value) =>
    translateWithCache(
      value,
      modTranslationCache,
      `ID: ${fullItem.id}\n位于 ${sourceModName}.json\n类型为 ${fullItem.type}\n\nWIKI:\n${wikiSiteBase}${getContext(
        sourceModName,
        fullItem,
        index
      )}`
    );
  const noop = () => {};

  // 常用的翻译器
  const nameDesc = async (item) => {
    if (typeof item?.name === 'string') {
      item.name = await translateFunction(item.name);
    } else if (typeof item?.name === 'object') {
      await maleFemaleItemDesc(item.name);
      await namePlDesc(item);
    }
    item.description = await translateFunction(item.description);
    item.detailed_definition = await translateFunction(item.detailed_definition);
  };
  const maleFemaleItemDesc = async (item) => {
    item.male = await translateFunction(item.male);
    item.female = await translateFunction(item.female);
  };

  const messageOrMessages = async (item) => {
    if (Array.isArray(item?.message)) {
      item.message = await Promise.all(item.message.map((msg) => translateFunction(msg)));
    }
    if (typeof item?.message === 'string') {
      item.message = await translateFunction(item.message);
    }
    if (Array.isArray(item?.messages)) {
      item.messages = await Promise.all(item.messages.map((msg) => translateFunction(msg)));
    }
  };
  const useActionMsg = async (useAction) => {
    if (useAction.activation_message) {
      useAction.activation_message = await translateFunction(useAction.activation_message);
    }
    await messageOrMessages(useAction);
    if (useAction.msg) {
      useAction.msg = await translateFunction(useAction.msg);
    }
    if (useAction.friendly_msg) {
      useAction.friendly_msg = await translateFunction(useAction.friendly_msg);
    }
    if (useAction.hostile_msg) {
      useAction.hostile_msg = await translateFunction(useAction.hostile_msg);
    }
    if (useAction.holster_prompt) {
      useAction.holster_prompt = await translateFunction(useAction.holster_prompt);
    }
    if (useAction.holster_msg) {
      useAction.holster_msg = await translateFunction(useAction.holster_msg);
    }
    if (useAction.need_charges_msg) {
      useAction.need_charges_msg = await translateFunction(useAction.need_charges_msg);
    }
  };
  const attacks = async (item) => {
    if (item.attacks) {
      item.attacks.attack_text_u = await translateFunction(item.attacks.attack_text_u);
      item.attacks.attack_text_npc = await translateFunction(item.attacks.attack_text_npc);
    }
  };
  const monsterAttack = async (item) => {
    if (item.hit_dmg_u) {
      item.hit_dmg_u = await translateFunction(item.hit_dmg_u);
    }
    if (item.hit_dmg_npc) {
      item.hit_dmg_npc = await translateFunction(item.hit_dmg_npc);
    }
    if (item.no_dmg_msg_u) {
      item.no_dmg_msg_u = await translateFunction(item.no_dmg_msg_u);
    }
    if (item.no_dmg_msg_npc) {
      item.no_dmg_msg_npc = await translateFunction(item.no_dmg_msg_npc);
    }
    if (item.miss_msg_u) {
      item.miss_msg_u = await translateFunction(item.miss_msg_u);
    }
    if (item.miss_msg_npc) {
      item.miss_msg_npc = await translateFunction(item.miss_msg_npc);
    }
  };
  const namePlDesc = async (item) => {
    if (item.name) {
      item.name.str = await translateFunction(item.name.str);
      if (item.name.str_pl) {
        item.name.str_pl = await translateFunction(item.name.str_pl);
      }
    }
    if (item.description) {
      item.description = await translateFunction(item.description);
    }
    await messageOrMessages(item);

    if (item.use_action?.activation_message) {
      if (Array.isArray(item.use_action.activation_message)) {
        // 有可能是一个数组
        for (const useAction of item.use_action.activation_message) {
          await useActionMsg(useAction);
        }
      } else {
        // 有可能只有一个，就是个 Object
        await useActionMsg(item.use_action.activation_message);
      }
    }
    await messageOrMessages(item.use_action);

    if (item.special_attacks) {
      for (const specialAttacks of item.special_attacks) {
        if (specialAttacks.description) {
          specialAttacks.description = await translateFunction(specialAttacks.description);
        }
        if (specialAttacks.monster_message) {
          specialAttacks.monster_message = await translateFunction(specialAttacks.monster_message);
        }
        if (specialAttacks.no_ammo_sound) {
          specialAttacks.no_ammo_sound = await translateFunction(specialAttacks.no_ammo_sound);
        }
        await monsterAttack(item);
      }
    }

    await relic(item);
    await attacks(item);
  };

  const relic = async (item) => {
    if (item.relic_data?.passive_effects) {
      for (const passiveEffect of item.relic_data.passive_effects) {
        if (passiveEffect.hit_you_effect) {
          for (const hitYouEffect of passiveEffect.hit_you_effect) {
            await messageOrMessages(hitYouEffect);
            if (hitYouEffect.npc_message) {
              hitYouEffect.npc_message = await translateFunction(hitYouEffect.npc_message);
            }
          }
        }
        if (passiveEffect.hit_me_effect) {
          for (const hitYouEffect of passiveEffect.hit_me_effect) {
            await messageOrMessages(hitYouEffect);

            if (hitYouEffect.npc_message) {
              hitYouEffect.npc_message = await translateFunction(hitYouEffect.npc_message);
            }
          }
        }
      }
    }
  };

  const clothingMod = async (item) => {
    if (item.implement_prompt) {
      item.implement_prompt = await translateFunction(item.implement_prompt);
    }
    if (item.destroy_prompt) {
      item.destroy_prompt = await translateFunction(item.destroy_prompt);
    }
  };

  const dynamicLine = async (line) => {
    if (typeof line.yes === 'string') {
      line.yes = await translateFunction(line.yes);
    } else if (typeof line.yes === 'object') {
      await dynamicLine(line.yes);
    }
    if (typeof line.no === 'string') {
      line.no = await translateFunction(line.no);
    } else if (typeof line.no === 'object') {
      await dynamicLine(line.no);
    }
  };
  const talkTopic = async (item) => {
    if (Array.isArray(item.responses)) {
      for (const response of item.responses) {
        response.text = await translateFunction(response.text);
      }
    }
    if (item.dynamic_line) {
      if (typeof item.dynamic_line === 'string') {
        item.dynamic_line = await translateFunction(item.dynamic_line);
      } else {
        await dynamicLine(item.dynamic_line);
      }
    }
  };

  const infoItem = async (item) => {
    // 注意可能有 <good>protection</good> 这样的标记
    item.info = await translateFunction(item.info);
  };

  const npc = async (item) => {
    item.name_unique = await translateFunction(item.name_unique);
    item.name_suffix = await translateFunction(item.name_suffix);
  };

  // 注册各种类型数据的翻译器
  translators.profession = nameDesc;
  translators.scenario = async (item) => {
    item.name = await translateFunction(item.name);
    item.description = await translateFunction(item.description);
    item.start_name = await translateFunction(item.start_name);
  };
  translators.start_location = namePlDesc;
  translators.furniture = nameDesc;
  translators.gate = async (item) => {
    for (const key of Object.keys(item.messages)) {
      item.messages[key] = await translateFunction(item.messages[key]);
    }
  };
  translators.terrain = nameDesc;
  translators.trap = async (item) => {
    item.name = await translateFunction(item.name);
  };
  translators.item_group = noop;
  translators.ammunition_type = noop;
  translators.AMMO = namePlDesc;
  translators.ARMOR = namePlDesc;
  translators.BIONIC_ITEM = namePlDesc;
  translators.BOOK = namePlDesc;
  translators.GENERIC = namePlDesc;
  translators.TOOL = namePlDesc;
  translators.COMESTIBLE = namePlDesc;
  translators.GUNMOD = namePlDesc;
  translators.GUN = namePlDesc;
  translators.TOOL_ARMOR = namePlDesc;
  translators.harvest = noop;
  translators.SPELL = namePlDesc;
  translators.MONSTER_FACTION = noop;
  translators.monstergroup = noop;
  translators.MONSTER = namePlDesc;
  translators.SPECIES = async (item) => {
    if (item.description) {
      item.description = await translateFunction(item.description);
    }
    if (item.footsteps) {
      item.footsteps = await translateFunction(item.footsteps);
    }
  };
  translators.speech = async (item) => {
    item.sound = await translateFunction(item.sound);
  };
  translators.dream = async (item) => {
    item.messages = await Promise.all(item.messages.map((msg) => translateFunction(msg)));
  };
  translators.mutation_category = async (item) => {
    item.name = await translateFunction(item.name);
    item.iv_message = await translateFunction(item.iv_message);
    item.mutagen_message = await translateFunction(item.mutagen_message);
    item.memorial_message = await translateFunction(item.memorial_message);
  };
  translators.mutation = namePlDesc;
  translators.talk_topic = talkTopic;
  translators.faction = nameDesc;
  translators.mission_definition = async (item) => {
    await namePlDesc(item);
    if (item.dialogue) {
      item.dialogue.describe = await translateFunction(item.dialogue.describe);
      item.dialogue.offer = await translateFunction(item.dialogue.offer);
      item.dialogue.accepted = await translateFunction(item.dialogue.accepted);
      item.dialogue.rejected = await translateFunction(item.dialogue.rejected);
      item.dialogue.advice = await translateFunction(item.dialogue.advice);
      item.dialogue.inquire = await translateFunction(item.dialogue.inquire);
      item.dialogue.success = await translateFunction(item.dialogue.success);
      item.dialogue.success_lie = await translateFunction(item.dialogue.success_lie);
      item.dialogue.failure = await translateFunction(item.dialogue.failure);
    }
  };
  translators.npc_class = noop;
  translators.npc = npc;
  translators.trait_group = noop;
  translators.mapgen = noop;
  translators.ter_furn_transform = async (item) => {
    if (item.fail_message) {
      item.fail_message = await translateFunction(item.fail_message);
    }
    if (Array.isArray(item.terrain)) {
      for (const terrain of item.terrain) {
        await messageOrMessages(terrain);
      }
    }
  };
  translators.overmap_special = noop;
  translators.overmap_terrain = noop;
  translators.region_overlay = noop;
  translators.city_building = noop;
  translators.requirement = noop;
  translators.recipe = noop;
  translators.recipe_category = noop;
  translators.uncraft = noop;
  translators.enchantment = noop;
  translators.SPELL = namePlDesc;
  translators.achievement = async (item) => {
    await namePlDesc(item);
    if (Array.isArray(item.requirements)) {
      for (const requirement of item.requirements) {
        requirement.description = await translateFunction(requirement.description);
      }
    }
  };
  translators.ammo_effect = noop;
  translators.bionic = namePlDesc;
  translators.clothing_mod = clothingMod;
  translators.effect_type = async (item) => {
    if (Array.isArray(item.name)) {
      item.name = await Promise.all(item.name.map((msg) => translateFunction(msg)));
    }
    if (Array.isArray(item.desc)) {
      item.desc = await Promise.all(item.desc.map((msg) => translateFunction(msg)));
    }
    if (item.remove_message) {
      item.remove_message = await translateFunction(item.remove_message);
    }

    if (Array.isArray(item.decay_messages) && Array.isArray(item.decay_messages[0])) {
      item.decay_messages = await Promise.all(
        item.decay_messages.map((msgGroup) => Promise.all(msgGroup.map((msg) => translateFunction(msg))))
      );
    }
  };
  translators.emit = noop;
  translators.field_type = noop;
  translators.json_flag = infoItem;
  translators.martial_art = async (item) => {
    item.description = await translateFunction(item.description);
    if (Array.isArray(item.initiate)) {
      item.initiate = await Promise.all(item.initiate.map((msg) => translateFunction(msg)));
    }
    if (Array.isArray(item.onmove_buffs)) {
      for (const buff of item.onmove_buffs) {
        await nameDesc(buff);
      }
    }
    if (Array.isArray(item.onattack_buffs)) {
      for (const buff of item.onattack_buffs) {
        await nameDesc(buff);
      }
    }
    if (Array.isArray(item.onhit_buffs)) {
      for (const buff of item.onhit_buffs) {
        await nameDesc(buff);
      }
    }
    if (Array.isArray(item.onkill_buffs)) {
      for (const buff of item.onkill_buffs) {
        await nameDesc(buff);
      }
    }
  };
  translators.material = nameDesc;
  translators.MOD_INFO = nameDesc;
  translators.scent_type = noop;
  translators.skill = namePlDesc;
  translators.snippet = async (item) => {
    if (Array.isArray(item.text)) {
      for (const text of item.text) {
        text.text = await translateFunction(text.text);
      }
    }
  };
  translators.technique = async (item) => {
    item.name = await translateFunction(item.name);
    await messageOrMessages(item);
  };
  translators.vehicle_part = namePlDesc;
  translators.overlay_order = noop;
  translators.mod_tileset = noop;
  translators.palette = noop;
  translators.event_statistic = async (item) => {
    if (item.description?.str_sp) {
      item.description.str_sp = await translateFunction(item.description.str_sp);
    }
  };
  translators.event_transformation = noop;
  translators.MAGAZINE = namePlDesc;
  translators.monsterAttack = namePlDesc;
  translators.WHEEL = nameDesc;
  translators.mutation_type = noop;
  translators.map_extra = namePlDesc;
  translators.tool_quality = namePlDesc;
  translators.construction = noop;
  translators.construction_group = nameDesc;
  translators.vehicle_group = noop;
  translators.PET_ARMOR = namePlDesc;
  translators.item_action = namePlDesc;
  translators.ENGINE = namePlDesc;
  translators.ITEM_CATEGORY = namePlDesc;
  translators.sound_effect = noop;
  translators.vehicle_placement = noop;
  translators.monster_attack = monsterAttack;
  translators.EXTERNAL_OPTION = infoItem;
  translators.overmap_land_use_code = nameDesc;
  translators.region_settings = noop;
  translators.proficiency = noop;
  translators.overmap_location = noop;
  translators.ITEM_BLACKLIST = noop;
  translators.MONSTER_BLACKLIST = noop;
  translators.MONSTER_WHITELIST = noop;
  translators.colordef = noop;
  translators.monster_adjustment = noop;
  translators.MIGRATION = noop;
  translators.vehicle = nameDesc;
  translators.vehicle_spawn = noop;
  translators.file = noop;

  return translators;
}

/**
 * 助手函数，帮我们限制一次请求翻译API的量
 */
const chunkAsync = (arr, callback, chunkSize = 1) => {
  const results = [];
  const chunks = _.chunk(arr, chunkSize);
  const work = chunks.reduce((previousPromise, chunk) => {
    return previousPromise.finally(() => {
      results.push(...chunk.map(callback));
      return Promise.all(results);
    });
  }, Promise.resolve());
  return work.finally(() => {}).then(() => Promise.all(results));
};

/**
 * 开始翻译，一次翻译一个 Mod
 * @param {string} sourceModName 源文件夹里要翻译的 mod 的名字
 */
async function translateOneMod(sourceModName) {
  const translationCacheFilePath = path.join(__dirname, translateCacheDirName, `${sourceModName}.json`);
  const sourceModDirPath = path.join(__dirname, sourceDirName, sourceModName);
  let modTranslationCache;
  try {
    const sourceFileContents = readSourceFiles(sourceModDirPath);
    modTranslationCache =
      modTranslationCaches[sourceModName] ?? new ModCache(translationCacheFilePath, {}, sourceModName);
    const contents = await chunkAsync(
      sourceFileContents,
      (fileItem) => translateStringsInContent(fileItem, modTranslationCache, sourceModName),
      10
    );
    writeToCNMod(contents);
  } catch (error) {
    logger.error(`translateOneMod failed for ${sourceModName} ${error.message} ${error.stack}`);
  }
  modTranslationCache?.writeTranslationCache();
}

async function main() {
  // loadSharedTranslationCache();
  for (const sourceModName of sourceModDirs) {
    logger.log(`\n${sourceModName} Translate start!\n`);
    await translateOneMod(sourceModName);
    logger.log(`\n${sourceModName} Translate done!\n`);
    logger.flush();
  }
  // storeSharedTranslationCache();
}
// 执行翻译脚本
main().catch((error) => {
  console.error(`Unexpectedly quit, error is ${error.message} ${error.stack}`);
  logger.error(error, `${error.message} ${error.stack}`);
  logger.flush();
  process.exit(1);
});
