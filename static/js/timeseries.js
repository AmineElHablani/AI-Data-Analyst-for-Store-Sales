function openContent(element){ //element is the contentDiv
    //open content depend on the clicked button 
    if(extanded == "button-data"){

    }else if (extanded == "notebook-data"){

    }else if (extanded == "forecast-data"){

    }
}

function expandDiv(element){
    
        element.style.width="100%"
        let buttonLabel = element.childNodes[3]
        //get body (change background)
        let body = document.getElementsByTagName('body')[0];
        body.style.backgroundSize = "cover"
        //add text
        if(element.id == "button-data" ){
            labelText = "Data"
            body.style.backgroundImage = "url(static/images/background-chatbot-page8.jpg)";

        }else if (element.id == "button-notebook" ){
            labelText = "NoteBook"
            body.style.backgroundImage = 'url("static/images/background-chatbot-page6.png")'

        }else if(element.id =="button-forecast" ){
            labelText = "Forecast"
            body.style.backgroundImage = 'url("static/images/background-chatbot-page4.png")'

        }
        buttonLabel.innerHTML = `<p>${labelText}</p>`
}
function closeExpandedDiv(element){
    
    let buttonLabel = element.childNodes[3]
    element.style.width="50px"
    buttonLabel.innerHTML =""
}
function getContentDiv(expandedID){

    if(expandedID == "button-data"){
        contentDivID ="content-data"

    }else if(expandedID == "button-notebook"){
        contentDivID ="content-notebook"


    }else if(expandedID == "button-forecast"){
        contentDivID ="content-forecast"

    }
    return document.getElementById(contentDivID)
}

function insertTable(data,tableBody,tableHead,columns,download){
        //insert columns 
        columns.forEach((col) =>{
            //create Elements 
            th = document.createElement("th")
            th.innerText = col
            tableHead.appendChild(th)
            
        })

        //insert table values
        data.forEach(row =>{
            //create a row 
            tr= document.createElement('tr')
            //navigate in each row
            columns.forEach(col => {
                //create a row-col
                td = document.createElement('td')
                //insert content of row-col
                td.innerHTML = row[col]
                //appending the row-col  to the row
                tr.appendChild(td)

            });
            //append the child to the 
            tableBody.appendChild(tr)

            //display the download button 
            download.style.pointerEvents="auto"
            download.style.backgroundColor="black"
        })
}

function displayButtonName(){
    let menuButtons = document.querySelectorAll(".menu-button") 
    let labelText = ""

    //expanded is veriable to verify wich button is expanded
    let expanded = null

    menuButtons.forEach(button => {
        button.addEventListener('mouseover',function(){
            if(expanded == null){
                //expandDiv
                expandDiv(this)
                
            }    

        })
        button.addEventListener('mouseout',function(){
            if(expanded == null){
                closeExpandedDiv(this)
                document.body.style.backgroundImage = 'url("static/images/time-series-logo1.jpg")'
                document.body.style.backgroundSize = "contain"
            }
        }) 

        //add on click event 
        button.addEventListener('click',function(){
            let contentDivID =""
            //call the content's div + clear its content

            let contentDiv = getContentDiv(this.id)
            // in case 1 : this div is already expanded (so juste close it)
            if(this.id == expanded){
                //juste set expanded = null
                expanded = null 
                closeExpandedDiv(this)
                contentDiv.style.display = "none"


            }//case 2 : this div is not expanded
            else if (this.id !== expanded){ 
                //close the expanded div 
                if(expanded != null){
                    //close prevous expanded button
                    let perviousExpandedDiv = document.getElementById(expanded)
                    closeExpandedDiv(perviousExpandedDiv)
                    //contentDiv.style.display = "none"

                    //close previous content
                    let previousContentDiv = getContentDiv(expanded)
                    previousContentDiv.style.display = "none"
                    console.log(perviousExpandedDiv)
                }
                //define the clicked button as extanded
                expanded = this.id 
                //expand this Div 
                expandDiv(this)

                contentDiv.style.display = "flex"

                //open content
                //openContent(contentDiv)
            }
        })


    });
}
displayButtonName()


//load data 
function getDataFrame(){
    let startDate = document.getElementById("startdate").value
    let endDate = document.getElementById("enddate").value 
    let columns_filter = document.querySelectorAll('input[name="column"]:checked');
    let selected_columns = [];
    

    console.log(startDate)
    console.log(endDate)
    console.log(columns_filter)
    //selected columns 
    columns_filter.forEach((col) => {
        selected_columns.push(col.value);
    });
    console.log(selected_columns)


    $.post('/dataframe', { start_date: startDate, end_date: endDate ,selected_columns : selected_columns })
            .done(function(data) {
                //call tables 
                let tableHead=document.getElementById("table-header")
                let tableBody=document.getElementById("data-body")
                let download = document.getElementById("download-data")
                


                console.log(tableBody)

                //define (columns)
                columns = Object.keys(data[0]);
                //clear table if he is filled 
                tableBody.innerHTML=''
                tableHead.innerHTML=''

                insertTable(data,tableBody,tableHead,columns,download)

            })
            .fail(function(xhr, status, error) {
                console.error('Error:', status, error);
            });

}

document.getElementById("filter-data").addEventListener("click",function(){
    getDataFrame()
})
document.querySelector(".columns .label").addEventListener("click",function(){
    let optionsList = document.querySelector(".columns-options")

    //get the display value
    let displayValue = optionsList.style.display;
    if(displayValue == "none"){
        optionsList.style.display="block"
    }else{
        optionsList.style.display="none"

    }

})

document.getElementById("reset-columns").addEventListener("click",function(){
    let allColumns = document.querySelectorAll('input[name="column"]:checked');
    console.log(allColumns)
    allColumns.forEach(col =>{
        col.checked = false
    })

})




document.getElementById("submit-forecast").addEventListener("click",function(){
    let userDate = document.getElementById("dateforecast").value
    $.post('/forecast', { userDate: userDate})
            .done(function(data) {
                //call tables 
                let tableHead=document.getElementById("forecast-header")
                let tableBody=document.getElementById("forecast-body")
                let download = document.getElementById("download-forecast")
                console.log(data["userDate"])
                //call graph area
                let imageDiv = document.getElementById("forecast-graph")
                //set image name (to download it later)
                let image_name = document.getElementById("image-name")
                
                console.log(tableBody)
                predictionsTable = data["table"]
                image_path=data["image"]
                //define (columns)
                columns = Object.keys(predictionsTable[0]);
                //clear table if he is filled 
                tableBody.innerHTML=''
                tableHead.innerHTML=''
                imageDiv.innerHTML=''
                //insert the predictions description
                insertTable(predictionsTable,tableBody,tableHead,columns,download)

                //insert image 
                imageDiv.innerHTML= `<img src="${image_path}" alt="preditions">`
                image_name.value=image_path

            })
            .fail(function(xhr, status, error) {
                console.error('Error:', status, error);
            });
})
