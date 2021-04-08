const fs = require('fs-jetpack');
const path = require('path');

const buildInMods = [
  'BlazeIndustries',
  'More_Locations',
  'package_bionic_professions',
  // 'Aftershock',
  // 'CRT_EXPANSION',
  // 'CrazyCataclysm',
  // 'DinoMod',
  // 'Generic_Guns',
  // 'MMA',
  // 'Magiclysm',
  // 'My_Sweet_Cataclysm',
];
buildInMods.forEach((name) => {
  fs.remove(path.join(__dirname, 'Kenan-Modpack-Chinese', name));
});
