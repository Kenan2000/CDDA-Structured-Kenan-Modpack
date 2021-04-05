const fs = require('fs-jetpack');
const path = require('path');

const buildInMods = [
  'Aftershock',
  'BlazeIndustries',
  'CRT_EXPANSION',
  'CrazyCataclysm',
  'DinoMod',
  'Generic_Guns',
  'MMA',
  'Magiclysm',
  'More_Locations',
  'Mutant_NPCs',
  'My_Sweet_Cataclysm',
  'package_bionic_professions',
];
buildInMods.forEach((name) => {
  fs.remove(path.join(__dirname, 'Kenan-Modpack-汉化版', name));
});
