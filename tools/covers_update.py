#!/usr/bin/env python3

# Make sure you have python3 installed.
# Ensure that the json_formatter is kept in Tools with this script. They must be in the same folder!
# For Windows:
# Using command prompt type "python covers_update.py"
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
            # And only if they have coverage
            if not jo.get("covers"):
                continue
            joc = []
            for bodypart in jo["covers"]:
                if bodypart.endswith("_EITHER"):
                    bodypart = bodypart[:-7]
                    jo["sided"] = True
                    bodypart = bodypart + "s"
                if bodypart == "ARMS":
                    joc.append("arm_l")
                    joc.append("arm_r")
                elif bodypart == "EYES":
                    joc.append("eyes")
                elif bodypart in ["FEET", "FOOTS"]:
                    joc.append("foot_l")
                    joc.append("foot_r")
                elif bodypart == "HANDS":
                    joc.append("hand_l")
                    joc.append("hand_r")
                elif bodypart == "HEAD":
                    joc.append("head")
                elif bodypart == "LEGS":
                    joc.append("leg_l")
                    joc.append("leg_r")
                elif bodypart == "MOUTH":
                    joc.append("mouth")
                elif bodypart == "TORSO":
                    joc.append("torso")
                else:
                    joc.append(bodypart)
            if jo["covers"] == joc:
                continue
            jo["covers"] = joc
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
