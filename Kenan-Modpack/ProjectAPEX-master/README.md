# What

Project APEX (`apex`) is a [*Cataclysm: Dark Days Ahead*](http://github.com/cleverRaven/Cataclysm-DDA) mod that adds high-end, advanced suits of armor and military equipment. It also expands on the lore of the game in an unofficial manner. All parts of the mod seek to be lore-friendly, at least within the confines of the official sci-fi mod, Aftershock.

It's inspired by the *Crysis* game series. Project APEX's development was prompted by lack of development in [Advanced Gear](https://github.com/Lorith/AdvancedGear-CDDA-Mod), which revolves around a similar idea.

It depends on the base game (`dda`), Aftershock (`aftershock`), and [Homestead Instruments Inc.](https://github.com/FirebrandCoding/HomesteadInstrumentsInc) (`homestead`).

# Why

Aside from the fact that modding and game design is fun...

*Cataclysm* is one of those games that, under the right circumstances, allows the player to feel like a goddamn superhero. It provides excellent challenge which, when overcome, pays off by making the player feel competent and capable.

Project APEX, much like Advanced Gear, takes this a step further by providing a dedicated, high-end, powerful set of armor, weapons, and equipment that one has to work hard to acquire.

Problem is, Advanced Gear doesn't seem to see a lot of development. It remains unfinished and unpolished. Meanwhile, I still want an advanced experience. Making a mod for myself sounded like a fun challenge with a positive outcome either way.

# Design Considerations

Rather than rely on grind as a difficulty measure – which is a synthetic approach which doesn't align with how humans play games – Project APEX uses stages of technological advancement. Each stage is gatekept via sets of tools necessary to develop the technology, as well as the rarity of the blueprints.

Getting to each stage is meant to be a satisfying experience which provides a good set of benefits. Rather than feel like you have to work for ages to get the victory point, this mod offer a progressive rewards ladder, which is meant to keep the player engaged even after they reach the latest stage.

The latter is done by offering the player a selection of specialist modules that enhance the main character's performance in a small number of intense ways. The player can only use a handful of modules at a time, due to the suit systems being limited in how much hardware they can operate simultaneously.

All of this is supplemented with a healthy dose of lore derived from [the latest official lore](https://cataclysmdda.org/design-doc/) at the time of the writing. This was a conscious choice in the beginning of the development, in an effort to integrate the mod into the natural gameplay deeper. The fewer mental bumps there are along the way, the better the overall feel.

# Roadmap

It's important to note that many of the later-stage features are currently impossible to implement without running a separate codebase – something that's *way* beyond this mod's scope and far too labor-intensive to even attempt. Such features are preceded with ▙.

I think many of these features could be a good addition to the base game, so I'm going to advocate for their inclusion until I can mark off all of the proposed features on this roadmap as complete.

## Stage 0

proof-of-concept stage

- [x] prototype Mk 0 APEX suit
  - capable suit of full-body armor made of advanced nanofiber
  - produced using laboratory-based nanofabricator, using the associated template
  - somewhat bulky to wear

## Stage I

early implementation of the mod's concepts

- [x] APEX suit Mk I
  - AI-driven suit of armor
  - protects its wearer from glare, gas, rain, and loud noises
  - easier to wear than the prototype
  - can take modules
- [x] `APEX` crafting category and recipes
  - [x] EULER, the design assistance AI system
  - [x] Mk I suit and its acquisition
  - [ ] modules
- [x] suit module prototypes as wearable items
  - additions to the suit designed to improve one narrow area of ability

## Stage II

- [x] APEX suit Mk II
  - made of a denser, stronger metamaterial
  - protects its wearer from radiation
  - ▙ renders the wearer impervious to disease and infection
  - ▙ no longer requires an external power source, self-sustaining
  - ▙ eliminates the need to sleep
- [ ] ▙ integrated suit modules
  - ▙ expanded for more features
- [ ] modular APEX ballistic weapons
  - provide a firearm platform that can be adjusted to fit most real-world situations

## Stage III

- [x] APEX suit Mk III
  - permanently attaches to skin for health system integrations
    - requires specialized surgical suite to upgrade to
  - made of hyper-advanced, cutting-edge material that exists not entirely within this world
  - ▙ increases stamina maximum and regeneration rate to inhuman levels
  - ▙ renders wearer further immune to parasitic intrustion and addiction
  - provides optimal climate control
  - ▙ disables intoxication from substances
    - ▙ ...while still providing all the positive effects
  - ▙ regenerates itself slowly over time
  - ▙ quadruples wearer's regeneration speed
- [ ] APEX energy weapons
  - laser, EMP, heat, and electrical weaponry from the same copyright-unconcerned group of engineers
  - ▙ maser
  - ▙ advanced hard-light bow with a variety of arrowheads

# Installation

Download the archive attached to the [latest stable release](https://github.com/FirebrandCoding/ProjectAPEX/releases/latest) or download the archive of the repository to get the latest, unstable version.

Extract the contents of the archive to a separate folder in the `<cataclysm_folder>/<graphics_version>/data/mods/` directory.

# License

MIT
