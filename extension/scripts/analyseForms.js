function fillField(field)
{
  if (field.tagName.toLowerCase() === "select")
  {
    field.selectedIndex = field.options.length - 1
  }
  else if (field.tagName.toLowerCase() === "input")
  {
    if (field.type === "password")
    {
      field.value = "password";
    }
    else if (field.type === "email")
    {
      field.value = "testEmail@domain.com";
    }
    else
    {
      field.value = "testValue";
    }
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
    console.dir(response);
    chrome.runtime.sendMessage({
      message: "formProcessed",
      data: {
        response: {
          status: response.status,
          redirected: response.redirected,
          url: response.url,
          body: response.body,
          iniatiatorUrl: URL
        }
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

  if (form.id)
  {
    result &= form.id.indexOf("search") === -1
  }

  if (form.role)
  {
    result &= form.role.indexOf("search") === -1
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
