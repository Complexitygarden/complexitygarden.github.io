import requests
import bibtexparser
import json
import os
from pathlib import Path

try:
    headers = {"accept":"application/x-bibtex"}
    response = requests.get("http://dx.doi.org/10.1145/800157.805047", headers=headers)
    #print(response.text)
except:
    print("error")



def make_identifier(authors, year):
    years_suffix = year[-2:] #from the second to last char, to the end

    #turn authors into list, replace whitespace, split by the word "and"
    author_list = [a.strip() for a in authors.replace("\n", " ").split(" and ")]

    #if only one author, then get the first 3 letters of the last name and combine with the last two digits of the publication year
    if (len(author_list)) == 1:

        #last name is first, get the first word in this list
        last = author_list[0].split()[0] 

        #combine the first 3 letters of the last name, and the last two digits of the publication year
        return last[:3].capitalize() + years_suffix
    #if there are multiple authors, then get the initial of the last name from each, and the last two digits of the publication year
    else:
        initials = "".join(name.split()[0][0].upper() for name in author_list)
        return initials + years_suffix




import sys
if __name__ == "__main__":

    if len(sys.argv) < 1:
        print("Usage: add_reference.py <doi>")
        sys.exit(1)


    doi = sys.argv[1]
    try:
        headers={"accept":"application/x-bibtex"}
        response = requests.get(f"http://dx.doi.org/{doi}", headers=headers)
        response.raise_for_status()
        
        entry = bibtexparser.parse_string(response.text).entries[0]

        authors = entry.get("author", "").value
        year = entry.get("year","0000").value
        identifier = make_identifier(authors, year) #first 3 digits of last name, or all initials of last name + last 2 digits of publication date
        citation_key = entry.key #is this necessary? idk because it doesnt seem to be used anywhere and its kind of random as to what the key even is
        entry_type = entry.entry_type

        
        json_output = {
            "identifier" : identifier,
            "citation_key" : citation_key,
            "entry_type" : entry_type,
            "fields" : {
                key : entry.get(key, "").value for key in entry.fields_dict
            }
        }

        print("\n Reference Preview: \n")


        print(json.dumps(json_output, indent=4, ensure_ascii=False))

        confirm = input("\n Add this reference to references.json? (y/n): ").strip().lower()

        if (confirm == "y"):

            #get path of references.json
            current_path = Path(__file__).resolve()
            root = current_path.parent.parent
            references_path = root / "static" / "references.json"

            if references_path.exists():
                try:
                    data = json.loads(references_path.read_text(encoding="utf-8"))
                    if "references" not in data or not isinstance(data["references"], list):
                        raise ValueError("Missing or invalid 'references' list in file.")

                except Exception as e:
                    print("Error reading references from reference.json")
                    print(e)
                    sys.exit(1)

            else:
                print("References path does not exist!")
                sys.exit(1)

            existing_ids = {ref["identifier"] for ref in data["references"]}

            if json_output["identifier"] in existing_ids:
                print("\n Reference already exists. Not adding.")

            else:
                data["references"].append(json_output)
                references_path.write_text(json.dumps(data, indent=4, ensure_ascii=False), encoding="utf-8")

                print("\n Added to references.json")


        else: #if confirm != y
            print("\n Reference not added.")

    except Exception as e:
        print(e)
