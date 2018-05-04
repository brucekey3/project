function vote(votes, choice)
{
  if (!votes[choice])
  {
    votes[choice] = 1;
  }
  else
  {
    votes[choice] += 1;
  }
}

function getFakeDate()
{
  let today = new Date();
  let year = today.getFullYear() + 2;
  let month = today.getMonth();
  return month + "/" + year;
}

var dataGenerator = {
  email : "testEmail@domain.com",
  password: "fakePassword",
  cardnumber: "4916252669881577",
  expiryDate: getFakeDate(),
  csc: 123,
  name: "Fake Name",
  username: "FakeUser",
  address: "12 FakeStreet",
  city: "FakeCity",
  state: "Ohio",
  county: "London",
  postCode: "BN24 6RB",
  zipCode: "10012"
}

function bruteForceGuess(field)
{
  let votes = {};
  let winner = undefined;
  let winningVotes = 0;

  for (attrObj of field.attributes)
  {
    let name =  String(attrObj.name).toLowerCase();
    let value = String(attrObj.value).toLowerCase();

    if (name.indexOf("email") !== -1 || value.indexOf("email") !== -1)
    {
      //field.value = "testEmail@domain.com";
      let choice = "email";
      vote(votes, choice);
      if (votes[choice] > winningVotes)
      {
        winner = choice;
        winningVotes = votes[choice];
      }
    }
    else if (name.indexOf("password") !== -1 || value.indexOf("password") !== -1)
    {
      //field.value = "testPassword";
      let choice = "password";
      vote(votes, choice);
      if (votes[choice] > winningVotes)
      {
        winner = choice;
        winningVotes = votes[choice];
      }
    }
    else if ( (name.indexOf("card") !== -1 && name.indexOf("num") !== -1)
           || (value.indexOf("card") !== -1 && value.indexOf("num") !== -1))
    {
      //field.value = "4916252669881577";
      let choice = "cardnumber";
      vote(votes, choice);
      if (votes[choice] > winningVotes)
      {
        winner = choice;
        winningVotes = votes[choice];
      }
    }
    else if ( (name.indexOf("expir") !== -1 && name.indexOf("date") !== -1)
           || (value.indexOf("expir") !== -1 && value.indexOf("date") !== -1))
    {

      let choice = "expiryDate";
      vote(votes, choice);
      if (votes[choice] > winningVotes)
      {
        winner = choice;
        winningVotes = votes[choice];
      }
    }
    else if ((name.indexOf("csc") !== -1 || value.indexOf("csc") !== -1)
          || (name.indexOf("cvv") !== -1 || value.indexOf("cvv") !== -1))
    {
      //field.value = 123;
      let choice = "csc";
      vote(votes, choice);
      if (votes[choice] > winningVotes)
      {
        winner = choice;
        winningVotes = votes[choice];
      }
    }
    else if (name.indexOf("name") !== -1 || value.indexOf("name") !== -1)
    {
      //field.value = "Fake Name";
      let choice = "name";
      vote(votes, choice);
      if (votes[choice] > winningVotes)
      {
        winner = choice;
        winningVotes = votes[choice];
      }
    }
    else if ( (name.indexOf("user") !== -1 && name.indexOf("name") !== -1)
           || (value.indexOf("user") !== -1 && value.indexOf("name") !== -1))
    {
      //field.value = "FakeUser";
      let choice = "username";
      vote(votes, choice);
      if (votes[choice] > winningVotes)
      {
        winner = choice;
        winningVotes = votes[choice];
      }
    }
    else if ( (name.indexOf("post") !== -1 && name.indexOf("code") !== -1)
           || (value.indexOf("post") !== -1 && value.indexOf("code") !== -1))
    {
      //field.value = "10012";
      let choice = "postCode";
      vote(votes, choice);
      if (votes[choice] > winningVotes)
      {
        winner = choice;
        winningVotes = votes[choice];
      }
    }
    else if ( (name.indexOf("zip") !== -1 && name.indexOf("code") !== -1)
           || (value.indexOf("zip") !== -1 && value.indexOf("code") !== -1))
    {
      //field.value = "BN24 6RB";
      let choice = "zipCode";
      vote(votes, choice);
      if (votes[choice] > winningVotes)
      {
        winner = choice;
        winningVotes = votes[choice];
      }
    }
  }
  console.dir(votes);
  if (winningVotes > 0)
  {
    field.value = dataGenerator[winner];
  }
  else
  {
    field.value = "testValue";
  }
}

function placeholderGuess(field)
{
  if (!field.placeholder)
  {
    bruteForceGuess(field);
    return;
  }

  let placeholder = field.placeholder.toLowerCase();

  if (placeholder.indexOf("card") !== -1 && placeholder.indexOf("num") !== -1)
  {
    field.value = dataGenerator["cardnumber"];
  }
  // Expiry / Expiration
  else if (placeholder.indexOf("expir") !== -1 || placeholder.indexOf("date") !== -1)
  {
    field.value = dataGenerator["expiryDate"];
  }
  else if (placeholder.indexOf("csc") !== -1
        || placeholder.indexOf("cvv") !== -1)
  {
    field.value = dataGenerator["csc"];
  }
  else if (placeholder.indexOf("name") !== -1)
  {
    if (placeholder.indexOf("user") !== -1 )
    {
      field.value = dataGenerator["username"];
    }
    else
    {
      field.value = dataGenerator["name"];
    }
  }
  else if (placeholder.indexOf("code") !== -1)
  {
    if (placeholder.indexOf("post") !== -1)
    {
      field.value = dataGenerator["postCode"];
    }
    else
    {
      field.value = dataGenerator["zipCode"];
    }
  }
  else if (placeholder.indexOf("mail") !== -1)
  {
    field.value = dataGenerator["email"];
  }
  else if (placeholder.indexOf("address") !== -1)
  {
    field.value = dataGenerator["address"];
  }
  else if (placeholder.indexOf("city") !== -1)
  {
    field.value = dataGenerator["city"];
  }
  else if (placeholder.indexOf("state") !== -1)
  {
    field.value = dataGenerator["state"];
  }
  else if (placeholder.indexOf("county") !== -1)
  {
    field.value = dataGenerator["county"];
  }
  else
  {
    bruteForceGuess(field);
  }
}

function fillText(field)
{
  // If we know what it is then be precise, otherwise just guess
  if (field.type)
  {
    if (field.type === "password")
    {
      field.value = dataGenerator["password"];
    }
    else if (field.type === "email")
    {
      field.value = dataGenerator["email"];
    }
    else if (field.type === "text")
    {
      placeholderGuess(field);
    }
    else
    {
      bruteForceGuess(field);
    }
  }
  else if (field.placeholder)
  {
    placeholderGuess(field);
  }
  else
  {
    bruteForceGuess(field);
  }

}

function fillNumber(field)
{
  if (field.min)
  {
    field.value = field.min;
  }
  else if (field.max)
  {
    field.value = field.max;
  }
  else
  {
    field.value = 0;
  }
}

function fillRadio(field)
{
  field.checked = true;
}

function fillSelect(field)
{
  field.selectedIndex = field.options.length - 1
}

function fillInput(field)
{
  // Set as default but if we have more detailed information then use it
  field.value = "testValue";

  if (field.type)
  {
    if (field.type === "radio")
    {
      fillRadio(field);
    }
    else if (field.type === "number")
    {
      fillNumber(field);
    }
    else
    {
      fillText(field);
    }
  }
  else
  {
    fillText(field);
  }
}

function fillField(field)
{
  if (field.tagName.toLowerCase() === "select")
  {
    fillSelect(field);
  }
  else if (field.tagName.toLowerCase() === "input")
  {
    fillInput(field);
  }
  else
  {
    fillText(field);
  }

}

function fillForm(form)
{
  for (field of form)
  {
    //console.dir(field);
    if (shouldFillField(field))
    {
      fillField(field);
      //field.value = "Hello";
    }
  }
}

// Used for XMLHttpRequest onreadystatechange
function analyseFormSubmissionResponse(response, URL)
{
  let translatedBody = "";
  const reader = response.body.getReader();
  const stream = new ReadableStream({
    start(controller) {
      // The following function handles each data chunk
      function push() {
        // "done" is a Boolean and value a "Uint8Array"
        reader.read().then(({ done, value }) => {
          // Is there no more data to read?
          if (done) {
            // Tell the browser that we have finished sending data
            controller.close();
            console.dir(response);
            chrome.runtime.sendMessage({
              message: "formProcessed",
              data: {
                response: {
                  status: response.status,
                  redirected: response.redirected,
                  url: response.url,
                  body: translatedBody,
                  iniatiatorUrl: URL
                }
              }
            });
            return;
          }
          else {
            translatedBody += new TextDecoder("utf-8").decode(value);
          }

          // Get the data and send it to the browser via the controller
          controller.enqueue(value);
          push();
        });
      };

      push();
    }
  });

}

function submitFormAndSendResults(form)
{
  let URL = (form.attributes["action"] && form.attributes["action"].value) || window.location.pathname;
  let formData = new FormData(form);

  /*
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = analyseFormSubmissionResponse;
  xhttp.open("POST", URL);
  xhttp.iniatiatorUrl = URL;
  xhttp.send(formData);
  */

  console.dir(form);

  var myHeaders = new Headers();

  var myInit = {method: 'POST',
               headers: myHeaders,
               mode: 'cors',
               cache: 'default',
               body: formData};

  var myRequest = new Request(URL);

  fetch(myRequest, myInit).then(function (response) {
    // #ToDo: maybe analyse response for redirects
    analyseFormSubmissionResponse(response, URL);
  });

}

function shouldFillField(field)
{
  let res = true;
  if(field.type)
  {
      res &= field.type !== "hidden";
      res &= field.type !== "submit";
      res &= field.type !== "button";
  }
  return res;
}

function shouldCheckForm(form)
{
  result = true;

  if (form.id && typeof(form.id) === "string")
  {
    result &= (form.id.indexOf("search") === -1)
  }

  if (form.role)
  {
    result &= (form.role.indexOf("search") === -1)
  }
  return result;
}

//console.dir(document.forms);
for (form of document.forms)
{
  if (shouldCheckForm(form))
  {
    fillForm(form);
    submitFormAndSendResults(form);
  }
}
