require("dotenv").config()

const express = require('express');
const cors = require('cors');

const app = express();

const search = require("./api/search/search");
const download = require("./api/download");
const stream = require("./api/stream");

const homePageTemplate = require("./pages/homePageTpl");

app.use(cors());


if(process.env.NODE_ENV === "development"){
    app.set('json spaces', 2);
}

app.use("/api", download);
app.use("/api", search);
app.use("/api", stream);

app.get('/', (req, res)=>{
    res.send(homePageTemplate);
})

const PORT =  process.env.PORT || 80;
app.listen(PORT, ()=>{
    console.log(`Hello server started on port ${PORT} ...`);
})
