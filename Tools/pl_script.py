#!/usr/bin/env python3

# Make sure you have python3 installed.
# Ensure that the json_formatter is kept in Tools with this script. They must be in the same folder!
# For Windows:
# Using command prompt type 'python vehicle_code.py' and then the dir.
# For Max OS X or Linux:
# Swap any '\\' with '/', then run the script as in windows.

import argparse
import json
import os

args = argparse.ArgumentParser()
args.add_argument("dir", action="store", help="specify json directory")
args_dict = vars(args.parse_args())


def gen_new(path):
    change = False
    with open(path, "r") as json_file:
        json_data = json.load(json_file)
        for jo in json_data:
            # We only want JsonObjects
            if type(jo) is str:
                return None

            if "str_pl" in jo and "name" in jo and not type(jo["name"]) is str:
                if jo["name"]["str"] == jo["str_pl"]:
                    jo["name"]["str_sp"] = jo["name"]["str"]
                    del jo["name"]["str"]
                    del jo["str_pl"]
                else:
                    name_obj = {}
                    name_obj["str"] = jo["name"]["str"]
                    name_obj["str_pl"] = jo["str_pl"]
                    del jo["str_pl"]
                    jo["name"] = name_obj
                change = True

    return json_data if change else None


for root, directories, filenames in os.walk(args_dict["dir"]):
    for filename in filenames:
        path = os.path.join(root, filename)
        if path.endswith(".json"):
            new = gen_new(path)
            if new is not None:
                with open(path, "w") as jf:
                    json.dump(new, jf, ensure_ascii=False)
                os.system(f".\\json_formatter.exe {path}")
