var express = require('express');
var app = express();
var elasticsearch = require('elasticsearch');
var bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var client = new elasticsearch.Client({
    host: "http://localhost:9200/"
});



// Create a table for elastic search
client.indices.create({
    index: 'essearch'
}, function (err, resp, status) {
    if (err) {
        console.log("table already exists.");
    }
    else {
        console.log("create", resp);
    }
});



app
    .post('/product', function (req, res, next) {
        var title = req.body.title;

        //add a document to an index
        client.index({
            index: "essearch",
            type: "es",
            body: {
                "title": title
            }
        }, function (err, resp, status) {
            console.log(resp);
            res.send({ status: 200, title: title });
        });

    })
    .get('/product', function (req, res, next) {
        console.log(req.query);
        let searchKey = req.query.search;

        let __body = {}
        if (searchKey) {
            __body = {
                "query": {
                    "function_score": {
                        "query": {
                            match: { title: searchKey }          // Change this to query as per your need
                        },
                        "functions": [
                            {
                                "filter": { "match": { "title": searchKey } },
                                "random_score": {},  // Calculate the random value, for more improvement we can use score_function
                            }
                        ],
                        "score_mode": "sum", // 
                    }
                },
                "sort": [
                    {
                        "_score": {
                            "order": "desc"
                        }
                    }
                ]
            }

        }

        client.search({
            index: "essearch",
            type: "es",
            body: __body
        }, function (err, resp, status) {
            if (err) {
                console.log("error", err)
            }
            else {
                res.send(resp.hits.hits)
            }
        });
    });


app.listen(3000, function () {



    console.log('listening on port 3000');


    // ELASTIC SEARCH INFORMATION
    client.cluster.health({}, function (err, resp, status) {
        console.log("-- Client Health --", resp);
    });

    console.log('--------------------------------------');
    console.log('--------------------------------------');
    console.log('--------------------------------------');
    console.log('--------------------------------------');
    console.log('--------------------------------------');
    console.log('--------------------------------------');

    client.count({ index: 'essearch', type: 'es' }, function (err, resp, status) {
        console.log("es", resp);
    });


})


