"""
Main script which runs the website
"""

# Imports
from flask import Flask, render_template, request, jsonify, session
from script.load_classes import list_all_classes, create_class_network

"""
Key variables
"""
MAX_SEARCH_OUTPUT = 10
CLASS_LIST, class_dict = list_all_classes('./proc_classes.json')

app = Flask(__name__)

app.secret_key = b'_5#y2l"FP7z\n\xec]/'

@app.before_request
def before_req():
   if 'all_classes' not in session:
      session['all_classes'] = CLASS_LIST
   if 'checked_classes' not in session:
      session['checked_classes'] = []
   if 'check_classes_dict' not in session:
      checked_classes_dict = {c:{'name': c, 'value':False} for c in CLASS_LIST }
      checked_classes = session['checked_classes']
      for cc in checked_classes:
         checked_classes_dict[cc]['value'] = True
      session['check_classes_dict'] = checked_classes_dict
   
   return

@app.route('/', methods=["GET"])
def index():
   return render_template('index.html')

@app.route('/searchresults', methods=['GET', "POST"])
def test():
   if request.method == 'POST':
      var_name = request.form["name"]
      checked = bool(int(request.form["checked"]))
      print(f'{var_name} - {checked}')
      class_list = list(set(session['checked_classes']))
      if checked:
         print('Adding')
         class_list.append(var_name)
      else:
         print('Removing')
         try:
            class_list.remove(var_name)
         except:
            pass
      session['checked_classes'] = class_list
      
      # Updating the checked_classes_dictionary
      cc_dict = session['check_classes_dict']
      if var_name in cc_dict:
         cc_dict[var_name]['value'] = checked
      session['check_classes_dict'] = cc_dict
      print(session['checked_classes'])
      return var_name

@app.route('/search_complexity_classes', methods=['GET'])
def search():
   query = request.args.get('query')
   cc_dict = session['check_classes_dict']
   all_class_list = session['all_classes']
   results = [cc_dict[d] for d in all_class_list if query.lower() in d.lower()]
   if len(results) > MAX_SEARCH_OUTPUT:
      results = results[:MAX_SEARCH_OUTPUT]
   return jsonify(results)

@app.route('/get_complexity_network')
def get_complexity_network():
   print('here')
   check_class_list = session['checked_classes']
   print(check_class_list)
   network = create_class_network(check_class_list, class_dict)
   print(network)
   return jsonify(network)


if __name__ == '__main__':
    app.run(debug=True)