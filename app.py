"""
Main script which runs the website
"""

# Imports
from flask import Flask, render_template, request, jsonify, session
from script.load_classes import list_all_classes, create_class_network
from script.search import search_classes
from script.load_classes import create_class_network
from script.complexity_network import complexity_network
import git

"""
Key variables
"""
MAX_SEARCH_OUTPUT = 100
# CLASS_LIST, class_dict = list_all_classes('./proc_classes.json')
class_json_loc = './classes.json'
theorem_json_loc = './theorems.json'
NETWORK = create_class_network(class_json_loc, theorem_json_loc)

app = Flask(__name__)

app.secret_key = b'_5#y3l"Fp7z\n\xec]/'

@app.before_request
def before_req():
   # if 'network' not in session:
   #    session['network'] = create_class_network(class_json_loc, theorem_json_loc)
   if 'all_classes' not in session:
      session['all_classes'] = NETWORK.get_all_class_identifiers()
      NETWORK.new_trimmed_network(session['all_classes'])
   # Keeping track of classes from last session
   if 'selected_classes' not in session:
      session['selected_classes'] = NETWORK.get_trimmed_network()
   # if 'checked_classes' not in session:
   #    session['checked_classes'] = []
   # if 'check_classes_dict' not in session:
   #    checked_classes_dict = {c:{'name': c, 'value':False} for c in CLASS_LIST }
   #    checked_classes = session['checked_classes']
   #    for cc in checked_classes:
   #       checked_classes_dict[cc]['value'] = True
   #    session['check_classes_dict'] = checked_classes_dict
   
   return

@app.route('/', methods=["GET"])
def index():
   return render_template('index.html')

@app.route('/searchresults', methods=['GET', "POST"])
def add_remove_class():
   if request.method == 'POST':
      var_name = request.form["name"]
      checked = bool(int(request.form["checked"]))
      print(f'{var_name} - {checked}')
      network: complexity_network = NETWORK
      if checked:
         print('Adding')
         network.add_class_to_trimmed_network(var_name)
      else:
         print('Removing')
         network.remove_class_from_trimmed_network(var_name)
      
      # Updating the checked_classes_dictionary
      # cc_dict = session['check_classes_dict']
      # if var_name in cc_dict:
      #    cc_dict[var_name]['value'] = checked
      # session['check_classes_dict'] = cc_dict
      session['selected_classes'] = network.get_trimmed_network()
      network.print_trimmed_network()
      return var_name

@app.route('/search_complexity_classes', methods=['GET'])
def search():
   query = request.args.get('query')
   network: complexity_network = NETWORK
   results = search_classes(query, network)
   if len(results) > MAX_SEARCH_OUTPUT:
      results = results[:MAX_SEARCH_OUTPUT]
   return jsonify(results)

@app.route('/get_class_description', methods=['GET'])
def get_class_description():
   class_name = request.args.get('class_name')
   network: complexity_network = NETWORK
   description = network.get_class(class_name).get_description()
   information = network.get_class(class_name).get_information()
   try:
      # title = class_dict[class_name]['title']
      # Going to add a proper title later - we should decide how to format this page
      title = network.get_class(class_name).get_name()
   except:
      title = "No title available"
   return jsonify({'description': description, 'title': title, 'information':information})

@app.route('/get_complexity_network')
def get_complexity_network():
   network: complexity_network = NETWORK
   return jsonify(network.get_trimmed_network_json())

"""
Selecting all/no classes in the visualization
 - If 'select', then we show all classes, otherwise we unselect all
"""
@app.route('/all_class_request', methods=['GET'])
def all_class_request():
    select = request.args.get('select') == 'true'
    network: complexity_network = NETWORK
    if select:
        network.new_trimmed_network(network.get_all_class_identifiers())
    else:
        network.new_trimmed_network([])
    
   #  # Update the check_classes_dict
   #  cc_dict = session['check_classes_dict']
   #  for class_name in CLASS_LIST:
   #      cc_dict[class_name]['value'] = select
   #  session['check_classes_dict'] = cc_dict
    
    return jsonify({'success': True})

@app.route('/update_server', methods=['POST'])
def webhook():
   try:
      repo = git.Repo('/home/complexitytest/website')
      origin = repo.remotes.origin
      origin.pull()
      return 'Updated PythonAnywhere successfully', 200
   except Exception as e:
      print("Error during git pull"), e
      return 'Failed to update server', 500

#test commit comment

if __name__ == '__main__':
    app.run(debug=True)