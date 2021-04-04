const BaiduTranslate = require('baidu-translate');
const promiseRetry = require('promise-retry');
const dotenv = require('dotenv');
const fs = require('fs-jetpack');
const path = require('path');
const _ = require('lodash');

const sourceDirName = 'Kenan-Modpack';
const translatedDirName = `Kenan-Modpack-汉化版`;
const translateCacheDirName = `中文翻译`;
// 首先读取 Kenan-Modpack 文件夹里的所有文件名
const sourceModDirs = fs.list(path.resolve(__dirname, 'Kenan-Modpack'));
// 别忘了把百度翻译 API 的 .env 文件黏贴到文件夹里！
dotenv.config();
const translate = new BaiduTranslate(process.env.TRANSLATION_APP_ID, process.env.TRANSLATION_SECRET, 'zh', 'en');

/**
 * 开始翻译，一次翻译一个 Mod
 * @param {string} sourceModName 源文件夹里要翻译的 mod 的名字
 */
 async function translateOneMod(sourceModName) {
  const translationCache = initializeTranslationCache(path.join(translateCacheDirName, sourceModName));
  const contents = await Promise.all(readSourceFiles(sourceModDir).map(translateStringsInContent));
  writeToCNMod(contents);
  writeTranslationCache();
}

async function main() {
  for (const sourceModDir of sourceModDirs) {
    await translateOneMod(sourceModDir);
  }
}
// 执行翻译脚本
main().catch((error) => {
  console.error(error);
  writeTranslationCache();
  process.exit(1);
});

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
      translate(replaceNto1111(value))
        .then(({ trans_result: result }) => {
          if (result && result.length > 0) {
            const [{ dst }] = result;
            return replace1111toN(dst);
          }
          lastResult = result;
          retryCount = number;
          retry();
        })
        .catch(() => {
          retryCount = number;
          retry();
        }),
    { retries: 100, maxTimeout: 10000, randomize: true }
  ).catch((error) => {
    return `Translation Error: ${error} result: ${lastResult}, From: ${value}, Count: ${retryCount}\nRetry Again\n--\n\n `;
  });
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
    console.error(error);
    writeTranslationCache(translationCacheFilePath, translationCache);
  }
  return translationCache;
}
function writeTranslationCache(translationCacheFilePath, translationCache) {
  return fs.writeAsync(translationCacheFilePath, JSON.stringify(translationCache, undefined, '  '));
}

/**
 * 尝试使用缓存的内容，没有就实际翻译
 * @param {string} value 待翻译的字符串
 * @param {Record<string, string>} translationCache 内存里的翻译缓存，会被副作用更新
 */
async function translateWithCache(value, translationCache = {}) {
  console.log(`\nTranslating ${value}\n`);
  if (translationCache[value]) {
    console.log(`Use Cached version ${translationCache[value]}\n--\n`);
    return translationCache[value];
  }
  // 没有缓存，就更新缓存
  const translatedValue = await tryTranslation(value);
  console.log(`New Translation ${value}\n -> ${translatedValue}\n`);
  translationCache[value] = translatedValue;
  await writeTranslationCache();
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
  for (const inspectDataWithContent of foldersWithContent) {
    const newFilePath = inspectDataWithContent.filePath.replace(`${sourceDirName}/`, `${translatedDirName}/`);
    if (inspectDataWithContent.content) {
      // JSON 文件
      fs.write(newFilePath, JSON.stringify(inspectDataWithContent.content, undefined, '  '));
    } else if (inspectDataWithContent.rawContent) {
      // png 贴图等
      fs.write(newFilePath, inspectDataWithContent.rawContent);
    }
  }
}

const translators = {};
/**
 *
 * @param {Object} fileItem 基本类似于 inspectData https://www.npmjs.com/package/fs-jetpack#inspecttreepath-options ，但是多了 content 包含 JSON parse 过的文件内容
 */
async function translateStringsInContent(fileItem) {
  if (Array.isArray(fileItem.content)) {
    // 文件的内容一般是一维数组
    for (const item of fileItem.content) {
      const translator = translators[item.type];
      if (!translator) {
        console.warn(`没有 ${item.type} 的翻译器`);
      } else {
        await translator(item);
      }
    }
    return fileItem;
  } else if (fileItem.rawContent) {
    return fileItem;
  } else {
    console.warn(
      `File content is not an array! ${fileItem.filePath} ,\n this will resulted in "Cannot read property 'filePath' of undefined"`
    );
  }
}

const translateFunction = translateWithCache;
const noop = () => {};

// 常用的翻译器
const nameDesc = async (item) => {
  item.name = await translateFunction(item.name);
  item.description = await translateFunction(item.description);
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
translators.json_flag = async (item) => {
  // 注意有 <good>protection</good> 这样的标记
  item.info = await translateFunction(item.info);
};
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

