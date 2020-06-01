
const express  = require("express");
const router = express.Router();
const searchModule = require("./module")

router.get('/search', (req, res) =>{
    let query = req.query.q;
    let maxResults = req.query.maxResults || 5;
    searchModule.get(query, maxResults).then( json => {
        console.log(json)
        res.json(json)
    } );
})

module.exports = router;