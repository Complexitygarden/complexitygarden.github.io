import requests
from bs4 import BeautifulSoup

def get_class_info(class_name: str):

    #Example url for NP: https://complexityzoo.net/Complexity_Zoo:N

    #Get the webpage for all classes beginning with this letter
    first_letter = class_name[0].upper()
    url = f"https://complexityzoo.net/Complexity_Zoo:{first_letter}"

    response = requests.get(url)

    if (response.status_code != 200):
        return ["Failed to fetch information, Status:" + str(response.status_code)]

    soup = BeautifulSoup(response.text, 'html.parser')
    

    #Find the span element with the id of the name
    #All the next paragraph elements will be information about this class. The next class' information is delimited by an h5 element
    information_span = soup.find('span', {'id': f"{class_name.lower()}"})

    output_list = []

    #Get all paragraph elements until you read an h5, which is the next class
    for element in information_span.find_all_next():
        if element.name == "p":
            output_list.append(element.text)
        elif element.name == "h5":
            break
        else:
            #Todo: parse hyperlink a element
            pass
    return output_list



if __name__=='__main__':
    for element in get_class_info("P"):
        print(element)