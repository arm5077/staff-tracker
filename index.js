var express = require("express");
var app = express();
var Spreadsheet = require('edit-google-spreadsheet');
var mysql = require("mysql");

// Turn on server
var port = process.env.PORT || 3000;
app.listen(port, function(){
	console.log("We're live at port " + port + ".");
});


// Set up static page (main page)
app.use("/", express.static(__dirname + "/public/"));

// Return 2016 candidates
app.get("/api/candidates", function(request, response){
	var connection = connectMySQL();
	
	connection.query("SELECT employer as name, party, count(employer) as count FROM history JOIN candidates ON candidates.name=history.employer WHERE year = 2016 GROUP BY name ORDER BY count DESC", function(err, rows, header){
		if(err) throw err;		
		response.status(200).json(rows);
		connection.end();
	});
	
});

// Return 2016 staffers
app.get("/api/staffers", function(request, response){
	var connection = connectMySQL();
	
	connection.query("SELECT name, MID(name,LOCATE(' ', name) + 1, 100) as lastName from history GROUP BY name ORDER BY lastName ASC", function(err, rows, header){
		if(err) throw err;		
		response.status(200).json(rows);
		connection.end();
	});
	
});

// Return prior organizations
app.get("/api/organizations", function(request, response){
	var connection = connectMySQL();
	
	connection.query("SELECT employer as name from history WHERE year < 2016 GROUP BY employer ORDER BY employer ASC", function(err, rows, header){
		if(err) throw err;		
		response.status(200).json(rows);
		connection.end();
	});
	
});


// Return a profile page for an organization
app.get("/api/organization/:organization", function(request, response){
	var connection = connectMySQL();
	
	connection.query("SELECT * FROM history WHERE employer = ? AND year != 2016 GROUP BY history.name", [request.params.organization], function(err, rows, header){
		if(err) throw err;
		
		if( rows.length == 0 ){
			response.status(200).json([]);
		}
		else {
			
		
			
			var names = "";
			var years = {}
			var staff = [];
			rows.forEach(function(row){
				years[row.name] = row.year;
				names += " OR history.name = '" + row.name.replace("'", "\\'") + "'";
			});
			
			// Query now for 2016 campaigns with these people, joining to the 2016 candidate table
			// so we avoid extraneous results.
			connection.query("SELECT * FROM history LEFT JOIN (select name as candidate from candidates) as candidates on history.employer = candidates.candidate WHERE year = 2016 AND (" + names.slice(4) + ")", function(err, rows, header){
			 	if(err) throw err;
				var temp = {}
				rows.forEach(function(row){
					if( row.candidate ){
						if( !temp[row.employer] ) 
							temp[row.employer] = [];
						temp[row.employer].push({name: row.name, year: years[row.name]});
						staff.push({name: row.name, year: years[row.name], employer: row.employer});
					}
				});

				var exportArray = [];
				for( employer in temp ){
					exportArray.push({name: employer, count: temp[employer].length, staffers: temp[employer]});
				}

				exportArray.sort(function(a,b){
					return b.count - a.count;
				});
			
				// Let's sort these records by last name.
				staff.sort(function(a,b){
					if( b.name.slice(b.name.indexOf(" ") + 1) > a.name.slice(a.name.indexOf(" ") + 1) )
						return -1;
					else
						return 1;
				});
			
				response.status(200).json({staffers: staff, candidates: exportArray});
				

			});
		}
	});
	
});

// Return listing of previous organizations staffers have worked at
app.get("/api/network/:candidateName", function(request, response){
	var connection = connectMySQL();
		connection.query("SELECT * FROM history WHERE employer = ? and year = 2016", [request.params.candidateName], function(err, rows, header){
		console.log("SELECT * FROM history WHERE employer = '" + request.params.candidateName + "' and year = 2016")
		if(err) throw err;
		var names = "";
		rows.forEach(function(row){
			names += " OR name = '" + row.name.replace("'", "\\'") + "'";
		});
		
		connection.query("SELECT * FROM history WHERE ((" + names.slice(4) + ")) ORDER BY year DESC", function(err, rows, header){
			var staffers = [];
			var employers = [];
			var exportArray = {staffers: [], employers: []};

		
			
			if(rows){
				// Aggregate first by employee, then by employer
				rows.forEach(function(row){
					if( !staffers[row.name] ){
						staffers[row.name] = {name: row.name, position: row.position, twitter: row.twitter, linkedin: row.linkedin, outsideGroup: row.outside_group != null, employers: [] };
					}			
					if(row.year != 2016)
						staffers[row.name].employers.push({year: row.year, name:row.employer});
					
					// Employer section
					if(row.year != 2016){	
						if( !employers[row.employer] )
							employers[row.employer] = {name: row.employer, staffers: []};
						
						if( employers[row.employer].staffers.indexOf(row.name) == -1 && row.year != 2016 )
							employers[row.employer].staffers.push(row.name)
					}
				});

			}
			
			for( staffer in staffers){
				exportArray.staffers.push(staffers[staffer]);
			}
			
			for( employer in employers ){
				exportArray.employers.push(employers[employer]);
			}
			
			exportArray.employers.sort(function(a,b){
				return b.staffers.length - a.staffers.length;
			});
			
			connection.end();
			response.status(200).json(exportArray);
		});
	});
});

// Return biographical information about a person
app.get("/api/staffer/:stafferName", function(request, response){
	var connection = connectMySQL();
	
	connection.query("SELECT * FROM history WHERE name = ?", [request.params.stafferName], function(err, rows, header){
		if( err ) throw err;
		
		// Check to see if this person has resigned
		connection.query("SELECT action, date FROM feed WHERE name = ? ORDER BY date DESC", [request.params.stafferName], function(err, countrows, header){
			
			if(countrows[0].action == "leaves")
				var resigned = true;
			
			var history = [];

			rows.forEach(function(row){
				history.push({ year: row.year, employer: row.employer, resigned: (resigned && row.year == 2016) ? "true" : "false" });
			});

			connection.end();
			console.log(rows);
			response.status(200).json({
				name: request.params.stafferName,
				position: rows[0].position,
				linkedin: rows[0].linkedin,
				twitter: rows[0].twitter,
				outsideGroup: rows[0].outside_group != null,
				history: history
			});
		});
	});	
});

// Return feed of hirings, by data and by person
app.get("/api/feed", function(request, response){
	
	var connection = connectMySQL();
	
	connection.query("SELECT feed.name as name, feed.employer, action, date, year, candidates.party FROM feed LEFT JOIN candidates on feed.employer = candidates.name", function(err, rows, header){
		if( err ) throw err;
		var temp = {};
		
		rows.forEach(function(row){
			if( !temp[row.name] )
				temp[row.name] = {};
				
			if( !temp[row.name][row.date])
				temp[row.name][row.date] = [];
			temp[row.name][row.date].push({date: row.date, year: row.year, action: row.action, employer: row.employer, party: row.party});
		});
		
		var exportArray = []; 
		
		for( key in temp){
			if( temp.hasOwnProperty(key) ){
				
				
				
				for(date in temp[key]){
					temp[key][date].sort(function(a,b){ b.date - a.date });
					var joins = "", leaves = "";
					temp[key][date].forEach(function(move){
						if(move.action == "joins") joins = move.employer;
						if(move.action == "leaves") leaves = move.employer;
					});
					
					if(temp[key][date][1]) console.log( temp[key][date][1]);					
					
					exportArray.push({
						name: key,
						date: date,
						year: temp[key][date][0].year,
						joining: joins,
						leaving: leaves, 
						party: temp[key][date][1] ? temp[key][date][1].party : temp[key][date][0].party
					});
				};
			}
		}
			
		// Sort from newest to oldest
		exportArray.sort(function(a,b){
			return new Date(b.date) - new Date(a.date);
		});
		
		connection.end();
		
		response.status(200).json(exportArray);
		
	});
	
	
});

// Launch scraper
app.get("/api/scrape", function(request, response){	
	

	
	var spreadsheet_email = process.env.SPREADSHEET_EMAIL;
	var spreadsheet_key = process.env.SPREADSHEET_KEY;
	
	var completed = 0;
	var outstanding = 0;
	var timeout = 0;
	
	var connection = connectMySQL();
	
	// Truncate existing tables
	connection.query('TRUNCATE TABLE feed', function(err, rows, header){ console.log("Truncated feed"); if( err ) throw err; });
	connection.query('TRUNCATE TABLE history', function(err, rows, header){ console.log("Truncated history"); if( err ) throw err; });
	connection.query('TRUNCATE TABLE candidates', function(err, rows, header){ console.log("Truncated history"); if( err ) throw err; });
	
	connection.end();
	
	// Pop open the candidate master list spreadsheet
	// Pop open the source spreadsheet
	Spreadsheet.load({
		debug: true,
		spreadsheetName: "Staffer Tracker",
		worksheetName: "Candidates",
		oauth: {
			email: spreadsheet_email,
			key: spreadsheet_key
		}
	}, function(err, spreadsheet){
		if( err ) throw err;
		
		var connection = connectMySQL();
		
		spreadsheet.receive({getValues: true}, function(err, rows, info) {
			if( err ) throw err;
			// Cycle through spreadsheet and create new object
			data = makeObjectFromSpreadsheet(rows);
			
			// Start checker to see if we're done computing
			var success = 0;
			var checker = setInterval(function(){
				console.log(outstanding);
				if( outstanding === 0 )
					success++;
				else
					success = 0;

				if( success == 5 ){
					response.status(200).json({ message: "done" });
					clearInterval(checker);
				}

			},1000);
			
			
			data.forEach(function(candidate){
				if( candidate.party ){
					
					outstanding++;
					connection.query('INSERT INTO candidates (name, party) VALUES (?,?)', [candidate.name, candidate.party], function(err){
						if(err) throw err;
						outstanding--;
					});
				}
			});
			
			connection.end();

		});

		
	});
	
		
	// Pop open the source spreadsheet
	Spreadsheet.load({
		debug: true,
		spreadsheetName: "Staffer Tracker",
		worksheetName: "All Data",
		oauth: {
			email: spreadsheet_email,
			key: spreadsheet_key
		}
	}, function(err, spreadsheet){
		if( err ) throw err;
		spreadsheet.receive(function(err, rows, info) {
			if( err ) throw err;
			
			var connection = connectMySQL();
			
			// Cycle through spreadsheet and create new object
			data = makeObjectFromSpreadsheet(rows);
			// Split 2016 employers and hire dates into arrays
			data.forEach(function(data){
			//	console.log(data["Date Hire/Resignation Known"]);
				data.dates = String(data["Date Hire/Resignation Known"]).split(",");
				data.employers = data["2016"].split(",");
			});
			
			// Let us first compile 2016 comings and goings
			data.forEach(function(data){
				data.dates.forEach(function(date, i){
					
					// So sometimes a date is an actual date, and sometimes it's just a year.
					// If it's a year, we want to store it differently on the server.
					if( date.length > 4){
						date = new Date(date);
						date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate());
					} else {
						var year = (date == '') ? null : date;
						date = null;
					}
					
					if( date != "NaN-NaN-NaN" && date != null ){
						// Check if this is a "joining" entry
						if( !data.employers[i] ){	
							outstanding++;				
							connection.query('INSERT INTO feed (name, employer, action, date, year) VALUES (?,?,?,?,?)', 
								[data.Staffer.trim(),
								data.employers[i-1].trim(),
								"leaves",
								date,
								year],
							function(err, rows, header){ 
								if( err ) throw err;
								outstanding--;
							//	console.log(date + ": " + data.Staffer + " joins " + data.employers[i]);
							});
						}
						
						if( data.employers[i]){	
							outstanding++;				
							connection.query('INSERT INTO feed (name, employer, action, date, year) VALUES (?,?,?,?,?)', 
								[data.Staffer.trim(),
								data.employers[i].trim(),
								"joins",
								date,
								year],
							function(err, rows, header){ 
								if( err ) throw err;
								outstanding--;
							//	console.log(date + ": " + data.Staffer + " joins " + data.employers[i]);
							});
						}

						// Check if is a "leaving" entry
						if( data.employers[i + 1]){
							outstanding++;
							connection.query('INSERT INTO feed (name, employer, action, date, year) VALUES (?,?,?,?,?)', 
								[data.Staffer.trim(),
								data.employers[i+1].trim(),
								"leaves",
								date,
								year],
							function(err, rows, header){ 
								if( err ) throw err;
								outstanding--;
							//	console.log(date + ": " + data.Staffer + " leaves " + data.employers[i+1]);
							});
						}	
					}
				});
			});
			
			// Now, it is time to compile a storied history
			data.forEach(function(data){
				for(year = 2016; year >= 1968; year--){
					
					if( year == 2016 ) position = data["Title/Responsibility"];
						else position = null;
					
					if( data[year.toString()] ){
						data[year.toString()].split(",").forEach(function(job){							
							outstanding++;
							connection.query('INSERT INTO history (name, year, employer, position, twitter, linkedin, outside_group) VALUES (?,?,?,?,?,?,?)',
								[data.Staffer.trim(),
								year,
								job.trim(),
								position,
								data["Twitter (URL)"],
								data["LinkedIn (URL)"],
								data["PAC/non-profit?"]
								],
						 	function(err, rows, header){
								if( err ) throw err;
								outstanding--;
							});
						});
					}
				}
				
			});
			
			connection.end();
			
		});
	});	
});

function makeObjectFromSpreadsheet(rows){
	export_array = [];
	fields = [];
	for( var row in rows ){
		if( rows.hasOwnProperty(row) ){
			var object = {};
			for( var column in rows[row] ){
				if( rows[row].hasOwnProperty(column) ){
					if( row == "1" ){
						fields.push(rows[row][column]);
					}
					else {
						object[fields[column - 1]] = rows[row][column];
					}
				}
			}
			if(row != 1) export_array.push(object);
		}
	}
	return export_array;
}

function connectMySQL(){
	// Open connection to mySQL database
	var connection = mysql.createConnection(process.env.CLEARDB_DATABASE_URL || "mysql://root@localhost/stafftracker");
	connection.on("error", function(err){  
		connection.end();
		 return setTimeout(function(){ return connectMySQL() },3000);
	});

	connection.connect( function(err){ if(err) throw err; });
	
	return connection;
}
