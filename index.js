var express = require("express");
var app = express();
var Spreadsheet = require('edit-google-spreadsheet');
var mysql = require("mysql");

// Turn on server
var port = process.env.PORT || 3000;
app.listen(port, function(){
	console.log("We're live at port " + port + ".");
});

app.get("/employment", function(request, response){
	response.status(200).json({ response: "Yeppp!" });
});