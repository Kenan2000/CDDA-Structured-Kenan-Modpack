#!/usr/bin/env python3

# Make sure you have python3 installed.
# Ensure that the json_formatter is kept in Tools with this script. They must be in the same folder!
# For Windows:
# Using command prompt type "python barrellength_volume.py"
# For Max OS X or Linux:
# Swap any "\\" with "/", then run the script as in windows.

import json
import os


def gen_new(path):
    change = False
    with open(path, "r") as json_file:
        try:
            json_data = json.load(json_file)
        except UnicodeDecodeError:
            print("UnicodeDecodeError in {0}".format(path))
            return None
        except json.decoder.JSONDecodeError:
            print("JSONDecodeError in {0}".format(path))
            return None
        for jo in json_data:
            # We only want JsonObjects
            if type(jo) is str:
                continue
            if type(jo.get("volume")) != str and jo.get("volume") \
                    and jo.get("type") not in ["sound_effect", "speech"]:
                volume = jo["volume"]
                volume *= 250
                if volume > 10000 and volume % 1000 == 0:
                    jo["volume"] = str(int(volume/1000)) + " L"
                else:
                    jo["volume"] = str(volume) + " ml"
                change = True
            if jo.get("barrel_length"):
                if type(jo["barrel_length"]) == int:
                    barrel_length = jo["barrel_length"]
                    barrel_length *= 250
                    jo["barrel_volume"] = str(barrel_length) + " ml"
                elif type(jo["barrel_length"]) == str:
                    jo["barrel_volume"] = jo["barrel_length"]
                del jo["barrel_length"]
                change = True

    return json_data if change else None


def change_file(json_dir):
    for root, directories, filenames in os.walk("..\\{0}".format(json_dir)):
        for filename in filenames:
            path = os.path.join(root, filename)
            if path.endswith(".json"):
                new = gen_new(path)
                if new is not None:
                    with open(path, "w") as jf:
                        json.dump(new, jf, ensure_ascii=False)
                    os.system(".\\json_formatter.exe {0}".format(path))


if __name__ == "__main__":
    json_dir = input("What directory are the json files in? ")
    change_file(json_dir)
