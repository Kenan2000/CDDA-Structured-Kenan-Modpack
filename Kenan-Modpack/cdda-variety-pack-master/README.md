# CDDA Variety Pack

## Overview

Odds and ends to give Cataclysm: Dark Days Ahead some more depth without extraneous dependencies beyond the CDDA core.

## Requirements

- A copy of [Cataclysm: Dark Days Ahead](https://cataclysmdda.org/) (0.D Danny or a later, experimental, version)
- That's it!
 
## Installation

Download the archive, and extract its contents to the ```./data/mods/``` directory of your Cataclysm version.

You can also clone the repository:

```
cd <cataclysm-folder>/data/mods
git clone https://gitlab.com/KretschmarSchuldorff/cdda-variety-pack.git
```

N.b. that forward slashes work on both Windows, MacOS X, or Linux.

If you want a specific tag:

```
cd cdda-variety-pack
git checkout <release tag>`
```

You can see the tags with `git tag -l`.

### Example

List all tags beginning with `v`, and checkout the v.0.1.1 release:

```
PS C:\Users\***\cdda-variety-pack> git tag --list 'v*'
v0.1.0-Haymarket
v0.1.1-Haymarket
v0.2.0-17Juni
PS C:\Users\***\cdda-variety-pack> git checkout v0.1.1-Haymarket
Previous HEAD position was 5ed087e Fix: It's called knife_hunting, not hunting_knife.
HEAD is now at a2af938 Coordinate fix for upgraded pickup
PS C:\Users\***\cdda-variety-pack>
```


## Expanded Stuff

### Gender and Sexuality

Trying to reflect the multitudes of gender expressions that exist in a video game is sort of like squaring the circle or forcing a round peg into a square hole: you can do it, but it'll always be slightly awkward.

After much hemming and hawing, I've decided to go with a building block approach with the Trait system: you pick what fits (which can exclude some choices), in the most descriptive way possible for me with the tools and knowledge currently available.

The choice of `Gender: Cis` excludes any trans option possible, and all trans options exclude cis, which is the only restriction within the gender options provided.

Sexuality is straight forward: pick one and decide if `Sexuality: Questioning` applies or not. One limitation of the current implementation is that while sexuality can change over time as we realize our own preferences, it's not (yet?) possible to change it in-game.

### Vehicles

Four new pickup truck varieties: An extended cab and an extended bed, both featuring a powerful V8 engine, and all of the storage a farmer could ever need, and two electric pickup versions.

### Vehicle Parts

An insulated tank (10L), for potable water storage during winter. The Rural Examiner-Digest's RV Life column is supposed to contain a detailed description.

## FAQ

### Why are you using GitLab?

Personal preference based on features available, and I could self-host a GitLab server if I need to.

### How is this licensed?

It's the MIT License (See [LICENSE](https://gitlab.com/KretschmarSchuldorff/cdda-variety-pack/blob/master/LICENSE)).