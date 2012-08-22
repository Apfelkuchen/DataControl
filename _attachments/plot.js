var automaticupdate = false; // decides if chart is updatet or not
var charts = [];
var UpdateTimer;
var currentTime = new Date();
var UTCOffset = (currentTime.getTimezoneOffset()) * 60;
var dataArray = [];
var changes;
var zoomlevel = ['no zoom'];

function Last5Mins(devicetype,devicename,db,source) {
	clearInterval(UpdateTimer);
	automaticupdate=true;
	UpdateTimer = setInterval(function(){ (UpdateAutomatic(devicetype,devicename,db,source));}, 1000);
}
	
function Last5MinsviaChangesfeed(devicetype,devicename,db,source) {
	$("#container").text("Loading..");
	theTime = new Date();
	starttime = theTime.getTime()/1000 - 5*60;
	endtime = {};
	$.couch.db(db).view("Labjack/bytime", {startkey:[devicetype,devicename,starttime], endkey:[devicetype,devicename,endtime], group_level:3,success: function(data) {
			dataArray[devicename] = [];
			for (var i in data.rows) {
				dataArray[devicename][i]= [new Date(data.rows[i].key[2]*1000), data.rows[i].value['avg']];
			}
			plotUpdateData(devicetype+'_'+devicename,devicename,0,dataArray[devicename],devicetype,db, source);
			changes = $.couch.db(db).changes();
			$("#stop,#Last5MinButton").on("click", function() {changes.stop();});
			$("#selectrange").on("submit", function() {changes.stop();});
			$("#DataMonitor").on("blur", function() {changes.stop();});
			changes.onChange(function(data) {
				for (l in data.results) {
					$.couch.db(db).openDoc(data.results[l].id, {success: function(resp) {
						if(resp['time'] != undefined) {
							while ((new Date(dataArray[devicename][0][0])).getTime() < (new Date()).getTime()-5*60*1000) {dataArray[devicename].shift();}
	   						dataArray[devicename].push([new Date(resp['time']*1000),resp[devicetype][devicename]['value']]);
	   						plotUpdateData(devicetype+'_'+devicename,devicename,0,dataArray[devicename],devicetype,db, source);
	   					}
   					}});	
				}
			});
			}});
}
function UpdateAutomatic(devicetype,devicename,db,source) {
	theTime = new Date();
	startTime = theTime.getTime()/1000 - 5*60;
	endTime = {};
	getData(devicetype,devicename,db,source,startTime,endTime);
}
 
function plotButton(devicetype,devicename,db,source,sT,eT) {
	clearInterval(UpdateTimer);
	automaticupdate = false;
	$("#container").text("Loading..");
	starttime = parseInt(sT);
	if (typeof(eT)!= 'object') {
		endtime = parseInt(eT);
	}
	else {endtime = eT;}
	getData(devicetype,devicename,db,source,starttime,endtime);
}

function getData(devicetype,devicename,db,source,starttime,endtime) {
	if (source == undefined) return;
	var startdate = new Date(starttime*1000);
	var enddate = new Date(endtime*1000);
	
	var y1 = startdate.getFullYear();
	var m1 = startdate.getMonth();
	var d1 = startdate.getDate();
	var h1 = startdate.getHours();
	var min1 = startdate.getMinutes();
	var s1 = startdate.getSeconds();
	var ms1 = startdate.getMilliseconds();
	
	var y2 = enddate.getFullYear();
	var m2 = enddate.getMonth();
	var d2 = enddate.getDate();
	var h2 = enddate.getHours();
	var min2 = enddate.getMinutes();
	var s2 = enddate.getSeconds();
	var ms2 = enddate.getMilliseconds();
	
	var grouplevel = 8;
	if ((endtime-starttime) > 3*3600) {grouplevel=7}  //  if you use 1 datapoint per second
	if ((endtime-starttime) > 10*24*3600) {grouplevel=6} // scale minutes for max range of 10 days
	// if ((endtime-starttime)/60 > 50000) {grouplevel=5}
	
	if (source == 'skeleton') {
		$.couch.db(db).view("Skeleton/bytime", {startkey:[devicetype,devicename,starttime], endkey:[devicetype,devicename,endtime], group_level:3,success: function(data) {
			var d = [];
			for (var i in data.rows) {
				d[i]= [new Date(data.rows[i].key[2]*1000), data.rows[i].value['avg']];
			}
			plotData(devicetype+'_'+devicename+'_'+db+'_'+source,devicename,0,d,devicetype,db, source);
			}});
		}
	if (source == 'Labjack') {
		$.couch.db(db).view("dataControl/bytime", {startkey:[devicetype,devicename,y1,m1,d1,h1,min1,s1,ms1], endkey:[devicetype,devicename,y2,m2,d2,h2,min2,s2,ms2], group_level:grouplevel, success: function(data) {
			var d = [];
			for (var i in data.rows) {
				for (j=0;j<8;j++) {if (data.rows[i].key[j]==undefined){data.rows[i].key[j]=0;}}
				d[i]= [new Date(data.rows[i].key[2],data.rows[i].key[3],data.rows[i].key[4],data.rows[i].key[5],data.rows[i].key[6],data.rows[i].key[7]), data.rows[i].value['avg']];
			}
			plotData(devicetype+'_'+devicename+'_'+db+'_'+source,devicename,0,d,devicetype,db, source,starttime,endtime,grouplevel);
			}});
		}
	if (source == 'orcahistory') {
		// todo: convert Unix Time to 'Orca Time' for the moment all points will be displayed 
		starttime = 0;
		endtime = {};
		// ----------------------------------------------------------------------------------
		$.couch.db(db).view(db+'/ave', {startkey:[devicetype,devicename,starttime], endkey:[devicetype,devicename,endtime], group: true, success: function(data) {
			var d = [];
			for (var i in data.rows) {
				var keys = data.rows[i].key;
				theDate = new Date(keys[2],keys[3]-1,keys[4],keys[5],keys[6],0,0);
				d[i]= [theDate.getTime() - UTCOffset*1000, data.rows[i].value['avg']];
			}
			plotData(devicetype+'_'+devicename+'_'+db+'_'+source, devicename, 0, d, devicetype, db, source);
		}});
	}
}

function updateGraph(devicetype,devicename,db,source) {
	theTime = new Date();
	starttime = theTime.getTime()/1000 - 5*60;
	endtime = {};
	$.couch.db(db).view("Skeleton/bytime", {startkey:[devicetype,devicename,starttime], endkey:[devicetype,devicename,endtime], group_level:3,success: function(data) {
			dataArray[devicename] = [];
			for (var i in data.rows) {
				dataArray[devicename][i]= [new Date(data.rows[i].key[2]*1000), data.rows[i].value['avg']];
			}
			plotData(devicetype+'_'+devicename,devicename,0,dataArray[devicename],devicetype,db, source);
			changes = $.couch.db(db).changes();
			$("#stop,#Last5MinButton").on("click", function() {changes.stop();});
			$("#selectrange").on("submit", function() {changes.stop();});
			$("#DataMonitor").on("blur", function() {changes.stop();});
			changes.onChange(function(data) {
				for (l in data.results) {
					$.couch.db(db).openDoc(data.results[l].id, {success: function(resp) {
						if(resp[devicetype][devicename]['time'] != undefined) {
							while (dataArray[devicename].length > 1000) {dataArray[devicename].shift();}
	   						dataArray[devicename].push([new Date(resp[devicetype][devicename]['time']*1000),resp[devicetype][devicename]['data']]);
	   						plotData(devicetype+'_'+devicename+'_'+db+'_'+source,devicename,0,dataArray[devicename],devicetype,db, source);
	   					}
   					}});	
				}
			});
			}});
}

function plotData(chart_name,device_name,series_number,devicedata,device_type,db,source,starttime,endtime,grouplevel) {

	if(devicedata.length == 0) {
		$('#container').text('No Data');
	}
	else {
		if(charts[chart_name]==undefined || document.getElementById('chart'+chart_name)==undefined) { // creates the div element if it's not existing
		setUpChart(chart_name,devicedata,starttime,endtime,grouplevel);
		}
		else {
		$('#chart'+chart_name).updateChart({
		  chName : chart_name,
		  deName : device_name,
		  deType : device_type,
		  sernumber : series_number,
		  data : devicedata,
	      update : 1000,
		  database : db,
		  source : source,
		  start : starttime,
		  end : endtime
	    });}
	}
}

function plotUpdateData(chart_name,device_name,series_number,devicedata,device_type,db,source) {

	if(devicedata.length == 0) {
		$('#container').text('No Data');
	}
	else {
		if(charts[chart_name]==undefined || document.getElementById('chart'+chart_name)==undefined) { // creates the div element if it's not existing
			createChartContainer(chart_name);
			$('#chart'+chart_name).renderChart({
		 	 chName : chart_name,
		 	 deType : device_type,
		  	deName : device_name,
		  	xAxisTitle : 'Time',
		  	data : devicedata,
			});
		}
		else {
		$('#chart'+chart_name).updateChart({
		  chName : chart_name,
		  deName : device_name,
		  deType : device_type,
		  sernumber : series_number,
		  data : devicedata,
	      update : 1000,
		  database : db,
		  source : source,
	    });}
	}
}

function setUpChart(chartname,dedata,starttime,endtime,grouplevel) {
// creates a chart
	temparray = chartname.split('_')
	createChartContainer(chartname);
	$('#chart'+chartname).renderDygraph({
	  chName : chartname,
	  deType : temparray[0],
	  deName : temparray[1],
	  db : temparray[2],
	  source : temparray[3],
	  xAxisTitle : 'Time',
	  data : dedata,
	  start : starttime,
	  end : endtime,
	  group : grouplevel
    });
}

function createChartContainer(chartname) {
// creates a new div element 
	$("#container").text("");
	var parentRef = document.getElementById('container');
	chartelement = document.createElement('div');
	chartelement.id = 'chart'+chartname;
	chartelement.style.width = '600px';
	chartelement.style.height = '400px';
	parentRef.appendChild(chartelement)
}

jQuery.fn.renderChart = function(attr) {
	charts[attr.chName] = new Dygraph(
		document.getElementById($(this).attr('id')),		// div Element
		attr.data, 											// Data
		{													// Chart Options
		labels: ['Time', attr.deName],
		title: "<h4>"+attr.deType+" : "+attr.deName,
		sigFigs : 3											// number of significant figures
	});
}

jQuery.fn.updateChart = function(attr) {
// updates the chart in the specified element id
	clearInterval(UpdateTimer);
	var deviceName = attr.deName;
	charts[attr.chName].updateOptions( { 'file': attr.data });
	
	if (automaticupdate) {
		UpdateTimer = setInterval(function(){
   			(UpdateAutomatic(attr.deType,attr.deName,attr.database,attr.source));		
			}, attr.update
		);
	}
	return this;
}

jQuery.fn.renderDygraph = function(attr) {
	charts[attr.chName] = new Dygraph(
		document.getElementById($(this).attr('id')),		// div Element
		attr.data, 											// Data
		{													// Chart Options
		labels: ['Time', attr.deName],
		title: "<h4>"+attr.deType+" : "+attr.deName,
		sigFigs : 3,										// number of significant figures
		clickCallback: function(e, x, pts) {
				if (zoomlevel[0] != 'no zoom') {
					$.log(zoomlevel);
					var s = zoomlevel[0][0];
					var e = zoomlevel[0][1];
					zoomlevel.shift();
					$("#container").text('Loading...');
		            getData(attr.deType,attr.deName,attr.db,attr.source,s,e);

		        }
		        else {return;}
              },									
		zoomCallback : function(minDate, maxDate, yRanges) {				// acquires new data points if zoomed
				var range = charts[attr.chName].xAxisRange();
				var start = minDate/1000;
				var end = maxDate/1000;
				if (attr.group!=8 && ((end-start) < 5*3600 || (end - start) < 10*24*3600) ) {
					$("#container").text('Loading..');
					zoomlevel.unshift([attr.start, attr.end]);
					$.log(zoomlevel);
					getData(attr.deType,attr.deName,attr.db,attr.source,start,end);
		}}
		});
}
