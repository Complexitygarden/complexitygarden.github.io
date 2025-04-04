"""
Main script which runs the website
"""

# Imports
from flask import Flask, render_template, request, jsonify, session
from script.search import search_classes
from script.load_classes import create_class_network
from script.complexity_network import complexity_network
import git
from datetime import timedelta
from flask_session import Session

"""
Key variables
"""
MAX_SEARCH_OUTPUT = 100
# CLASS_LIST, class_dict = list_all_classes('./proc_classes.json')
class_json_loc = './classes.json'
theorem_json_loc = './theorems.json'
# NETWORK = create_class_network(class_json_loc, theorem_json_loc)

app = Flask(__name__)

app.secret_key = b'_5#y3l"Fp7z\n\xec]/a'
app.testing = True
app.permanent_session_lifetime = timedelta(minutes=1)

# Configure Flask-Session
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

def get_network_from_session():
   print('Getting network from session')
   
   # Create a new network
   network = create_class_network(class_json_loc, theorem_json_loc)
   
   # Get the minimal network data from the session
   minimal_network = session.get('minimal_network', {})
   class_data = session.get('class_data', {})
   
   # Set the trimmed network
   if 'trimmed_network' in minimal_network:
       network.trimmed_network = minimal_network['trimmed_network']
   
   # Set root and top nodes
   if 'root_nodes' in minimal_network:
       network.root_nodes = minimal_network['root_nodes']
   if 'top_nodes' in minimal_network:
       network.top_nodes = minimal_network['top_nodes']
   
   # Set max level
   if 'max_avg_level' in minimal_network:
       network.max_avg_level = minimal_network['max_avg_level']
   
   # Set class properties
   for class_id, data in class_data.items():
       if class_id in network.classes_dict:
           class_obj = network.classes_dict[class_id]
           
           # Set basic properties
           class_obj.visible = data.get('visible', False)
           class_obj.level = data.get('level', -1)
           class_obj.x = data.get('x', -1)
           class_obj.y = data.get('y', -1)
           
           # Set relationships
           class_obj.trim_contains = []
           class_obj.trim_within = []
           
           for target_id in data.get('trim_contains', []):
               if target_id in network.classes_dict:
                   class_obj.trim_contains.append(network.classes_dict[target_id])
           
           for source_id in data.get('trim_within', []):
               if source_id in network.classes_dict:
                   class_obj.trim_within.append(network.classes_dict[source_id])
   
   print('Network retrieved')
   return network

def update_network_information(network):
   # Store only essential data in the session
   session['selected_classes'] = network.get_trimmed_network()
   
   # Store a minimal version of the network
   minimal_network = {
       'classes_identifiers': network.classes_identifiers,
       'trimmed_network': network.trimmed_network,
       'root_nodes': network.root_nodes,
       'top_nodes': network.top_nodes,
       'max_avg_level': network.max_avg_level
   }
   
   # Store class data separately
   class_data = {}
   for class_id in network.trimmed_network:
       class_obj = network.classes_dict[class_id]
       class_data[class_id] = {
           'name': class_obj.get_name(),
           'latex_name': class_obj.get_latex_name(),
           'level': class_obj.get_level(),
           'x': class_obj.get_x(),
           'y': class_obj.get_y(),
           'visible': class_obj.visible,
           'trim_contains': [c.get_identifier() for c in class_obj.get_trim_contains()],
           'trim_within': [c.get_identifier() for c in class_obj.get_trim_within()]
       }
   
   session['minimal_network'] = minimal_network
   session['class_data'] = class_data
   return

@app.before_request
def before_req():
   print('Before request')
   # if 'network' not in session:
   #    session['network'] = create_class_network(class_json_loc, theorem_json_loc)
   if 'network' not in session:
      network = create_class_network(class_json_loc, theorem_json_loc)
      print('Serializing network')
      session['network'] = network.to_json()
      print('Network serialized')
   else:
      network = get_network_from_session()
   if 'all_classes' not in session:
      session['all_classes'] = network.get_all_class_identifiers()
      network.new_trimmed_network(session['all_classes'])
   # Keeping track of classes from last session
   # if 'selected_classes' not in session:
   #    session['selected_classes'] = network.get_trimmed_network()
   update_network_information(network)
   return

@app.route('/', methods=["GET"])
def index():
   return render_template('index.html')

@app.route('/references', methods=["GET"])
def references():
   return render_template('references.html')

@app.route('/searchresults', methods=['GET', "POST"])
def add_remove_class():
   print('Add/remove class')
   if request.method == 'POST':
      var_name = request.form["name"]
      checked = bool(int(request.form["checked"]))
      print(f'{var_name} - {checked}')
      network: complexity_network = get_network_from_session()
      if checked:
         print('Adding')
         network.add_class_to_trimmed_network(var_name)
      else:
         print('Removing')
         network.remove_class_from_trimmed_network(var_name)
      
      update_network_information(network)
      return var_name

@app.route('/search_complexity_classes', methods=['GET'])
def search():
   print('Searching')
   query = request.args.get('query')
   network: complexity_network = get_network_from_session()
   results = search_classes(query, network)
   if len(results) > MAX_SEARCH_OUTPUT:
      results = results[:MAX_SEARCH_OUTPUT]
   return jsonify(results)

@app.route('/get_class_description', methods=['GET'])
def get_class_description():
   print('Getting class description')
   class_name = request.args.get('class_name').lower()
   network: complexity_network = get_network_from_session()
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
   print('Getting complexity network')
   network: complexity_network = get_network_from_session()
   return jsonify(network.get_trimmed_network_json())

@app.route('/get_complexity_sunburst')
def get_complexity_sunburst():
   print('Getting complexity sunburst')
   network: complexity_network = get_network_from_session()
   return jsonify(network.get_trimmed_sunburst_json())

"""
Selecting all/no classes in the visualization
 - If 'select', then we show all classes, otherwise we unselect all
"""
@app.route('/all_class_request', methods=['GET'])
def all_class_request():
   select = request.args.get('select') == 'true'
   network: complexity_network = get_network_from_session()
   if select:
      network.new_trimmed_network(network.get_all_class_identifiers())
   else:
      network.new_trimmed_network([])
   
   #  # Update the check_classes_dict
   #  cc_dict = session['check_classes_dict']
   #  for class_name in CLASS_LIST:
   #      cc_dict[class_name]['value'] = select
   #  session['check_classes_dict'] = cc_dict
   update_network_information(network)
   return jsonify({'success': True})

@app.route('/update_server', methods=['POST'])
def webhook():
   try:
      repo = git.Repo('/home/chrispsimadas/website')
      origin = repo.remotes.origin
      origin.pull()
      return 'Updated PythonAnywhere successfully', 200
   except Exception as e:
      print("Error during git pull"), e
      return 'Failed to update server', 500

"""
Expand item - either an edge or a node
   - expanding an edge: Find all the classes which are between the source and target classes and add those
   - expanding a node: Find all the classes which are connected to the node and add those
"""
@app.route('/expand_item', methods=['GET'])
def expand_item():
   print('Expanding item')
   network: complexity_network = get_network_from_session()
   expand_edge = request.args.get('expand_edge') == 'true'
   if expand_edge:
      source_class = request.args.get('source_class')
      target_class = request.args.get('target_class')
      expand_success, new_classes = network.expand_edge(source_class, target_class)
   else:
      class_name = request.args.get('source_class')
      expand_success, new_classes = network.expand_node(class_name)
   if expand_success:
      update_network_information(network)
   return jsonify({'success': expand_success, 'new_classes': new_classes})

@app.route('/expand_node', methods=['GET'])
def expand_node():
   print('Expanding node')
   class_name = request.args.get('class_name')
   network: complexity_network = get_network_from_session()
   expand_success, new_classes = network.expand_node(class_name)
   if expand_success:
      update_network_information(network)
   return jsonify({'success': expand_success, 'new_classes': new_classes})

@app.route('/delete_class', methods=['GET'])
def delete_class():
   print('Deleting class')
   class_name = request.args.get('class_name')
   network: complexity_network = get_network_from_session()
   delete_class_from_network(class_name, network)
   return jsonify({'success': True})

@app.route('/check_indirect_paths', methods=['GET'])
def check_indirect_paths():
   print('Checking indirect paths')
   class_name = request.args.get('class_name')
   delete_node = request.args.get('delete_node') == 'true'
   network: complexity_network = get_network_from_session()
   direct_paths = network.get_direct_paths(class_name)
   if delete_node:
      delete_class_from_network(class_name, network)
   return jsonify({'success': True, 'direct_paths': direct_paths})

def delete_class_from_network(class_name, network: complexity_network):
   print('Deleting class from network')
   network.remove_class_from_trimmed_network(class_name)
   update_network_information(network)
   return

if __name__ == '__main__':
    app.run(debug=True)
