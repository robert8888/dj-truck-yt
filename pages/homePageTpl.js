module.exports= `
<html lang="en">
<head>
  <meta charset="utf-8">

  <title>The HTML5 Herald</title>
  <meta name="description" content="Api doc">
  <meta name="author" content="Api doc">
  <script>
    function download(){
        let link = document.getElementById('link').value;
        window.location.href="/download?url="+link;
        console.log(link);
    }
  </script>
  <style>
    body{
      padding:20px;
    }
    *{
      letter-spacing: 1px;
    }
    ul li {
      margin: 10px 0;
    }
    div{
      margin-left: 30px;
    }
  </style>
</head>

<body>
    <ul>
      <li> Use: /api/search?q="search query" optional: &maxResults=5 to revie JSON youtbe search result </li>
      <li> Use: /api/download ?url= or ?id= to recive direct mp3 file </li>
      <li> Use: /api/stream  ?url= or ?id= support partial content header </li>
    </ul>
    <div>
      <input id="link" type="text" style="width:400px">
      <button onclick="download()">Download</>
    <div>
</body>
</html>`;

