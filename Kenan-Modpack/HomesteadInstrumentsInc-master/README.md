# What

Homestead Instruments Inc. (`homestead`) is a [*Cataclysm: Dark Days Ahead*](http://github.com/cleverRaven/Cataclysm-DDA) mod that adds several buildable tools for use in other mods. It has no use on its own: its goal is to serve as a shared platform for other mods that add recipes but don't have the required tools to accomplish those.

Homestead Instruments Inc. is used by the following mods:

- [Project APEX](https://github.com/FirebrandCoding/ProjectAPEX)
- [Private Defense](https://github.com/FirebrandCoding/PrivateDefense)

# Why

Multiple mods add their own sets of production equipment with no overlap between, effectively polluting the game with what amounts to duplicate items that can't be merged. Setting a commong ground for such mods, current and future, would reduce load times and save sizes by reducing the amount of data necessary to store and process multiple sets of effective duplicates.

*Cataclysm* at its baseline only offers a selection of portable tools to be used in crafting and construction, effectively reducing the player's capacity for survivorship and thriving. This may be a deliberate decision – for a game that actively presents a filthy, broken-down world where many of the cutting-edge advances of technology are as good as lost, that wouldn't be a far fetch – but for a player such as myself, this appears an oversight.

At a high-enough skill level, the character is able to build their own house out of a variety of materials as well as build complex electronic devices. One can even build their own small community of survivors, equip it with enough self-sustainable parts to never have to worry about food, water, and electricity. Yet, building a slightly more sophisticated stationary tool – such as an Autodoc, vital for installing bionics and and useful for other medical purposes – is beyond the character who can build their own CBMs and even top some of the military gear with their jury-rigged creations.

Homestead seeks to provide support for the former and ameliorate the latter.

# Tools

## Production & Manufacture

- [x] **3D printer**: basic 3D-printing device
- [x] **3D factory**: a sophisticated, advanced 3D printer for use in polymer and medical printing
- [ ] **molecular forge**: highly-advanced station capable of manipulating any sort of raw material to create the desired item
- [x] **CNC firearm workstation**: a compact, portable station allowing for manufacture of firearm parts

## Medical

- [ ] **surgical suite**: sophisticated set of surgical instruments guided by an advanced AI to accomplish even the most advanced of operations

## Computers & Network

- [ ] **usable computers**: stationary and portable devices providing computational power for various projects
  - [x] laptops
  - [ ] desktops
- [x] **servers**: stations usable as additional computational units or members of a network

## Tools Requiring Research

Rather than rush in and create narrow-result tools, Homestead aims at providing a more generic, wide-application sets of tools that could be used in a multitude of different projects. This includes both advanced and common instruments and working stations, while remaining grounded in order to maintain lore coherence with the main game.

As such, the following types of tools require research in order to be properly introduced into the game:

- machining tools
  - wood, plastic, and metal projects, such as:
    - crafting firearms, custom magazines, blades, and other such combat equipment
    - creating items of beauty: sculptures, jewelry, and internal decorations
- chemical tools
  - dyeing suite
    - applying color to items
    - bleaching items
  - medium- and large-scale, laboratory-quality, chemical-production stations
    - synthetic food production
    - drugs production, including narcotics
- business-scale painting tools
  - usable for decoration at a speed higher than manual labor with a can of paint
  - may also be used to designate one's territory to NPCs and (in multiplayer iterations) other players
- electricity storage options
  - for running local electrical applications
    - servers and computers
    - refridgerators
    - electric fencing or powered traps
    - automated production tools
- electronics mentioned above

Feel free to suggest tools that you think would fit within Homestead by opening an issue.

# Issues

- Homestead recipes – 3D printing, software installation etc. – currently have to exist within predefined crafting subcategories.
  - Adding your own subcategories to the existing categories is currently buggy.
  - Creating a unique Homestead category of recipes, while convenient, goes against the goal of meaningfully integrating the mod into the base game.
  - Ideally, software installation would exist within `ELECTRONIC` → `INSTALL` category, 3D printing — within the `PRINTING` subcategory of the respective category: `WEAPON` for firearms, `AMMO` for ammunition, `CHEM` for pharmaceutical applications etc.

# Lore

Homestead Instruments Inc. was registered eleven years ago in Dallas, TX, under the name of Homestead Workshop Inc.. While their initial portfolio consisted of affordable, quality ready-to-build sets of wood- and metalworking stations, the company eventually grew to produce a wide variety of consumer- and business-oriented tools.

After landing a couple of government contracts four years ago, Homestead rose to prominence and invested the influx of revenue into a higher tier of tools, which included medical applications. Even after the Cataclysm, Homestead production remains known as high-quality, especially when the price tag no longer matters. The fate of the company is currently unknown.

# License

MIT
