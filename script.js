
document.getElementById("submitButton").addEventListener("click", async function(event)
{
    event.preventDefault();

    const classA = document.getElementById("classA").value.trim();
    const classB = document.getElementById("classB").value.trim();


    try
    {
        //Send get request
        const response = await fetch(`http://127.0.0.1:5000/api/relationship?classA=${encodeURIComponent(classA)}&classB=${encodeURIComponent(classB)}`);

        if (response.ok)
        {
            //Parse JSON
            const data = await response.json();

            if (data.relationship == "a subset")
            {
                document.getElementById("result").textContent = `${classA} is ${data.relationship} of ${classB}.`;
            }
            else if (data.relationship == "equal")
            {
                document.getElementById("result").textContent = `${classA} is equal to ${classB}.`;
            }
            else
            {
                document.getElementById("result").textContent = `The relationship between ${classA} and ${classB} is unknown.`;
            }
        }

        else
        {
            document.getElementById("result").textContent = error;

            console.log(error);
        }
    }

    catch (error)
    {
        //Network error
        console.log("Error fetching relationship:", error);
        document.getElementById("result").textContent = "Error: could not fetch the relationship"
    }

});



document.addEventListener('DOMContentLoaded', async function()
{
    try
    {
        const response = await fetch(`http://127.0.0.1:5000/api/relationship/getAllClasses`);

        if (response.ok)
        {
            const data = await response.json();
            
            autocomplete(document.getElementById("classA"), data);
            autocomplete(document.getElementById("classB"), data);

        }
    }
    catch(error)
    {
        console.log(error);
    }}
);


function autocomplete(input, possibleValues)
{
    var currentFocus;


    input.addEventListener("input", function(e)
    {
        var dropDownItemList, dropDownItem, i, valueOfInput = this.value;
        closeAllLists();


        
        currentFocus = -1;

        dropDownItemList = document.createElement("DIV");
        dropDownItemList.setAttribute("id", this.id + "autocomplete-list");
        dropDownItemList.setAttribute("class","autocomplete-items");

        this.parentNode.appendChild(dropDownItemList);

        for(i = 0; i < possibleValues.length; i++)
        {
            if (possibleValues[i].substr(0, valueOfInput.length).toUpperCase() == valueOfInput.toUpperCase())
            {

                dropDownItem = document.createElement("DIV");

                //Add text to the item, and make matching letters bold
                dropDownItem.innerHTML = "<strong>" + possibleValues[i].substr(0, valueOfInput.length) + "</strong>";
                //Add the letters after the bold ones
                dropDownItem.innerHTML += possibleValues[i].substr(valueOfInput.length);

                //Make the item an actual input with the value being its name.
                dropDownItem.innerHTML += "<input type='hidden' value='" + possibleValues[i] + "'>";

                //Clicking the item will 'submit' it and close the drop down list
                dropDownItem.addEventListener("click", function(e)
                {
                    input.value = this.getElementsByTagName("input")[0].value;

                    closeAllLists();
                });
                dropDownItemList.append(dropDownItem);
            }
        }
    });

    input.addEventListener("click", function(e)
    {
        if (!this.value)
        {
            
            var dropDownItemList, dropDownItem, i, valueOfInput = this.value;
            closeAllLists();
    
    
            
            currentFocus = -1;
    
            dropDownItemList = document.createElement("DIV");
            dropDownItemList.setAttribute("id", this.id + "autocomplete-list");
            dropDownItemList.setAttribute("class","autocomplete-items");
    
            this.parentNode.appendChild(dropDownItemList);
    
            for(i = 0; i < possibleValues.length; i++)
            {

                dropDownItem = document.createElement("DIV");
    
    
                dropDownItem.innerHTML += possibleValues[i].substr(valueOfInput.length);
    
                dropDownItem.innerHTML += "<input type='hidden' value='" + possibleValues[i] + "'>";
    
                dropDownItem.addEventListener("click", function(e)
                {
                    input.value = this.getElementsByTagName("input")[0].value;
    
                    closeAllLists();
                });
                dropDownItemList.append(dropDownItem);
                
            }

        }
    });

    input.addEventListener("keydown", function(e)
    {
        var x = document.getElementById(this.id + "autocomplete-list");

        if (x) x = x.getElementsByTagName("div");

        if (e.keyCode == 40)
        {
            currentFocus++;
            addActive(x);
        }
        else if (e.keyCode == 38)
        {
            currentFocus--;
            addActive(x);
        }
        else if (e.keyCode == 13)
        {
            e.preventDefault();
            if (currentFocus > -1)
            {
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x)
    {
        if (!x) return false;

        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);

        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x)
    {
        for (var i = 0; i < x.length; i++)
        {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(element)
    {
        var x = document.getElementsByClassName("autocomplete-items");

        for (var i = 0; i < x.length; i++)
        {
            if (element != x[i] && element != input)
            {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }


    document.addEventListener("click", function(e)
    {
        if (!(isClickedObjectAutoCompleteBox(e)))
        {
            closeAllLists();
        }
    });


    function isClickedObjectAutoCompleteBox(e)
    {
        return e.target.parentNode.className == input.parentNode.className;
    }
}

