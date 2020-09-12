# DG_Mods
Collection of Mods for Cataclysm: Dark Days Ahead

To install, place DracoDogMods folder in your /data/mods/ folder.

### Armoring:
* Basic system implemented in core DDA by mlangsdorf.
* Only protective values are altered, so there are no changes to dodge/health/speed at this time.

* OLD: You can add or remove armor through crafting menu with Kevlar vest (transform into dog harness) or Kevlar dog harness and one crated dog. You will have to activate dog after crafting completed. Essentially improves health (significantly), adds armor to bash/cut, lowers dodge (by 1) and speed (mainly by weight, heavier dogs aren't as affected whereas smaller dogs are affected more heavily).

### Training:
* Basic system (will eventually be expanded: either specific training that leads to "certified" attack dog [train dodge, train special attacks, train melee, etc that requires sufficient player skill and survival] or incremental stages [partially trained dog -> semi-trained dog -> nearly-trained dog -> attack dog]).
* You need suitable skill (attempting under skill requirements will result in constant failures and wasted time), dog whistle, dog food and crated dog.
* Training will take significant time (4 hours, subject to change).
* Essentially improves aggression, damage, dodge (by 1), health (slightly), morale, speed. May add "LUNGE" attack and/or remove "HIT_AND_RUN" depending on breed.

### Morale:
* Added playing with pets in core DDA. May update to increase bonus if playing with "GUILT" flags or preferences (when implemented).
* Additionally seek to add "fetch" or other type of activities with pets.

Changelog:

#### 0.6

- Remove harvest.json (pet armor drops when pet is killed).

- Remove all references to armoring dogs and associated items/monsters/recipes/files.

- Add missing limb target from minordogbite.

- Remove monstergroups as it doesn't change core DDA values.

- Updated professions to new starting pet feature and adjusted scores.

- Remove vehicle_groups as it doesn't change core DDA values.

#### 0.5

- Update harvest options to new DDA harvest system.

- Add Australian Cattle Dog to spawn groups.

- Increased time before "DOG" spawn group is replaced by "DOG_MID".

- Removed duplicate spawn groups compared to DDA master.

- Fixed mon_smokey_bear (#2) issue.

- Updated dog entries to more closely mirror DDA master and cleaned up with proportion/relative flags.

- Added Australian Cattle Dog, Great Pyrenees (debug spawn only for now) and Rottweiler (debug spawn only for now) entries and associated armored/attack/armoredattack.

- Removed duplicate biosig compared to DDA master.

- Added chance for crated Australian Cattle Dogs to spawn.

- Removed references to breeding in descriptions (leftover from 0.4).

- Updated weights for crated dogs to match with dog weight plus crate weight (plus kevlar vest if applicable).

- Removed duplicate maps compared to DDA master.

- Changed crafting system to no longer consume items if armor attaching or training failed.

- Experience is no longer granted when training dogs or attaching armor.

#### 0.4c

- Removed obsolete files (some parts are now in vanilla gameplay). May cause issues on first load; should be able to save and reload with no more errors.

- Updated harvest for proper values with recent vanilla changes.

#### 0.4b

- Fix CLIMB flag issue

- Corrected Bulldog to have lunge and attack training description

- Added harvest option to armored dogs for chance to retrieve Kevlar dog harness

#### 0.4a

- Added CLIMB to qualified dogs that have LEAP.

- Removed breeding explanation from README.

#### 0.4

- Added new animal control vehicle - contains useful items for pets and rarely may contain a crated dog.

- Corrected a lot of descriptions to better detail what you can do with item as well as fixed the nouns.

- Added new animal shelter location - somewhat frequent as veterinarian clinics with items more geared towards pets. Good location to find rare pets.

- Added new animal pound location - somewhat frequent as veterinarian clinics with items more geared towards pets. Good location to find pets.

- Altered armoring dogs to use tailoring 1 if using Kevlar dog harness, otherwise you can now craft Kevlar dog harnesses by repurposing Kevlar vests.

- Adjusted dog stats.

- Removed breeding due to vanilla breeding ability [no longer manual, but automatic. May want to kennel dogs to replenish supply].

#### 0.3

- Added new category 'Animals' with subcategories 'Canine Armor/Breeding/Training'
to control some of the bloat and clogging up normal categories.

- Changed "sleep" to "crated" syntax to improve vocabulary and not be creepy.

- You can now breed attack dogs with untrained dogs or each other and not lose an attack dog.

- You can now attach and remove armor for all dog breeds.

- You can now train all breeds as attack dogs.

- You can now breed all breeds.

- Boxers gain "GROUP_MORALE" and "SWARMS" from new stat calculation.

- All dog breeds have altered "aggression" from new stat calculation.

#### 0.2

- You can now tame and "sleep" all breeds.

- Dog whistle now affects all tamed dogs.

- You can now breed labradors (only normal, not trained attack ones yet).

- You can add or remove armor from tamed labradors or attack labradors.

- You can now train labradors as attack dogs.

#### 0.1

- Initial release - can tame and "sleep" labradors.