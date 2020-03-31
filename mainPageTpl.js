module.exports.mainPageTemplate = `
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
</head>

<body>
    <ul>
    <li> Use : /download?url="youtube watch link" to recive direct mp3 file </li>
    <li> Use: /search?q="yout search  string" optional: &maxResults=5 to revie JSON youtbe search result </li>
    </ul>
    <input id="link" type="text" style="width:200px">
    <button onclick="download()">Download</>
</body>
</html>`;

