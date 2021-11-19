Mod and Python script created by Saicchi (Now, note that Python installation is **MANDATORY** on your system as well)

- Usage Guide for Windows: 
	To use this mod's Python script you need to open Command Line on Windows then specify the path to game's or mod's arbitrary folder which contains JSON files with proficiencies in them, command that you specify in Command Line must adhere to format that is demonstrated now:
	
	1) Specify the path to script, I suggest you to put it in cdda folder to simplify further steps `"cd C:\Users\Name\Downloads\cdda`, now it should look like `C:\Users\Name\Downloads\cdda>` ;
	
	2) Now you need to write the name of this script and specify path to JSON files with proficiencies that you want to modify, whether in vanilla or mod's files as well, vanilla example `generate_proficiencies.py "data\json\proficiencies"`, mods example `generate_proficiencies.py "data\mods\Magiclysm"`
	
	3) Now you have a folder with modified values of these items, you can now overwrite initial values by copy pasting these files in vanilla or mods folders, though, there is another option via making a mod with these modified items, though, for this you'll have to make a `modinfo.json` file and if it's a particular mod, making your custom mod dependent on the original mod values of which you want to modify is important as well 
	