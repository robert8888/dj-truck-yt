


const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();
const ytSearch = require("./yt-search");

const {mainPageTemplate: homePageTemplate} = require("./mainPageTpl");

app.use(cors());

//pretty json reponse /rm on producition
//app.set('json spaces', 2);



app.get('/', (req, res)=>{
    res.send(homePageTemplate);
})

app.get('/download', (req, res) => {
    let _url = req.query.url;
    let _id = req.query.id;
    const format = 'mp3'; 
    let filename = "testName." + format;
    res.header('Content-Dispositon', 'attachment' , filename = filename);

    let videoID = _id || ytdl.getURLVideoID(_url);
    ytdl(_url, {
         quality: 'highestaudio', filter: 'audioonly' 
    }).pipe(res)

})

app.get('/search', (req, res) =>{
    let query = req.query.q;
    let maxResults = req.query.maxResults || 5;
    ytSearch.get(query, maxResults).then( json => {
        console.log(json)
        res.json(json)
    } );
})

app.listen(process.env.PORT || 80, ()=>{
    console.log('Helow serwer started on port 80 ...');
})
