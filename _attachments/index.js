var runInfo = [];
var machineInfo = [];
var MachineDataList = [];
var SkeletonDBList = [];
var LabjackList = [];
var historyList = [];
var gHTMLTimerID;
var firstLoad = true;
var updateMachineInfoTimer;
var FoundALabjack = false;
var FoundAOrca = false;
var FoundASkeleton = false;


$(document).ready( function() {	
	collectDBs();
	updateHTML();
});

function collectDBs() {
	clearInterval(updateMachineInfoTimer);
    $.couch.allDbs( { success : function(dbs) { loadDBList(dbs); } });
    updateMachineInfoTimer = setInterval('collectDBs()', 2000);
}

function loadDBList(dbs) {
    dbs.forEach(function(db1) {
        var aDB = $.couch.db(db1);
        aDB.allDocs({ keys : ['machineinfo', 'runinfo'] ,   // for ORCA  
			success: function(data) {
				for (var i in data.rows) {
					if (data.rows[i]['error']) return;
                }
				foundMachineData(db1);
                updateMachineInfo(db1);
		}});
		aDB.allDocs( { keys : ['Parameter'] , 				// for data generator 
			success: function(data) {
				for(var i in data.rows) {
					if (data.rows[i]['error']) return;
				}
				foundSkeleton(db1);
		}, error : function(data){$.log(data);}});
        if(db1.match("history")){							// for ORCA
			foundHistory(db1);
        }
//		aDB.allDocs( { keys : ['ControlDoc'] , 				// for Labjack
//			success: function(data) {
//				for(var i in data.rows) {
//					if (data.rows[i]['error']) return;
//				}
//				foundLabJack(db1);
//		}, error : function(data){$.log(data);}});			// this method requires a lot of ressources, 
// 		when the databases contain huge amoutns of documents, better name the database after the devices: 

		if(db1.match("labjack")){							// for LabJack
			foundLabJack(db1);
		}
    });
}

function updateMachineInfo(aDataBaseName) {    

    var aDataBase = $.couch.db(aDataBaseName);
    aDataBase.view(aDataBaseName +"/machineinfo",{success: function(doc) { 
        machineInfo[aDataBaseName] = doc.rows[0].value
    }});
    aDataBase.view(aDataBaseName +"/runinfo",    {success: function(doc) { 
       runInfo[aDataBaseName] = doc.rows[0].value
    }});
}

function foundMachineData(aDataBaseName) {
	FoundAOrca = true;
	var aDataBase = $.couch.db(aDataBaseName);
	aDataBase.view(aDataBaseName+"/counts", { success : function(doc) {
		MachineDataList[aDataBaseName] = [];
		for (var i in doc.rows) {
			var temparray = doc.rows[i].key.split(',');
			if (MachineDataList[aDataBaseName][temparray[0]] == undefined) {
				MachineDataList[aDataBaseName][temparray[0]] = new Object();
			}
			if (MachineDataList[aDataBaseName][temparray[0]][temparray[1]] == undefined) {
				MachineDataList[aDataBaseName][temparray[0]][temparray[1]] = new Object();
			}
			if (MachineDataList[aDataBaseName][temparray[0]][temparray[1]][temparray[2]] == undefined) {
				MachineDataList[aDataBaseName][temparray[0]][temparray[1]][temparray[2]] = new Object();
			}
		}
	}});
}

function foundSkeleton(aDataBaseName) {
	FoundASkeleton = true;
	getView(aDataBaseName,"Skeleton/bykey",SkeletonDBList);
}

function foundLabJack(aDataBaseName) {
	FoundALabjack = true;
	getView(aDataBaseName,"Labjack/bykey", LabjackList);
}

function foundHistory(aDataBaseName) {
	FoundAOrca = true;
	getView(aDataBaseName,aDataBaseName+"/ave",historyList);
}

function getView(aDataBaseName,aViewName,progarray) {
// this adds the found devices to the array of the program source, e.g. the LabjackList, in updateHTML this list will be rendered to HTML 
// javascript allows to name the different subarrays, with help of objects
// therefore it gets the structure like a tree: databasename(Labjacks)-devicetype(Labjack_for_valves)-devicename(valve1)
	var aDataBase = $.couch.db(aDataBaseName);
	
	aDataBase.view(aViewName, {group_level : 2, stale : 'update_after', success : function(doc) {
		progarray[aDataBaseName] = [];
		for (i in doc.rows) {
			if (progarray[aDataBaseName][doc.rows[i].key[0]] == undefined) {
				progarray[aDataBaseName][doc.rows[i].key[0]] = new Object();
			}
			progarray[aDataBaseName][doc.rows[i].key[0]][doc.rows[i].key[1]] = new Object();
		}
	}});
}

function updateHTML() {
// this functions renders the Lists of devices to HTML collapsible list
	
    var content = '<ul  class="collapsibleList">';
    var count = 0;
    if (FoundAOrca) {
    	content += '<li><a class="menu" href="#">Orca</a><ul>'
		for (var dbName in MachineDataList) {
		    count = count+1;
		    content += '<li><a class="MachineInfo" href="#'+dbName+'">' + dbName + '</a>';
			content +='<ul>';
			for (var device in MachineDataList[dbName]) {
				content += '<li><a class="menu" href="#">' + device +'</a>';
				content += '<ul>';
				for (var Card in MachineDataList[dbName][device]) {
					content += '<li><a class="menu" href="#">' + Card + '</a>';
					content += '<ul>';
					for (var Channel in MachineDataList[dbName][device][Card]) {
						content += '<li class="MachineInfoPlot"><a href="#">' + Channel + '</a></li>';
					}
					content += '</li></ul>';
				}
				content += '</li></ul>';
			}
			content +='</li></ul>';
		}
		for (var dbName in historyList) {
			count = count+1;
			content += '<li><a class="menu" href="#">' + dbName + '</a>';
			content +='<ul>';
			for (var title in historyList[dbName]) {
				content += '<li><a class="menu" href="#">' + title + '</a>';
				content += '<ul>';
				for (var deviceName in historyList[dbName][title]) {
					content += '<li class="History"><a href="#'+dbName+'-'+title+'-'+deviceName+'">' + deviceName + '</a></li>';
				}
				content += '</li></ul>';
			}
			content +='</li></ul></li>';
		}
		content += '</ul>';
	}
  	if (FoundASkeleton) {
  		content += '<li><a class="menu" href="#">Skeleton</a><ul>';
		for (var dbName in SkeletonDBList) {
			count = count+1;
			content += '<li><a class="menu" href="#">' + dbName +'</a>';
			content +='<ul>';
			for (var deviceType in SkeletonDBList[dbName]) {
				content += '<li><a class="menu" href="#">' + deviceType + '</a>';
				content += '<ul>';
				for (var deviceName in SkeletonDBList[dbName][deviceType]) {
					content += '<li class="Skeleton"><a href="#'+dbName+'_'+deviceType+'_'+deviceName+'">' + deviceName + '</a></li>';
				}
				content += '</li></ul>';
			}
			content +='</li></ul>';
		}
		content +='</ul></li>';
	}
	if (FoundALabjack) {
		content += '<li><a class="menu" href="#">Labjacks</a><ul>';
		for (var dbName in LabjackList) {
			count = count+1;
			content += '<li><a class="menu" href="#">' + dbName +'</a>';
			content +='<ul>';
			for (var deviceType in LabjackList[dbName]) {
				content += '<li><a class="menu" href="#">' + deviceType + '</a>';
				content += '<ul>';
				for (var deviceName in LabjackList[dbName][deviceType]) {
					content += '<li class="Labjack"><a href="#'+dbName+'_'+deviceType+'_'+deviceName+'">' + deviceName + '</a></li>';
				}
				content += '</li></ul>';
			}
			content +='</li></ul>';
		}
		content += '</ul></li>';
	}
	content += '<li id="stop"><a href=#stop>Stop Updating</a></li>';
	
	// Labview, etc?
	
	content += "</ul>";
    if(count>0){
		clearInterval(gHTMLTimerID);
		clearInterval(updateMachineInfoTimer);
        document.getElementById('machineList').innerHTML = content;
		documentReadyFunction();
    }
	else {
		clearInterval(gHTMLTimerID);
	    gHTMLTimerID = setInterval('updateHTML()', 2000);
        if(firstLoad){
            document.getElementById('machineList').innerHTML = "Loading";
            firstLoad = false;
        }
        else {
            document.getElementById('machineList').innerHTML = "There are no ORCAs or Datagens in this database";
        }
    }
}

function updateLabJack() {
// this function decides, what happens if the user clicks on a Labjack device
	$(".Labjack a").on("click", function() {
	// first it extracts the information about the device from the href
		var newarray = $(this).attr('href').slice(1).split("_"); 
		var dbName = newarray[0];
		var devicetype = newarray[1];
		var devicename = newarray[2];
	// and handles different function for AINs and DACs
		if (devicetype == 'AINs') {
			getAIN(dbName,devicetype,devicename);
		}
		if (devicetype == 'DACs') {
			getParameters(dbName,devicetype,devicename,'ControlDoc','Labjack')
		}
	});
}

function updateSkeletonData() {
// this function decides, what happens if the user clicks on a data generator device
	$(".Skeleton a").on("click", function() {
		
		var newarray = $(this).attr('href').slice(1).split("_");
		getParameters(newarray[0],newarray[1],newarray[2],'Parameter','skeleton')
	});
}

function updateHistoryData() {
// this function decides, what happens if the user clicks on a History Orca device
	$(".History a").on("click", function() {
		var newarray = $(this).attr('href').slice(1).split("-"); 
		var dbName = newarray[0];
		var title = newarray[1];
		var devicename = newarray[2];
		$.get('history.html', function(template) {
		    var html = Mustache.to_html(template, {foo : 'bar'});
			$('#DataMonitor').html(html);
			automaticupdate = false;
			setUpChart(title+'_'+devicename);
			getData(title,devicename,dbName,'orcahistory');
		
		});
	});
}

function getAIN(dbName,devicetype,devicename) {
// gets the parameters from ControlDoc for the AIN, here it's only the updatefrequency and renders a HTML page with help of a template and Mustache
	$.couch.db(dbName).openDoc('ControlDoc', {
		success : function(data) {
				$.get('AIN.html', function(template) {
				    var html = Mustache.to_html(template, { devicetype : devicetype,devicename : devicename, dbName : dbName, sourcetype : 'Labjack', updatefrequency : data['updatefrequency'], doc : JSON.stringify(data)});
					$('#DataMonitor').html(html);
				});
		}});
}

function getParameters(dbname,devicetype,devicename, ControlDocName,source) {
// gets the parameters from a given doc (ControlDocName) and render the created parameter list to a HTML with Mustache
	parameterlist = [];
	$.couch.db(dbname).openDoc(ControlDocName, {
		success : function(data) {
			for(i in data[devicetype][devicename]) {
				parameterlist.push({'parameter' : i, 'value' : data[devicetype][devicename][i],'devicename' : devicename, 'devicetype' : devicetype});
				mustachelist = { parameters : parameterlist, devicename : devicename, devicetype : devicetype, dbName : dbname, doc : JSON.stringify(data),sourcetype : source, ControlDocName : ControlDocName};
			}
			$.get('parameter.html', function(template) {
			    var html = Mustache.to_html(template, mustachelist);
				$('#DataMonitor').html(html);
			});
			$("#stop,#Last5MinButton").on("click", function() {changes.stop();});
		},
		error : function(status) {
			$.log(status);
			$('#DataMonitor').html('<p> No view found');
		}
	});
}

function documentReadyFunction() {
	CollapsibleLists.apply();
	updateSkeletonData();
	updateHistoryData();
	updateLabJack();
}
