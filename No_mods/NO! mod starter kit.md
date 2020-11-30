# NO! Mod Starter Kit
Have something you want to remove from the game? Perhaps the katana feels particularly overpowered, or the acid zombies just don't sit right with you. And, of course, you can't just settle for one of the already created mods. They don't have the right combination of features, remove too much, remove too little, and just generally are a nuisance to maintain. So, you want to create your own. 

It is, in fact, very simple. First, create a folder with your mod name, perhaps 'NO_pesky_insects', or 'NO_irritating_animals'. Put this folder inside your "\CDDA\data\mods\" folder. Second, create a '.json' file inside of the new folder. Name this file 'modinfo', and open it. 

Inside the file, if you want to remove some combination of monsters and items, paste this code (without the triple backticks):
```JSON
[
  {
    "type": "MOD_INFO",
    "id": "no_personal_edition",
    "name": "Put the display name of your NO! mod here. Keep it short and sweet.",
    "description": "Write a short description of your NO! mod here.",
    "category": "monster_exclude",
    "dependencies": [ "dda" ],
  },
  {
    "type": "MONSTER_BLACKLIST",
    "monsters": [
        "pesky_insect"
    ]
  },
  {
    "type": "ITEM_BLACKLIST",
    "whitelist": false,
    "items": [
        "irritating_item"
    ]
  }
]
```
If you don't want to remove any monsters (this category includes animals), paste this code (again without the backticks):
```JSON
[
  {
    "type": "MOD_INFO",
    "id": "no_personal_edition",
    "name": "Put the display name of your NO! mod here. Keep it short and sweet.",
    "description": "Write a short description of your NO! mod here.",
    "category": "monster_exclude",
    "dependencies": [ "dda" ],
  },
  {
    "type": "ITEM_BLACKLIST",
    "whitelist": false,
    "items": [
        "irritating_item"
    ]
  }
]
``` 
And, if you don't want to remove any items paste this code (again without the backticks):
```JSON
[
  {
    "type": "MOD_INFO",
    "id": "no_personal_edition",
    "name": "Put the display name of your NO! mod here. Keep it short and sweet.",
    "description": "Write a short description of your NO! mod here.",
    "category": "monster_exclude",
    "dependencies": [ "dda" ],
  },
  {
    "type": "MONSTER_BLACKLIST",
    "monsters": [
        "pesky_insect"
    ]
  }
]
```

Now for the tricky part: filling out the blacklists. To do this, you will have to search the '.json' files for the specific id of the item/monster you want to remove. The '.json' files are stored in "CDDA\data\json". If you want to remove an item, look through "\data\json\items". If you want to remove a monster, look through "\data\json\monsters". An example is included below. 



Let's say we wanted to remove the aforementioned katana and acid zombies from the game. Since a katana is an item, we'll start by looking through "\data\json\items". A search for katana reveals it under 'swords_and_blades.json' with the id of katana, along with katana_fake and katana_inferior. Fortunately, NO Acid Zombies is a pre-existing mod in this modpack, so we just copy the list of blacklisted monsters from there. Our final code will end up looking like this: 
```JSON
[
  {
    "type": "MOD_INFO",
    "id": "no_personal_edition",
    "name": "Put the display name of your NO! mod here. Keep it short and sweet.",
    "description": "Write a short description of your NO! mod here.",
    "category": "monster_exclude",
    "dependencies": [ "dda" ],
  },
  {
    "type": "MONSTER_BLACKLIST",
    "monsters": [
      "mon_zombie_spitter",
      "mon_zombie_corrosive",
      "mon_zombie_acidic",
      "mon_zombie_soldier_acid_1",
      "mon_zombie_soldier_acid_2",
      "mon_zombie_wretched"
    ]
  },
  {
    "type": "ITEM_BLACKLIST",
    "whitelist": false,
    "items": [
        "katana",
        "katana_fake",
        "katana_inferior"
    ]
  }
]
```