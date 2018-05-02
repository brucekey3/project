function fillField(field)
{
  if (field.tagName.toLowerCase() === "select")
  {
    field.selectedIndex = field.options.length - 1
  }
  else if (field.tagName.toLowerCase() === "input")
  {
    // Set as default
    field.value = "testValue";

    // But if we have more detailed information then use it
    if (field.type)
    {
      if (field.type === "password")
      {
        field.value = "password";
      }
      else if (field.type === "email")
      {
        field.value = "testEmail@domain.com";
      }
      else if (field.type === "number")
      {
        if (field.min)
        {
          field.value = field.min;
        }
        else if (field.max)
        {
          field.value = field.max;
        }
      }

      if (field.placeholder)
      {
        let placeholder = field.placeholder.toLowerCase();
        if (placeholder.indexOf("card") !== -1 && placeholder.indexOf("num") !== -1)
        {
          field.value = "4916252669881577";
        }
        // Expiry / Expiration
        else if (placeholder.indexOf("expir") !== -1 || placeholder.indexOf("date") !== -1)
        {
          let today = new Date();
          let year = today.getFullYear() + 2;
          let month = today.getMonth();
          field.value = month + "/" + year;
        }
        else if (placeholder.indexOf("csc") !== -1)
        {
          field.value = 123;
        }
        else if (placeholder.indexOf("name") !== -1)
        {
          field.value = "Fake Name";
        }
        else if (placeholder.indexOf("post") !== -1
              && placeholder.indexOf("code") !== -1)
        {
          field.value = "10012";
        }
      }

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
