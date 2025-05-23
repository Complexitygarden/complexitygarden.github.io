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
import hashlib
import hmac
from uuid import uuid4
import time

"""
Key variables
"""
MAX_SEARCH_OUTPUT = 100
# CLASS_LIST, class_dict = list_all_classes('./proc_classes.json')
class_json_loc = './classes.json'
theorem_json_loc = './theorems.json'
default_classes = ["P", "PSPACE", "BPP", "NP"] # Classes we visualize on a first load


# Dictionary to store network instances and their last access times
network_instances = {}
network_last_access = {}

app = Flask(__name__)
app.secret_key = b'_5#y3l"Fp7z\n\xec]/'

def cleanup_old_networks():
    """
    Remove network instances that haven't been accessed in the last minute
    """
    current_time = time.time()
    expired_sessions = [
        session_id for session_id, last_access in network_last_access.items()
        if current_time - last_access > 60
    ]
    
    for session_id in expired_sessions:
        del network_instances[session_id]
        del network_last_access[session_id]

def get_network(first_load: bool = False):
   """
   Get the network instance for the current session or create a new one
   """
   # Clean up old networks first
   cleanup_old_networks()
   new_session = False
   
   if 'session_id' not in session:
      session['session_id'] = str(uuid4())
   
   session_id = session['session_id']
   if session_id not in network_instances:
      network_instances[session_id] = create_class_network(class_json_loc, theorem_json_loc)
      new_session = True
   if (new_session or first_load) and 'selected_classes' in session:
      network_instances[session_id].new_trimmed_network(session['selected_classes'])
   
   # Update last access time
   network_last_access[session_id] = time.time()
   
   return network_instances[session_id]

def update_network_information():
   network = get_network()
   session['selected_classes'] = network.get_trimmed_network()
   # network.print_trimmed_network()
   return

@app.before_request
def before_req():
   if 'all_classes' not in session:
      network = get_network(first_load=True)
      session['all_classes'] = default_classes#network.get_all_class_identifiers()
      network.new_trimmed_network(session['all_classes'])
   # Keeping track of classes from last session
   if 'selected_classes' not in session:
      network = get_network()
      session['selected_classes'] = network.get_trimmed_network()
   return

@app.route('/', methods=["GET"])
def index():
   return render_template('index.html')

@app.route('/references', methods=["GET"])
def references():
   return render_template('references.html')

@app.route('/searchresults', methods=["POST"])
def add_remove_class():
   var_name = request.form["name"]
   checked = bool(int(request.form["checked"]))
   print(f'{var_name} - {checked}')
   network = get_network()
   if checked:
      print('Adding')
      network.add_class_to_trimmed_network(var_name)
   else:
      print('Removing')
      network.remove_class_from_trimmed_network(var_name)
   
   update_network_information()
   return var_name

@app.route('/search_complexity_classes', methods=['GET'])
def search():
   query = request.args.get('query')
   network = get_network()
   results = search_classes(query, network)
   if len(results) > MAX_SEARCH_OUTPUT:
      results = results[:MAX_SEARCH_OUTPUT]
   return jsonify(results)

@app.route('/get_class_description', methods=['GET'])
def get_class_description():
   class_name = request.args.get('class_name').lower()
   network = get_network()
   description = network.get_class(class_name).get_description()
   information = network.get_class(class_name).get_information()
   try:
      # title = class_dict[class_name]['title']
      # Going to add a proper title later - we should decide how to format this page
      title = network.get_class(class_name).get_latex_name()
   except:
      title = "No title available"
   return jsonify({'description': description, 'title': title, 'information':information})

@app.route('/get_complexity_network')
def get_complexity_network():
   network: complexity_network = get_network()
   network.update_location = True
   return jsonify(network.get_trimmed_network_json())

@app.route('/get_complexity_sunburst')
def get_complexity_sunburst():
   network = get_network()
   return jsonify(network.get_trimmed_sunburst_json())

"""
Selecting all/no classes in the visualization
 - If 'select', then we show all classes, otherwise we unselect all
"""
@app.route('/all_class_request', methods=['GET'])
def all_class_request():
    select = request.args.get('select') == 'true'
    network = get_network()
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
      #Open local repository
      repo = git.Repo('/home/chrispsimadas/website')

      #Origin = remote repository
      origin = repo.remotes.origin

      #Fetch latest changes from remote
      origin.fetch()

      #Reset the local branch to match the remote main branch exactly
      repo.git.reset('--hard', 'origin/main')

      return 'Updated PythonAnywhere successfully', 200
   except Exception as e:
      print("Error during git fetch/reset"), e
      return 'Failed to update server', 500

"""
Expand item - either an edge or a node
   - expanding an edge: Find all the classes which are between the source and target classes and add those
   - expanding a node: Find all the classes which are connected to the node and add those
"""
@app.route('/expand_item', methods=['GET'])
def expand_item():
   network = get_network()
   expand_edge = request.args.get('expand_edge') == 'true'
   if expand_edge:
      source_class = request.args.get('source_class')
      target_class = request.args.get('target_class')
      expand_success, new_classes = network.expand_edge(source_class, target_class)
   else:
      class_name = request.args.get('source_class')
      expand_success, new_classes = network.expand_node(class_name)
   if expand_success:
      update_network_information()
   return jsonify({'success': expand_success, 'new_classes': new_classes})

@app.route('/expand_node', methods=['GET'])
def expand_node():
   class_name = request.args.get('class_name')
   network = get_network()
   expand_success, new_classes = network.expand_node(class_name)
   if expand_success:
      update_network_information()
   return jsonify({'success': expand_success, 'new_classes': new_classes})

@app.route('/delete_class', methods=['GET'])
def delete_class():
   class_name = request.args.get('class_name')
   network = get_network()
   delete_class_from_network(class_name, network)
   return jsonify({'success': True})

@app.route('/check_indirect_paths', methods=['GET'])
def check_indirect_paths():
   class_name = request.args.get('class_name')
   delete_node = request.args.get('delete_node') == 'true'
   network: complexity_network = get_network()
   direct_paths = network.get_direct_paths(class_name)
   if delete_node:
      print(f"Deleting class {class_name}")
      delete_class_from_network(class_name, network)
   return jsonify({'success': True, 'direct_paths': direct_paths})

def delete_class_from_network(class_name, network: complexity_network):
   network.remove_class_from_trimmed_network(class_name)
   update_network_information()
   return

@app.route('/keep_session_active', methods=['GET'])
def keep_session_active():
   """
   Endpoint to keep the session active by accessing the network
   """
   get_network()
   return jsonify({'success': True, 'message': 'Session kept active'})

if __name__ == '__main__':
    app.run(debug=True)
