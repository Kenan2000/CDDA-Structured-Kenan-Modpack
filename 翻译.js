const BaiduTranslate = require('baidu-translate');
const promiseRetry = require('promise-retry');
const dotenv = require('dotenv');
const fs = require('fs-jetpack');
const path = require('path');
const _ = require('lodash');
const fetch = require('node-fetch');
const crypto = require('crypto');

const sourceDirName = 'Kenan-Modpack';
const translatedDirName = `Kenan-Modpack-汉化版`;
const translateCacheDirName = `中文翻译`;

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
// 首先读取 Kenan-Modpack 文件夹里的所有文件名
const sourceModDirs = fs.list(path.resolve(__dirname, 'Kenan-Modpack'));
// 别忘了把百度翻译 API 的 .env 文件黏贴到文件夹里！
// 搜狗的网上搜到了别人的 https://github.com/lunaragon/Translator/blob/b91481c4254ee01b3ce8eae1cea6586c33066e69/competitors/sougou.js#L6  	const PID = '059ad85853c5f20e54508cebf85287cd' const SECRET_KEY = 'c447fe597dc86f8c586cf7adef9dec21'
dotenv.config();
const sougouTranslate = async (value) => {
  const random = Math.floor(Math.random() * 10000);
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
  throw new Error(response.errorCode + response.message);
};
const baiduTranslateRaw = new BaiduTranslate(
  process.env.BAIDU_TRANSLATION_APP_ID,
  process.env.BAIDU_TRANSLATION_SECRET,
  'zh',
  'en'
);
const baiduTranslate = async (value) => {
  const { trans_result: result } = await baiduTranslateRaw(value);
  if (result && result.length > 0) {
    const [{ dst }] = result;
    return dst;
  }
  throw new Error(`百度翻译又跪了 ${value} ${JSON.stringify(result)}`);
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

function replaceNto1111(text) {
  // 防止 %2$s 影响了翻译，先替换成不会被翻译的占位符，然后之后再替换回来
  return text
    .replace('%1$s', ' 1111 ')
    .replace('%2$s', ' 2222 ')
    .replace('%3$s', ' 3333 ')
    .replace('%s', ' 4444 ')
    .replace('<good>', ' 5555 ')
    .replace('<npcname>', ' 6666 ')
    .replace('\n\n', ' 7777 ')
    .replace('\n', ' 8888 ');
}
function replace1111toN(text) {
  // 防止 %2$s 影响了翻译
  return text
    .replace('1111', '%1$s')
    .replace('2222', '%2$s')
    .replace('3333', '%3$s')
    .replace('4444', '%s')
    .replace('5555', '<good>')
    .replace('6666', '<npcname>')
    .replace('7777', '\n\n')
    .replace('8888', '\n');
}

/**
 * 使用百度翻译，带重试
 * @param {string} value 要翻译的字符串，可以为空，为空就返回空
 */
function tryTranslation(value) {
  if (typeof value !== 'string') return Promise.resolve(value);
  if (!value) return Promise.resolve('');
  let lastResult = 'null';
  let retryCount = 0;

  return promiseRetry(
    (retry, number) =>
      unionTranslate(replaceNto1111(value))
        .then((result) => {
          if (typeof result === 'string') {
            return replace1111toN(result);
          }
          lastResult = result;
          retryCount = number;
          retry();
        })
        .catch((error) => {
          logger.error('Translate failed', error.message, `Value: ${value}`);
          retryCount = number;
          retry();
        }),
    { retries: 10, maxTimeout: 10000, randomize: true }
  ).catch((error) => {
    const errorMessage = `Translation Error: ${error} result: ${lastResult}, From: ${value}, Count: ${retryCount}\nRetry Again\n--\n\n `;
    logger.error(errorMessage);
    return errorMessage;
  });
}

/**
 * 共享所有Mod翻译的成果，加速翻译，但之后每个mod自己还是存一份
 */
const sharedTranslationCache = {};
function loadSharedTranslationCache() {
  for (const sourceModName of sourceModDirs) {
    const translationCacheFilePath = path.join(__dirname, translateCacheDirName, `${sourceModName}.json`);
    try {
      sharedTranslationCache = { ...sharedTranslationCache, ...JSON.parse(fs.read(translationCacheFilePath, 'utf8')) };
    } catch {}
  }
}

/**
 * 初始化翻译缓存，没传第二个参数时，尝试从文件系统里加载有之前翻译和润色过的内容的翻译缓存，如果该翻译缓存文件不存在，就创建一个出来
 */
function initializeTranslationCache(translationCacheFilePath, translationCache = {}) {
  try {
    if (Object.keys(translationCache).length === 0) {
      translationCache = JSON.parse(fs.read(translationCacheFilePath, 'utf8'));
    }
  } catch (error) {
    logger.error(error);
    writeTranslationCache(translationCacheFilePath, translationCache);
  }
  return translationCache;
}
function writeTranslationCache(translationCacheFilePath, translationCache) {
  return fs.write(translationCacheFilePath, JSON.stringify(translationCache, undefined, '  '));
}

/**
 * 尝试使用缓存的内容，没有就实际翻译
 * @param {string} value 待翻译的字符串
 * @param {string} translationCacheFilePath 此mod的翻译缓存文件
 * @param {Record<string, string>} translationCache 内存里的翻译缓存，会被副作用更新
 */
async function translateWithCache(value, translationCacheFilePath, translationCache = {}) {
  if (value === undefined) return undefined;
  if (value === '') return '';
  logger.log(`\nTranslating ${value}\n`);
  if (translationCache[value] !== undefined || sharedTranslationCache[value] !== undefined) {
    logger.log(`Use Cached version ${translationCache[value]}\n--\n`);
    return translationCache[value] ?? sharedTranslationCache[value];
  }
  // 没有缓存，就更新缓存
  logger.log(`No Cached Translation for ${value}\n`);
  const translatedValue = await tryTranslation(value);
  logger.log(`New Translation ${value}\n -> ${translatedValue}\n`);
  translationCache[value] = translatedValue;
  await writeTranslationCache(translationCacheFilePath, translationCache);
  return translatedValue;
}

/**
 * 读取原始文件内容，打平成一维数组，并带上路径信息
 */
function readSourceFiles(sourceModDir) {
  const folders = fs.inspectTree(sourceModDir);
  const foldersWithContent = getFileJSON(folders);
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
  // DEBUG: console
  console.log(`writeToCNMod`, foldersWithContent);
  for (const inspectDataWithContent of foldersWithContent) {
    const newFilePath = inspectDataWithContent.filePath.replace(`${sourceDirName}/`, `${translatedDirName}/`);
    logger.log('newFilePath', newFilePath);
    if (inspectDataWithContent.content) {
      // JSON 文件
      fs.write(newFilePath, JSON.stringify(inspectDataWithContent.content, undefined, '  '));
    } else if (inspectDataWithContent.rawContent) {
      // png 贴图等
      fs.write(newFilePath, inspectDataWithContent.rawContent);
    }
  }
}

/**
 *
 * @param {Object} fileItem 基本类似于 inspectData https://www.npmjs.com/package/fs-jetpack#inspecttreepath-options ，但是多了 content 包含 JSON parse 过的文件内容
 */
async function translateStringsInContent(fileItem, translationCacheFilePath, translationCache) {
  const translators = getCDDATranslator(translationCacheFilePath, translationCache);
  if (Array.isArray(fileItem.content)) {
    // 文件的内容一般是一维数组
    for (const item of fileItem.content) {
      const translator = translators[item.type];
      if (!translator) {
        logger.error(`没有 ${item.type} 的翻译器`);
      } else {
        await translator(item);
      }
    }
    return fileItem;
  } else if (fileItem.rawContent) {
    return fileItem;
  } else {
    logger.error(
      `File content is not an array! ${fileItem.filePath} ,\n this means modder use an unexpected json schema, will resulted in "Cannot read property 'filePath' of undefined"`
    );
    const translator = translators[fileItem.type];
    if (!translator) {
      logger.error(`没有 ${fileItem.type} 的翻译器`);
    } else {
      await translator(fileItem);
    }
  }
}

function getCDDATranslator(translationCacheFilePath, translationCache = {}) {
  const translators = {};
  const translateFunction = (value) => translateWithCache(value, translationCacheFilePath, translationCache);
  const noop = () => {};

  // 常用的翻译器
  const nameDesc = async (item) => {
    if (typeof item?.name === 'string') {
      item.name = await translateFunction(item.name);
    } else if (typeof item?.name === 'object') {
      item.name = await maleFemaleItemDesc(item.name);
    }
    item.description = await translateFunction(item.description);
    item.detailed_definition = await translateFunction(item.detailed_definition);
  };
  const maleFemaleItemDesc = async (item) => {
    item.male = await translateFunction(item.male);
    item.female = await translateFunction(item.female);
  };

  const useActionMsg = async (useAction) => {
    if (useAction.activation_message) {
      useAction.activation_message = await translateFunction(useAction.activation_message);
    }
    if (useAction.message) {
      useAction.message = await translateFunction(useAction.message);
    }
    if (useAction.msg) {
      useAction.msg = await translateFunction(useAction.msg);
    }
    if (useAction.friendly_msg) {
      useAction.friendly_msg = await translateFunction(useAction.friendly_msg);
    }
    if (useAction.hostile_msg) {
      useAction.hostile_msg = await translateFunction(useAction.hostile_msg);
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
    if (item.message) {
      item.message = await translateFunction(item.message);
    }

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
    if (item.use_action?.message) {
      item.use_action.message = await translateFunction(item.use_action.message);
    }

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
            if (hitYouEffect.message) {
              hitYouEffect.message = await translateFunction(hitYouEffect.message);
            }
            if (hitYouEffect.npc_message) {
              hitYouEffect.npc_message = await translateFunction(hitYouEffect.npc_message);
            }
          }
        }
        if (passiveEffect.hit_me_effect) {
          for (const hitYouEffect of passiveEffect.hit_me_effect) {
            if (hitYouEffect.message) {
              hitYouEffect.message = await translateFunction(hitYouEffect.message);
            }
            if (hitYouEffect.npc_message) {
              hitYouEffect.npc_message = await translateFunction(hitYouEffect.npc_message);
            }
          }
        }
      }
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

  // 注册各种类型数据的翻译器
  translators.profession = nameDesc;
  translators.scenario = async (item) => {
    item.name = await translateFunction(item.name);
    item.description = await translateFunction(item.description);
    item.start_name = await translateFunction(item.start_name);
  };
  translators.start_location = noop;
  translators.furniture = nameDesc;
  translators.gate = async (item) => {
    for (const key in Object.keys(item.messages)) {
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
  translators.npc = noop;
  translators.trait_group = noop;
  translators.mapgen = noop;
  translators.ter_furn_transform = async (item) => {
    if (item.fail_message) {
      item.fail_message = await translateFunction(item.fail_message);
    }
    if (Array.isArray(item.terrain)) {
      for (const terrain of item.terrain) {
        if (terrain.message) {
          terrain.message = await translateFunction(terrain.message);
        }
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
  translators.clothing_mod = noop;
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
    if (Array.isArray(item.message)) {
      item.message = await Promise.all(item.message.map((msg) => translateFunction(msg)));
    }
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
  return work.finally(() => results);
};

/**
 * 开始翻译，一次翻译一个 Mod
 * @param {string} sourceModName 源文件夹里要翻译的 mod 的名字
 */
async function translateOneMod(sourceModName) {
  // TODO: 只传一个 cache class instance，让翻译侧不需要传这么多 cache 相关的参数
  const translationCacheFilePath = path.join(__dirname, translateCacheDirName, `${sourceModName}.json`);
  const translationCache = initializeTranslationCache(translationCacheFilePath);
  try {
    const contents = await chunkAsync(
      readSourceFiles(sourceDirName),
      (fileItem) => translateStringsInContent(fileItem, translationCacheFilePath, translationCache),
      10
    );
    writeToCNMod(contents);
  } catch (error) {
    logger.error(error);
  }
  writeTranslationCache(translationCacheFilePath, translationCache);
}

async function main() {
  logger.log('加载缓存的翻译');
  loadSharedTranslationCache();
  logger.log('sourceModDirs', JSON.stringify(sourceModDirs));
  for (const sourceModName of sourceModDirs) {
    logger.log(`\n${sourceModName} Translate start!\n`);
    await translateOneMod(sourceModName);
    logger.log(`\n${sourceModName} Translate done!\n`);
    logger.flush();
  }
}
// 执行翻译脚本
main().catch((error) => {
  logger.error(error, `${error.message} ${error.stack}`);
  logger.flush();
  console.error(`Unexpectedly quit, error is ${error.message} ${error.stack}`);
  process.exit(1);
});
