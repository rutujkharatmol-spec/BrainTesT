const url = "https://script.google.com/macros/s/AKfycbxqJmheqVl-LrTcWjKArwAHV2cLfOILP7IpZJuTqOwTkFEADS2fZwoSM5ao7dYR3Q6i4g/exec";

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ test: "test" })
}).then(res => {
  console.log("Status:", res.status);
  console.log("StatusText:", res.statusText);
  return res.text();
}).then(text => {
  console.log("Body:", text);
}).catch(console.error);
