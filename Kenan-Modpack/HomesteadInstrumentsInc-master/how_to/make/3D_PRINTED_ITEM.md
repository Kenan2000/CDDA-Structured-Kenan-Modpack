# Requirements

In order to create 3D-printed items using Homestead, you're going to need to also create a support network of intermediary items.

Each item you're going to create would require:

- one copy of the printer for the `IN_PROGRESS` state
- one copy of the printer for the `FINISHED` state
- one recipe for creating the `IN_PROGRESS` item
- one disassembly (`uncraft`) recipe for taking apart the `FINISHED` printer item

Creating a batch of these items will be required for every target printer. For example, if you're creating a plastic item, you're going to need to create two batches of these items: one for `3d_printer` and one for `3d_factory` – because both have the necessary tool quality `POLYMER_PRINTING`.

It may be wise, then, to suffix each copy of every item in the batch with the type of the printer it's used with. This is going to be illustrated as the process unfolds.

## A Note on IDs

As a rule of thumb, it may be wise to prefix each item in your mod with a unique tag, in order to differentiate it from the items from the base game or from other mods.

On top of that, given the somewhat-complex support network of items, it may also be wise to follow a name scheme for the items. [Private Defense](https://github.com/FirebrandCoding/PrivateDefense), the first mod to demostrate the idea, uses the following scheme:

* `<tag>_<id>` for the desired item
* `<tag>_<state>_<id>_<platform>`, where:
  * `<state>` is either `printing` or `finished`, depending on what state the printer is in
  * `<platform>` is either `printer` or `factory`, depending on which of the two available 3D printers is used

For example, the in-progress 3D factory printing Private 9 has the following `id`: `pd_printing_9mm_kit_factory`.

* `pd` is the `<tag>`
* `printing` is the `<state>`
* `9mm_kit` is the `<id>`
* `factory` is the `<platform>`

This is recommended for clarity. Feel free to use whatever scheme you find most easy-to-use.

# Creating the Item

## Item Itself

Create the desired item. Take note of its `id`. In this example, we're going to be creating a plastic knife.

```JSON
{
  "type": "TOOL",
  "category": "weapons",
  "id": "example_polyknife",
  "name": { "str": "polymer knife", "str_pl": "polymer knives" }
  ...and other properties
}
```

## `IN_PROGRESS` Printer

Create the `IN_PROGRESS` printer copy. To do that, create a `"type": "TOOL"` item that has `"copy-from"` with the value of the desired platform (e.g. `"copy-from": "3d_printer"`).

The important part of having an `IN_PROGRESS` 3D printer is being able to have it finish printing. To be able to do that, we're going to also add the `"use_action"` property to the `IN_PROGRESS` printer, which allows the player to interact with it and, once the printing process finishes, turn it into the `FINISHED` printer, which the player can disassemble into the printer and the printed item.

```JSON
{
  "type": "TOOL",
  "id": "example_printing_polyknife_printer",
  "copy-from": "3d_printer",
  "name": { "str": "3D printer producing polymer knife" },
  ...and other properties
  "use_action": {
    "type": "delayed_transform",
    "transform_age": 3600, 
    "target": "example_finished_polyknife_printer",
    "not_ready_msg": "The printer is working slowly to bring you the knife.",
    "msg": "You turn off the printer."
    }
}
```

To understand how to write your own `"use_action"`, refer to *Cataclysm*'s `/doc/JSON_INFO.md` file, found either in the GitHub repository or in the game folder. In short:

- `"transform_age"` is how much time the printing will take, in seconds (3600 seconds = 1 hour)
- `"target"` is the item the player will receive when they use the `IN_PROGRESS` printer after `"transform_age"` is up – in this case, our `FINISHED` printer
- `"not_ready_msg"` is what player sees if they interact with the `IN_PROGRESS` item before printing is finished
- `"msg"` is the message they see if they interact *after* printing is finished

## `FINISHED` Printer

Next, create the `FINISHED` printer. You can use the `IN_PROGRESS` item as a template: remove the `"use_action"` property, change the `"id"` to match the state (`"example_printing_polyknife_printer"` → `"example_finished_polyknife_printer"`), and you're good to go.

## Disassembly Recipe

The value of the `FINISHED` printer is in the fact that it can now be disassembled to return both the printer itself and the item it has been printing.

To use this to your advantage, create a `"type": "UNCRAFT"` recipe. The `"result"` property must have the value of the `FINISHED` printer's `"id"`, and `"components"` must be the printer itself and the target item.

```JSON
  {
    "type": "UNCRAFT",
    "result": "example_finished_polyknife_printer",
    "skill_used": "fabrication",
    "difficulty": 0,
    "time": "10 s",
    "components": [
      [ [ "3d_printer",        1 ] ],
      [ [ "example_polyknife", 1 ] ]
    ]
  }
```

Visual alignment is optional. It just looks nice.

If you were printing more than one item at a time, the number next to the ID of the desired item should reflect it: e.g. `[ [ "example_polyknife", 5 ] ]` for 5 plastic knives.

## Crafting Recipe

Finish with creating the recipe for the `IN_PROGRESS` item itself. There's a handful of parameters for this one, which can be intimidating if you're new to modding in *Cataclysm*. In reality, defining these is fairly-straightforward.

```JSON
  {
    "type": "RECIPE",
    "result": "example_printing_polyknife_printer",
    "category": "CC_WEAPON",
    "subcategory": "CSC_WEAPON_MELEE",
    "skill_used": "fabrication",
    "difficulty": 1,
    "time": "10 t",
    "reversible": false,
    "autolearn": true,
    "book_learn": [
      [ "example_source", 1, "plastic knife via 3D printer" ]
    ],
    "tools": [
      [
        [ "example_source", -1 ],
        [ "example_cad",    -1 ]
      ]
    ],
    "components": [
      [ [ "3d_printer",      1 ] ],
      [ [ "plastic_chunk",   1 ] ]
    ]
  }
```

Below are the properties worth noting. If they aren't noted, make sure to check with `/doc/JSON_INFO.md` for an explanation on each. If you're knew, it's recommeded to leave the other fields as is.

In order:

- `"result"` is the `IN_PROGRESS` printer: player's going to receive it after they start "crafting"
  - the name of the `IN_PROGRESS` printer will also be the name of the recipe: "3D printer producing plastic knife"
  - not pretty, but at least players can find the desired recipe by searching for the item's name
- `"category"` is where the recipe will be found in the crafting menu; `"subcategory"`, then, is self-explanatory
  - you can find the list of categories and subcategories in `data/json/recipes/recipes.json`
  - it's possible to create custom categories and reside your recipes there, but unless you're creating a big mod, it may be wiser to use base game's categories
- `"book_learn"` is a list of books where the recipe could be found in
  - these aren't necessarily books: they could be magazines, notes on paper etc.; "book" is used as a universal term defining such paper sources of information
  - if you want to have no such books, best omit the property entirely
  - for each book on the list, there is an optional third entry which defines how the recipe is seen when reading the book instead of its true name
- `"tools"` is usually a list of CAD files — a digital 3D model – which the printer uses to know what to print
  - realistically, player should have at least one such CAD file for each printed item: it's very difficult to program the printer to the same precision a pre-configured CAD file has
  - player may have multiple sources of CAD files for each recipe: in this example, they have a unique CAD file (`"example_cad"`) as well as a catalogue of all CAD files of the mod  (`"example_source"`)
- `"components"` are things that are going to be transformed into the target: the printer and a handful of plastic chunks
  - the amount of plastic chunks used for the recipe should be proportional to volume of the resulting item:
    - each chunk is 250 ml of raw plastic
    - use `item_volume / 250` chunks, rounded up

## Repeat for Every Platform

Remember to repeat the same steps for every printer type you use. In this case, there should be one more set of these items in use with 3D factory.

# Distributing the Item in the World

If you're planning on giving the player an opportunity to discover sources of recipes for your new items – be it books, magazines, or CAD files – you can create those and add them to the spawn lists.

## Creating Sources

The default *Cataclysm* way of handling crafting recipes is via books: schematics, instructions, gleaming details etc.

3D printing requires a different approach. 3D printers can't be told what to do without some form of guiding instructions. Homestead provides a basic way to do this: via CAD files.

### CAD file

[CAD files](https://en.wikipedia.org/wiki/Computer-aided_design) are real-life examples of digital instructions that could be given to various manufacturing machines to produce items. Homestead allows spawning CAD files inside SD memory cards.

Feel free to create a CAD file using this template:

```JSON
  {
    "type": "GENERIC",
    "id": "example_cad",
    "copy-from": "cad",
    "name": "plastic knife CAD file",
    "description": "CAD file for a plastic knife. You can use it to print it if you have a 3D printer.",
    "symbol": "#"
  }
```

`"id"` of the CAD file is what you're going to use as an entry for a recipe's `"tools"` property. Spawning inside an SD card is automatically handled by the parent item `"cad"`, so every item that copies from it will also spawn in an SD card.

### Books and Other Sources

It's still reasonable to use books and other printed media in order to spread recipes and printer instructions.

Private Defense uses a book called "Private Defense design binder": its description mentions that each page has an SD card with the related CAD file attached.

USB drives also make for reasonable sources of printer instructions.

## Adding Sources to Spawn Lists

Adding items to spawn lists is very easy in *Cataclysm*: simply "override" the target item group. The items you add to the lists will simply appear alongside the items that have been there previously.

Consult `/doc/ITEM_SPAWN.md` on how to create item groups.

If you have multiple sources, it may be reasonable to create an item group of their own. This would allow you to paste one ID – that of the group – instead of the IDs of all the items.

```JSON
  {
    "type": "item_group",
    "id": "example_cad_files",
    "items": [
      [ "example_cad",      60 ],
      [ "example_cad_new",  40 ],
      [ "example_cad_epic", 20 ]
    ]
  }
```

You can now add the group into existing spawn lists. For example, this would spawn example mod's CAD files in bedrooms of regular houses:

```JSON
  {
    "type": "item_group",
    "id": "bedroom",
    "groups": [ [ "example_cad_files", 5 ] ]
  }
```

Generally, items with a chance of less than 10 are uncommon, and less than 5 – spawn rarely.

Now the player can find the CAD files and use them to print the plastic knife we'd defined previous.