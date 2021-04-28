# CDDA-Kenan-Modpack CDDA Kenan Mod 合集的汉化

[打开下载页](https://github.com/linonetwo/CDDA-Kenan-Modpack-Chinese/releases/tag/latest)

## Mod文件放置位置

### 桌面版

#### MacOS

如果你不希望覆盖内置 mod，下载解压后，打开 CDDA 存档所在文件夹，Mac版如下放置即可：

`/Users/linonetwo/Library/Application Support/Cataclysm/mods`

![docs/images/mod-folder.png](https://raw.githubusercontent.com/linonetwo/CDDA-Kenan-Modpack-Chinese/master/docs/images/mod-folder.png)

文件夹位置在 `config` 和 `save` 文件夹同级的那个 `mods` 文件夹里。如果你没有这个 `mods` 文件夹，可以手动新建一个。

注意切勿和原版的 mod 文件放到一起，如果你看到提示问你是替换原版文件夹还是覆盖文件夹，那你肯定放错位置了。不然下次更新 Cataclysm.app 的时候会覆盖掉 mods，需要重新做一遍覆盖流程。

##### 如果你不介意覆盖内置 mod，也不介意安装新版游戏时重新操作一遍覆盖流程

是有部分 Mod 是改游戏内置 Mod 的，这些 Mod 得手动拖到 Cataclysm.app 里覆盖其他内容，不拖话他们有可能不会生效。详见 https://github.com/linonetwo/CDDA-Kenan-Modpack-Chinese#installation-guide-must-read

#### Windows

我个人不用 Windows，如果你有好的办法可以来 PR 修复此部分。

### Android手机版

安装好实验版后（实验版下载地址 http://dev.narc.ro/cataclysm/jenkins-latest/Android/Tiles/ ），打开游戏，然后用文件管理新建这个文件夹：

`/storage/emulated/0/Android/data/com.cleverraven.cataclysmdda.experimental/files/mods`

文件夹位置在 `config` 和 `save` 文件夹同级的那个 `mods` 文件夹里。如果你没有这个 `mods` 文件夹，可以手动新建一个。如下图：

![docs/images/mod-folder-mobile.png](https://raw.githubusercontent.com/linonetwo/CDDA-Kenan-Modpack-Chinese/master/docs/images/mod-folder-mobile.png)

手机电脑同步可参考[多端同步：白天在手机上玩，晚上回家用大屏电脑玩](https://tieba.baidu.com/p/6966289045)

## Development 开发

如果你想贡献翻译请看下面的汉化说明。如果内容与 Kenan Mod Pack 最新版有差别，我会重新运行翻译脚本生成润色好的最新内容。如果内容过期也请提 issue 通知我。

### 汉化说明

由俄国大佬 Kenan 整理的一百多个英文mod

我们通过paratranz平台进行了汉化
https://paratranz.cn/projects/2240

有想帮助汉化的大佬或想反馈汉化相关问题
可以加入QQ群1130299939

如果是mod本身的bug，可以去kenan的github项目反馈
https://github.com/Kenan2000/CDDA-Kenan-Modpack

### 机翻说明

自己运行脚本：

1. 到 https://fanyi-api.baidu.com/ 搞到百度翻译 API key，类似

```env
BAIDU_TRANSLATION_APP_ID=2019...
BAIDU_TRANSLATION_SECRET=zEah...
```

2. 装好 nodejs 然后命令行运行

```
npm i
npm start
```

## What 这是什么

Kenan's **personal** modpack for Cataclysm - Dark Days Ahead for **LATEST** experimental versions

**1)** **IF YOU ARE EXPERIENCING ANY BUGS OR ERRORS - EITHER THE FIXES WILL BE RELEASED SOON-ISH OR THE MOD IS WIP** ;

**2)** **IF YOU USE CDDA LAUNCHER BY REMYROY - UPDATE THE GAME FIRST VIA LAUNCHER and ONLY AFTER that put the mods IN**

# Installation Guide (MUST-READ)

**1) Download the modpack by clicking Code - Download ZIP, or clicking** [**here**](https://github.com/Kenan2000/CDDA-Kenan-Modpack/archive/master.zip) ;

**2) Copy all of the mods from the modpack folder (`CDDA-Kenan-Modpack/Kenan-Modpack`) as shown in the** [**picture**](https://imgur.com/a/cpok2UT) ;

**3) Paste them all into the `cdda/data/mods` directory as shown in the** [**picture**](https://imgur.com/a/mK1cEER) ;

**4) Overwrite and replace all the files if you get a prompt** ;

**5) Enjoy the mods**

**NEXT STEPS IF YOU USE THE LAUNCHER** 

**6) Update the game via the launcher** ;

**7) Repeat 2) , 3) , 4) and 5)** ;

**8) Enjoy the mods**

# FAQ:

* Q: Why should I remove manually some specific non-mainlined mods when updating?
  * A: Because sometimes some mod files become obsolete and no longer used, so you won't need them inside your mods folder anymore, so for dealing with these problems you need to delete the mod and fully reinstall it.

* Q: After updating my save file no longer loading!
  * A: It is rare, but will happen when some mod that've been used in your save has new ID and/or name, or you're trying to load the mod that is no longer used/merged with other one. You can fix it by reading `debug.log` to view what's mod should be changed, then go to `cdda\save\world_name\mods.json` and replace target mod ID with the new one, or delete it's entry from this file if there is no replacement. Also, you can read latest commits to see what is happening, if you want

* Q: I have some other issues to report!
  * A: Feel free to submit your issue into the [**issues tab**](https://github.com/Kenan2000/CDDA-Kenan-Modpack/issues).

# Link to Supporters' and Contributors ASTOUNDINGLY NOICE WORKS

**1) https://discourse.cataclysmdda.org/t/secronom-zombies-mod-thread/16211**

**2) Legendary UDP tileset by SDG - https://github.com/SomeDeadGuy/UndeadPeopleTileset**

**3) https://github.com/chaosvolt/cdda-arcana-mod**

**4) https://github.com/TheGoatGod/Goats-Mod-Compilation**

**5) https://github.com/captainsawbones/Sly_Mutation_Mod_Medley**

**6) https://github.com/foulman/Fantasy**

**7) https://github.com/El-Jekozo/More_NPC**

**8) https://github.com/Noctifer-de-Mortem/nocts_cata_mod**

**9) https://github.com/foulman/Psioniclysm**

**10 )https://github.com/Maleclypse**

**11) https://discourse.cataclysmdda.org/t/fallout-new-england/17509**

**12) https://github.com/dissociativity/PKs_Rebalancing**

# Links to my other works

My HUGE and AWESOME **BL9** mod

**1) https://github.com/Kenan2000/BL9**

Separate Secronom fork - fork of Axema's GREAT and AMAZING and AWESOME huge Secronom mod

**2) https://github.com/Kenan2000/Secronom-Zombies**

Updated and even more awesome Otopack soundpack maintained by me 

**3) https://github.com/Kenan2000/Otopack-Mods-Updates**

Bright Nights modpack

**4) https://github.com/Kenan2000/Bright-Nights-Kenan-Mod-Pack - Bright Nights Modpack**

**5) https://github.com/Kenan2000/CDDA-NoMods-Anthology - monster and rebalancing exclusions/inclusions Modpack**

## Link to my CDDA modding server 

**https://discord.com/invite/xj9E3Sp**
