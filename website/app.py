from flask import Flask, render_template, request, jsonify, session

max_search_output = 10

app = Flask(__name__)

app.secret_key = b'_5#y2L"F4Q7z\n\xec]/'

data = ["BQP", "P", "QMA", "PP", "ALL", "NONE", "QCMA", "PSPACE", "EXP", "NEXP", "NP"]
data = sorted(data)

data_test = [{'name':d, 'value':True} for d in data]

@app.before_request
def before_req():
   if 'all_classes' not in session:
      session['all_classes'] = data
   if 'checked_classes' not in session:
      session['checked_classes'] = []
   if 'check_classes_dict' not in session:
      checked_classes_dict = {c:{'name': c, 'value':False} for c in data }
      checked_classes = session['checked_classes']
      for cc in checked_classes:
         checked_classes_dict[cc]['value'] = True
      session['check_classes_dict'] = checked_classes_dict
   
   return

@app.route('/', methods=["GET"])
def index():
   cc_list = list(session['check_classes_dict'].values())
   return render_template('index.html', complexity_classes=cc_list)

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
   results = [cc_dict[d] for d in data if query.lower() in d.lower()]
   if len(results) > max_search_output:
      results = results[:max_search_output]
   return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)