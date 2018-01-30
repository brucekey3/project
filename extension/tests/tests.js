function runTests()
{
  run_IP_regex_tests();
  alert("Tests run");
}

let testUrls = [
  {
    url: "148.163.101.199/pall",
    expected: true
  },
  {
    url: "https://r4---sn-cu-aigse.googlevideo.com/videoplayback?lmt=1516167657281451&ipbits=0&mn=sn-cu-aigse&mm=31&ip=109.150.54.170&gir=yes&pl=25&aitags=133%2C134%2C135%2C136%2C137%2C160%2C242%2C243%2C244%2C247%2C248%2C278&mime=video%2Fwebm&id=o-AMi1kX2rvOc7MNIkuS27WX7x-sXdnYgyc7HbBPms3-gd&ms=au&mv=m&sparams=aitags%2Cclen%2Cdur%2Cei%2Cgir%2Cid%2Cinitcwndbps%2Cip%2Cipbits%2Citag%2Ckeepalive%2Clmt%2Cmime%2Cmm%2Cmn%2Cms%2Cmv%2Cpl%2Crequiressl%2Csource%2Cexpire&mt=1517081003&itag=244&keepalive=yes&requiressl=yes&signature=0661FDC91AEC9833CC6F79B0573AC768E2E430CE.BFB060495695D0F5B91D7F06DB033F0D2811E86B&ei=-dFsWqWSIcjuW-KNs5gE&expire=1517102681&key=yt6&dur=1564.163&clen=96474191&initcwndbps=1358750&source=youtube&ratebypass=yes&alr=yes&cpn=a0dSW5qjztP15ZHu&c=WEB&cver=2.20180125&range=0-216033&rn=0&rbuf=0",
    expected: false
  }
];

function run_IP_regex_tests()
{
  let container = document.getElementById('container');
  let testResults = document.createElement("div");


  container.appendChild(testResults)

  let passes = 0;
  for (let i in testUrls)
  {
    let test = testUrls[i];
    let res = isPureIPAddress(test.url);

    let testDiv = document.createElement('div');
    if (test.expected == res)
    {
      passes += 1;
      console.log("PASSED: " + test.url);
      testDiv.textContent = "PASSED: " + test.url;
      testDiv.style.color = "green";
    }
    else {
      console.log("FAILED: Got: " + res + " expected: " + test.expected
                          + " for URL: " + test.url);

        testDiv.textContent = "FAILED: Got: " + res + " expected: " + test.expected
                            + " for URL: " + test.url;
        testDiv.style.color = "red";
    }
    testResults.appendChild(testDiv);
  }
  let resultsDiv = document.createElement('div');
  resultsDiv.innerHTML = "Passes = " + passes.toString()
                         + " - Fails = " + (testUrls.length - passes).toString();
  testResults.appendChild(resultsDiv);

}

document.getElementById("runTestBtn").addEventListener("click", runTests);
