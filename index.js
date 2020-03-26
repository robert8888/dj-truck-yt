
const YtSearch = require("./yt-search");

const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();

const mainPageTemplate = `
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

app.use(cors());

//pretty json reponse /rm on producition
//app.set('json spaces', 2);

app.listen(process.env.PORT || 80, ()=>{
    console.log('Helow serwer started on port 80 ...');
})

app.get('/', (req, res)=>{
    res.send(mainPageTemplate);
})

app.get('/reset', (req, res)=>{
    currentApi = 0;
})

app.get('/download', (req, res) => {
    let URL = req.query.url;
    let ID = req.query.id;
    const format = 'mp3'; 
    let filename = "testName." + format;
    res.header('Content-Dispositon', 'attachment' , filename = filename);

    let videoID = ID || ytdl.getURLVideoID(URL);
    ytdl(URL, {
         quality: 'highestaudio', filter: 'audioonly' 
    }).pipe(res)

})


app.get('/search', (req, res) =>{
    let query = req.query.q;
    let maxResults = req.query.maxResults || 5;
    YtSearch.get(query, maxResults).then( json => {
        res.json(json)
    } );
})


