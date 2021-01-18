import json

########################################
# This script copies dictionary that contains "sewing_kit" value in a nested list
# appends it to a new list of dictionaries, changes said value, its "time" value and adds "id_suffix" item.
# Made for extracting and editing armors to use the sewing_machine item
#######################################



# takes care of pening and closing the file, converting it to Python's data type and stores it in "data" opbject
with open("arms.json", "r") as recipejson:
    dataList = json.load(recipejson)


storageData = []


#moves the dicts that have SEW into a new list
def appender(lis):
    for dict in lis:
        for keyDict, valueList in dict.items():
            #checks if the value is iterable
            if hasattr(keyDict, '__iter__'):
                if keyDict == "qualities":
                    print("found qualities")
                    for subDict in valueList:
                        if hasattr(subDict, '__iter__'):
                            for key, value in subDict.items():
                                if value == "SEW":
                                    storageData.append(dict)
                                    print("dictionary moved")
                else:
                     print("key checked")

def increaseSEW(dataList):
    # increases the SEW value
    for dict in dataList:
        for keyDict, valueList in dict.items():
            # checks if the value is iterable
            if hasattr(keyDict, '__iter__'):
                if keyDict == "qualities":
                    print("found it!")
                    for subDict in valueList:
                        if hasattr(subDict, '__iter__'):
                            for key, value in enumerate(subDict):
                                if value == "level":
                                    print("increased SEW level")
                                    subDict[value] = 2
                else:
                    print("key checked")

def decreaseTime(dataList):
    # increases the SEW value
    for dict in dataList:
        for key, value in dict.items():
            # checks if the value is iterable
            if hasattr(key, '__iter__'):
                if key == "time":
                    print("found it!")
                    dict[key] -= int(value * 0.5)
                else:
                    print("key checked")
def changeSubcategory(dataList):
    # increases the SEW value
    for dict in dataList:
        for key, value in dict.items():
            # checks if the value is iterable
            if hasattr(key, '__iter__'):
                if key == "subcategory":
                    print("found it!")
                    dict[key] = "CSC_SEWING_MACHINE"
                else:
                    print("key checked")


def addSufix(dataList):
    for dict in dataList:
        # adds "sm" sufix
        dict["id_suffix"] = "sm"
        print("sufix key/value added")

appender(dataList)
increaseSEW(storageData)
decreaseTime(storageData)
changeSubcategory(storageData)
addSufix(storageData)


# converts the "data" object to JSON type and writes it on "newRecipe.json"
with open("sm_arms.json", "w") as newRecipe:
    json.dump(storageData, newRecipe, sort_keys=True)
