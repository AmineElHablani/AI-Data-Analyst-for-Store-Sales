import joblib 
from flask import Flask , render_template,request , send_from_directory , jsonify,send_file
import re 
import string
import nltk  #Natural language tool kit
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import re
from time import sleep 
import random
import pandas as pd 
import pickle
from flask_caching import Cache
from sklearn.preprocessing import LabelEncoder
import json
import nbformat
from nbconvert import HTMLExporter
import matplotlib.pyplot as plt 
import zipfile
import os 
import uuid

# Load the vectorizer from the file
with open('count_vectorizer.pkl', 'rb') as file:
    cv = pickle.load(file)

#initialize the stemmer 
ps=PorterStemmer()  
    
#load model 
svm = joblib.load("Model/svm_chatbot_best.joblib")

neuralprophet_model = joblib.load("Model/neural_profet.joblib")
#load neuralphrephet_data
data_train_prophet = pd.read_csv("static/data/data_train_neuralProphet.csv").drop("Unnamed: 0",axis=1)

def load_pandas_data(json_file_name):
    # reading the JSON data using json.load()
    with open(json_file_name) as train_file:
        dict_train = json.load(train_file)
    #pull data from the json format 
    tags = []
    patterns = []
    for idx in range(len(dict_train["intents"])):
        tags.append(dict_train["intents"][idx]["tag"])
        patterns.append(dict_train["intents"][idx]["patterns"])

    #fill the dataframe 
    tags_column = []
    patterns_column = []

    for tag_idx in range(len(tags)):
        for p_idx in range(len(patterns[tag_idx])):
            tags_column.append(tags[tag_idx])
            patterns_column.append(patterns[tag_idx][p_idx])
    #create the dataframe
    data = pd.DataFrame({
        "Tag":tags_column,
        "Patterns":patterns_column,
    })
    
    #add the answers column 
    answers_column = []
    for idx in range(data.shape[0]):
        tag_idx = tags.index(data["Tag"][idx])
        answers_column.append(dict_train["intents"][tag_idx]["responses"])
    data["Responses_list"] = answers_column 
    le = LabelEncoder()
    le.fit(data["Tag"])

    #transform the Tags data (creating new column)
    data["Label"] = le.transform(data["Tag"])

    return data 

def message_preprocess(message):
    s=re.sub('[^a-zA-Z0-9]'," ",message)
    s= s.lower()
    s=s.split()
    s= [word for word in s if word not in stopwords.words('english')]
    s=" ".join(s)
    s= ps.stem(s)
    s = cv.transform([s]).toarray()
    return s



def time_series_forecast(userDate):   
    last_date = pd.to_datetime(data_train_prophet['ds']).max()
    future_date = pd.to_datetime(userDate)

    periods = (future_date.year - last_date.year) * 12 + future_date.month - last_date.month
    periods

    future = neuralprophet_model.make_future_dataframe(df=data_train_prophet, periods=periods)
    future.to_csv("test.csv")
    y_pred = neuralprophet_model.predict(future)
    
    #generate unique image name
    image_name = uuid.uuid4()

    
    plt.plot(y_pred.set_index("ds")['yhat1'],label = "Neural prophet prediction")
    plt.title(f"Monthly Forecasts Until {userDate}",fontsize=15)
    plt.xlabel("Date",fontsize=10)
    plt.ylabel("Predicted Values",fontsize=10)
    plt.xticks(rotation=45)

    plt.savefig(f"static/forecasts/{image_name}.jpg")
    plt.clf()  # Clear the plot for the next save

    description = y_pred.drop(["y","trend","season_yearly"],axis=1)
    description.columns = ["Date","Prediction ($)"] 
    return description , image_name



def chatbot(message):
    #preprocess the user message 
    inp = message_preprocess(message)

    results = svm.predict(inp)[0]
    
    data_pred= data[data["Label"] == results]
    data_pred = data_pred.reset_index()
    
    sleep(1.5)
    bot = random.choice(list(data_pred["Responses_list"])[0])
    return(bot)


#import data 
data = load_pandas_data("intents.json")

#flask 

app = Flask(__name__)


@app.route('/')
def Chatbot_page():
    return render_template("index.html",page_title="Chatbot Page")
            
@app.route('/timeseries-page')
def timeseries_page():
    return render_template("timeseries-page.html",page_title="Time Series page",time_series="timeseries")


@app.route("/get")
def get_bot_response():
    user_text = request.args.get("msg")
    return str(chatbot(user_text))   
        


@app.route('/dataframe',methods=["POST","GET"])
def filter_data():
    start_date = request.form.get("start_date")
    end_date = request.form.get("end_date")
    selected_columns = request.form.getlist('selected_columns[]')

    # Load the data
    df = pd.read_excel("static/data/Superstore_Sales.xls")
    df["Order Date"] = pd.to_datetime(df['Order Date'])
    # Convert dates to datetime objects for comparison
    start_date = pd.to_datetime(start_date)
    end_date = pd.to_datetime(end_date)
    
    # Filter the DataFrame
    filtered_df = df[(df["Order Date"] >= start_date) & (df['Order Date'] <= end_date)]
    filtered_df = filtered_df[selected_columns]
    filtered_df.to_csv("static/data/custom_data.csv")

    # Convert the filtered DataFrame to JSON
    filtered_data = filtered_df.to_dict(orient='records')
    
    # Return JSON response
    return jsonify(filtered_data)    

#download data 
@app.route('/download-data', methods=['GET'])
def return_file():
    return send_from_directory(directory='static/data/', path='custom_data.csv', as_attachment=True)



#time-series forecast 
@app.route('/forecast',methods=["POST","GET"])
def forecast():
    start_date = request.form.get("userDate")
    predictions , image_name = time_series_forecast(start_date)
    # Return JSON response
    #transfor dataframe to json
    predictions.to_csv("static/data/predictions.csv")
    predictions =  predictions.to_dict(orient='records')

    response = {
        'table': predictions,
        'image': f"static/forecasts/{image_name}.jpg",
        "userDate":start_date
    }
    return jsonify(response) 

#download forecast 
@app.route('/download_forecasts')
def download_files():
    # Define the paths to your files
    image_path = request.args.get("image_name")
    files = [image_path, 'static/data/predictions.csv']
    
    # Create a temporary ZIP file
    zip_filename = 'static/data/forecasts.zip'
    with zipfile.ZipFile(zip_filename, 'w') as zipf:
        for file in files:
            zipf.write(file, os.path.basename(file))
    
    return send_file(zip_filename, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
