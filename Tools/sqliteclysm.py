#!/usr/bin/env python
# coding=utf-8
import json
import sqlite3
import sys, getopt, os
import re
import collections

def chelp(e=''):
    usage = """usage: create_tables.py [OPTIONS]
OPTIONS:
    [-f path/to/file] default: data/raw/recipes.json
    [-u "unique1, unique2, ..."] sql table uniques, default: result,
    id_suffix, name
    [-s] sort columns with uniques first
    [-p "colname1, colname2, ..."] additional clarity columns
    [-t table_name] override table name, default: filename without extension
    [-C] request table creation, default: recursive, included
    [-I] request data insertion, default: recursive, included
    [-v] verbose: [ver-bohs]
         adjective
         characterized by the use of many or too many words; wordy: a verbose
         report.
DATABASE SEARCHES:
    [-R recipe_result] show recipe with result like 'recipe_result'
    [-m mutation] show mutation data
    [-M mutcat] show mutations from category mutcat
    [-T tool_or_component] show recipe with tool or component
    [-S skill] show recipe(s) by skill_used
    [-D] dump json (from recipes)
    [-d what,column,table] dump json with 'column' like '%search%' from 'table'
        defaults '*','result','recipes'
"""
    if e:
        print e
    else:
        print usage

items = {}
acol = []
unique = []
sort_prefs = []
savs = []
dry = False
tname = ""
furl = ""
db = ''
VERBOSE = False
done_tables = []
done_rows = 0

reserved = [ 'default' ]
class ccolors:
    BOLD = '\033[1m'
    BLINK = '\033[5m'
    RBLINK = '\033[6m'
    END = '\033[0m'

def main(argv):
    global furl, tname, dry, unique, sort_prefs, VERBOSE
    action = 'help'
    a_args = {}
    LOADDEF = True
    SHOWUPDATES = True

    try:
        sopts = "hf:o:u:sp:t:CIvR:P:S:T:m:M:Dd:"
        lopts = "--dry"
        opts, args = getopt.getopt(argv, sopts, lopts)
    except getopt.GetoptError as e:
        help(e)
        SHOWUPDATES = False
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            chelp()
            SHOWUPDATES = False
            sys.exit(2)
        if opt == '-f':
            furl = arg
            if os.path.isdir(furl):
                print "Using files from " + furl
                action = 'recursive_run'
            else:
                print "Using file " + furl
        if opt == '-o':
            a_args['dumpfile'] = arg
        if opt == '--dry':
            print "Dry run, no executions"
            chelp()
            dry = True
        if opt == '-u':
            for args in arg.split(','):
                unique.append(args.strip())
            if VERBOSE:
                print "Using uniques " + ", ".join(unique)
        if opt == '-s':
            if VERBOSE:
                print "Sorting preferences from uniques"
            sort_prefs.extend(unique)
            if VERBOSE:
                print "Sorting preferences: " + ", ".join(sort_prefs)
        if opt == '-p':
            for sid in arg.split(','):
                sort_prefs.append(sid.strip())
            if VERBOSE:
                print "Sorting preferences: " + ", ".join(sort_prefs)
        if opt == '-t':
            tname = arg
        if opt == '-C':
            action = 'create_table'
        if opt == '-I':
            action = 'insert_into'
        if opt == '-v':
            VERBOSE = True
        if opt == '-R':
            a_args['show'] = 'result, skill_used, difficulty, requires_skills, tools, components'
            a_args['table'] = 'recipes'
            a_args['where'] = 'result LIKE "%' + arg + '%"'
            a_args['inline'] = ['skill_used',]
            a_args['go_find'] = True
            action = 'selectwhere'
            LOADDEF = False
            SHOWUPDATES = False
        if opt == '-S':
            a_args['show'] = 'result, skill_used, difficulty, requires_skills, tools, components'
            a_args['table'] = 'recipes'
            a_args['where'] = 'skill_used LIKE "%' + arg + '%"'
            action = 'selectwhere'
            LOADDEF = False
            SHOWUPDATES = False
        if opt == '-T':
            a_args['show'] = 'result, skill_used, difficulty, requires_skills, tools, components'
            a_args['table'] = 'recipes'
            a_args['where'] = 'tools LIKE "%' + arg + '%" or components LIKE "%' + arg +'%"'
            action = 'selectwhere'
            LOADDEF = False
            SHOWUPDATES = False
        if opt == '-M':
            a_args['show'] = 'name, category'
            a_args['table'] = 'mutations'
            a_args['where'] = 'category LIKE "%{}%"'.format(arg)
            action = 'selectwhere'
            LOADDEF = False
            SHOWUPDATES = False
        if opt == '-m':
            a_args['show'] = '*'
            a_args['table'] = 'mutations'
            a_args['where'] = 'name LIKE "%{}%"'.format(arg)
            action = 'selectwhere'
            LOADDEF = False
            SHOWUPDATES = False
        if opt == '-D':
            action = 'jsondump'
            LOADDEF = False
            SHOWUPDATES = False
        if opt == '-d':
            argsplit = (arg + ',,').split(',')
            a_args['find'] = argsplit[0]
            if argsplit[1]:
                a_args['column'] = argsplit[1]
            if argsplit[2]:
                a_args['table'] = argsplit[2]
            action = 'jsondump'
            LOADDEF = False
            SHOWUPDATES = False

    if LOADDEF:
        defaults()
    if not dry:
        db_connect()
    savs.append(list(unique))
    savs.append(list(sort_prefs))
    functionary[action](**a_args)
    if not dry:
        db_close()
    print
    if SHOWUPDATES:
        print "Tables: {}, inserted/updated rows: \
{}".format(len(done_tables),done_rows)
        print "Done! :)"

def defaults():
    global furl, tname, unique, sort_prefs, dry
    if not furl:
        print "Using default furl:"
        furl = 'data/raw/recipes.json'
        print furl
    if not unique:
        unique = ['result','id_suffix','name']
    if not sort_prefs:
        sort_prefs.extend(unique)
        sort_prefs.extend(['category','skill_used','difficulty','requires_skills','required_skills','tools','components'])
    if VERBOSE:
        print "Uniques (first columns): " + ", ".join(unique)

    if not tname:
        tname = furl.split('/')[-1].split('.')[0]

def db_connect(db_url="db.sqlite"):
    global db
    db = sqlite3.connect(db_url)

def db_write(query,svalues=''):
    result = None
    if not dry:
        c = db.cursor()
        try:
            if svalues:
                result = c.execute(query,svalues)
            else:
                result = c.execute(query)
        except sqlite3.OperationalError as e:
            print e
            sys.exit(3)
        if result == None:
            db.commit()
            c.close()
    return result

def db_writemany(query, lvalues=[]):
    result = None
    if not dry:
        c = db.cursor()
        try:
            result = c.executemany(query, lvalues)
        except sqlite3.OperationalError as e:
            print e
            sys.exit(3)
        db.commit()
        c.close()
    return result

def db_close():
    db.cursor().close()
    db.commit()
    db.close()

def json_up(filename=''):
    if not filename:
        filename = furl
    traffic = json.load(open(filename))
    try:
        items = traffic.itervalues().next()
    except:
        items = traffic
    return items

def acolyte(items):
    try:
        acol = list(items[0].keys())
    except:
        return list(), False

    for item in items:
        for key in item.keys():
            if key not in acol:
                acol.append(key)
    return acol, True


def create_table(fname=''):
    global done_tables
    if not fname:
        fname = furl

    if VERBOSE:
        print "Create table " + ccolors.BOLD + tname + ccolors.END + " from " + ccolors.BOLD + fname + ccolors.END
    items = json_up(fname)
    acol, success = acolyte(items)
    if not success:
        if VERBOSE:
            print "Missing columns at " + fname
        return

    unique[:] = [u for u in unique if u in acol]
    sort_prefs[:] = [p for p in sort_prefs if p in acol]

    if sort_prefs:
        sorted_colist = acol
        sorted_colist.sort()
        for lit in sort_prefs:
            sorted_colist.remove(lit)
        sort_prefs.extend(sorted_colist)
        acol = sort_prefs

    for col in reserved:
        try:
            acol[acol.index(col)] = "rw_" + col
        except ValueError:
            pass

    if VERBOSE:
        acstr = "All columns: "
        for col in acol:
            acstr += ccolors.BOLD + col + ccolors.END + ", "
        print acstr[:-2]

        if not unique:
            print "Possible uniques (keys) are:"
            print ", ".join(acol)
        print

    query = "create table " + tname + " ("
    cfields = ""

    for column in acol:
        cfields += column + " TEXT,"

    if unique:
        cfields += "UNIQUE ("
        for u in unique:
            cfields += u + ","
        cfields = cfields[:-1] + ") ON CONFLICT REPLACE,"
    query = query + cfields[:-1] + ");"
    if VERBOSE:
        print query
        print

    db_write('drop table if exists ' + tname)
    db_write(query)
    if VERBOSE:
        print "Done"
        print
    done_tables.append(tname)

def insert_into(fname=''):
    global done_rows
    if not fname:
        fname = furl
    if VERBOSE:
        print "Insert everything to table " + tname + " from " + fname

    items = json_up(fname)
    acol, success = acolyte(items)
    if not success:
        return
    for key in reserved:
        try:
            acol[acol.index(key)] = "rw_" + key
        except ValueError:
            pass
    lvalues = []
    for ritem in items:
        rikeys = ritem.keys()
        svalues = []
        itemkeyset = set(rikeys)
        acolyset = set(acol)
        inserting = list(acolyset & itemkeyset)
        for key in rikeys:
            if key in reserved:
                inserting.insert(0, "rw_"+key)
            itemval = ritem.get(key,'%%MISSING')
            svalues.append(str(json.dumps(itemval)))
        #lvalues.append(svalues)
        iquery = "insert into " + tname+"("
        iquery += ", ".join(inserting)
        iquery += ") values("
        iquery += "?," * len(inserting)
        iquery = iquery[:-1]
        iquery += ");"

        if VERBOSE:
            print acolyset
            print ritem
            print inserting
            print svalues

        db_write(iquery, svalues)

    if VERBOSE:
        print "Inserted/updated {} items".format(str(len(items)))
        print
    done_rows += len(items)

def recursive_run(dname=''):
    global tname, unique, sort_prefs
    if not dname:
        dname = furl
    if not os.path.isdir(dname):
        tname = dname.split("/")[-1].split('.')
        if tname[1] == "json":
            tname = tname[0]
            create_table(dname)
            db.commit()
            insert_into(dname)
            unique = list(savs[0])
            sort_prefs = list(savs[1])
        else:
            if VERBOSE:
                print("Skipping " + tname[0]),
                if len(tname) > 1:
                    print "." + tname[1]
    elif os.path.isdir(dname):
        for d in os.listdir(dname):
            recursive_run(os.path.join(dname, d))
    print ('.'),

def finditemid(name, *tables):
    query = "select id from (\n"
    for table in tables:
        tid = table + ".id"
        nid = table + ".name"
        query += "select " +tid+ " as id,"+ nid +" as name from " + table +" "+ table + "\n"
        if table is not tables[-1]:
            query += "union\n"
    query += ") stalias where name like '%" + name + "%';"
    result = db_write(query).fetchall()
    if VERBOSE:
        print query
        for row in result:
            print row
    return result

printcolor = { 
'result':'\033[37;1m',
'tools':'\033[47;2m\033[30m',
'components':'\033[46m\033[30m',
'requires_skills':'\033[42m\033[30m',
'easy':'\033[30m'
}

def selectwhere(**argdict):
    defdict={ 'show': 'result,difficulty', 'table': 'recipes', 'where': '' }
    argdict = dict(list(defdict.items()) + list(argdict.items()))
    show = argdict['show']
    table = argdict['table']
    query = "select " + show + " from " + table
    where = argdict['where']

    splitshow = (show + ",").split(',')
    argdict['keyorder'] = argdict.get('keyorder',splitshow[:-1])

    try:
        go_find = bool(argdict['find'] != "")
    except:
        go_find = False
    if go_find:
        search = where.split('%')[1]
        found = finditemid(search, 'ammo', 'books', 'instruments', 'ranged', 'archery', 'comestibles', 'melee', 'tools', 'armor', 'containers', 'mods')
    if where:
        query += " where " + where
        if go_find:
            for find in found:
                query += "or result = '"+find[0]+"'"
    query += ";"
    if VERBOSE:
        print query
    cursor = db_write(query)
    if cursor:
        rcur = cursor.fetchall()
    else:
        return None
    if show == '*':
        splitshow = list(map(lambda x: x[0], cursor.description))
    if VERBOSE or argdict.get('aprint',True):
        for r in rcur:
            for i,t in enumerate(r):
                ttype = splitshow[i]
                if t == None:
                    t = "No " + ttype
                color = printcolor.get(ttype,'')
                if (ttype == "difficulty" and int(t) == 0):
                    color = printcolor['easy']
                color_end = ccolors.END

                t = re.sub(']],', '|AND',t)
                t = re.sub('[\[\]"]', '', t)
                barsplit = t.split('|')
                if len(barsplit) > 1:
                    for b in barsplit[:]:
                        if ttype in argdict.get('inline',[]):
                            print(color + b + color_end + ','),
                        else:
                            print color + b + color_end
                else:
                    if ttype in argdict.get('inline',[]):
                        print(color + t + color_end + ','),
                    else:
                        print color + t + color_end
            print
    if argdict.get('return_dict',False):
        rlist = []
        for t in rcur: 
            retdict = collections.OrderedDict()
            for i, r in enumerate(t):
                try:
                    ttype = splitshow[i]
                except IndexError:
                    ttype = i
                try:
                    r = int(r.strip('"'))
                except ValueError as e:
                    r = r.strip('"')
                    try:
                        r = json.loads(r)
                    except:
                        pass
                except AttributeError:
                    continue
                retdict[ttype] = r
            rlist.append(retdict.copy())
        return rlist
    return rcur, cursor

class MyJsonEnc(json.JSONEncoder):
    def inside_litems(self, o):
        print o

    def litems(self, o, **i):
        #print(i.get('i',0), o, type(o))
        dic = {'i': i.get('i',0) +1, 'lindent': i.get('lindent',0) }
        lindent = i.get('lindent',0)

        if isinstance(o,int):
            return str(o)
        if isinstance(o, (str,unicode)):
            return str(o)
        if isinstance(o, tuple):
            return str(o)
        if isinstance(o, list):
            if isinstance(o[0], (str, unicode)):
                lindent += 2
                return '\n' + lindent*' ' + '[' + '"{}"'.format(str(o[0])) + self.item_separator + str(o[1]) + ']'
            else:
                retstr =  "["
                for item in o:
                    retstr += self.litems(item, **dic)
                    if item is not o[-1]:
                        retstr += ','
                retstr += '\n' + lindent * ' ' +']'
                return retstr
        return 'h'

    def default(self, o):
        if len(o) == 0:
            return '[]'
        try:
            lindent = self.indent
        except TypeError:
            lindent = 0
        retstr = bytearray('\n' + lindent * ' ')
        try:
            retstr += self.litems(o, **{ 'lindent': lindent })
            return retstr
        except:
            pass
        return json.JSONEncoder.default(self,o)

    def encode(self, o):
        r = bytearray()
        lindent = 0;
        kis = bytearray(self.key_separator)
        iis = bytearray(self.item_separator + '\n')
        for item in o:
            r += '{\n'
            lindent += 4;
            for key, value in item.iteritems():
                    r += lindent * ' '
                    r += '"{}"'.format(key)
                    r += kis
                    try:
                        r += str(int(value))
                    except ValueError:
                        r += '"{}"'.format(value)
                    except TypeError:
                        r += self.default(value)
                    r += iis
            lindent -= 4
            r += '},\n'
        return r[:-2]

def jsondump(**dargs):
    jshow = dargs.get('show','*')
    jtable = dargs.get('table','recipes')
    jwhere = dargs.get('where','')
    jbwhere = dargs.get('column','result')
    jbwhat = dargs.get('find','')

    if jbwhat and jbwhere:
        jwhere = jbwhere + ' like "%' + jbwhat +'%"'
    testing = selectwhere(return_dict=True, aprint=False, 
            where=jwhere, show=jshow, table=jtable)
    if VERBOSE:
        print testing
    if testing:
        jsond = json.dumps(testing, cls=MyJsonEnc, indent=4)

        filee = dargs.get('dumpfile', sys.stdout)
        if filee != sys.stdout:
            with open(filee,'w') as f:
                sys.stdout = f
                print jsond
        else:
            print jsond
        sys.stdout = sys.__stdout__
    else:
        print 'Nothing found'

functionary = {
        'create_table': create_table,
        'insert_into': insert_into,
        'recursive_run': recursive_run,
        'selectwhere': selectwhere,
        'help': chelp,
        'jsondump': jsondump,
        }

if __name__ == "__main__":
    main(sys.argv[1:])

