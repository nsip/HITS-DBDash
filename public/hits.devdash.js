hljs.initHighlightingOnLoad();

var entify = function(data) {
		return document.createElement( 'a' ).appendChild( 
				document.createTextNode( data ) ).parentNode.innerHTML;
};

// ----------------------------------------------------------------------
// Navigation
$('.hdd-nav').click(function() {
	$('.hdd-nav').removeClass('active');
	$(this).addClass('active');
	$('.hdd-body').hide();
	$($(this).find('a').attr('href')).show(); // href contains ID
});
$('#hdd-dashboard-back').click(function() {
	$('.hdd-body').hide();
	$('#hdd-body-dashboard').show();
});
$('#hdd-view-back').click(function() {
	$('.hdd-body').hide();
	$('#hdd-body-view').show();
});

// ----------------------------------------------------------------------
// Load TOKEN and check for errors
var token = $.url().param('token');
console.log(token);
if (token) {
	$('#hdd-info-error').hide();
}
else {
	$('#hdd-info-error-details').html('No TOKEN provided');
}

// ----------------------------------------------------------------------
// REST API
var api = new $.RestClient(
	'',
	{
		cache: 10,
		stripTrailingSlash: true,
		stringifyData: true,
		request: function(resource, options) {
			return $.ajax(options);
		},
		ajax: {
			contentType:"application/json; charset=utf-8"
		},
		fail: function(err) {
			if (err.status == 403)
				alertify.confirm("Authentication Failure: " + err.statusText, function (e) {
					if (e) {
						window.location = '/site/';
					} else {
						throw("403 error - " + err.statusText);
					}
				});
			else {
				if (err.responseText) {
					alertify.alert("Unknown API Error: " + err.statusText + "<br><pre>" + err.responseText + "</pre>");
				}
			}
		}
	}
);
api.add('info');
api.add('audit');
api.audit.add('entry');
api.add('view');
api.view.add('table');
api.add('report');

// ----------------------------------------------------------------------
// Update information details

$(document).ready(function(){

// ----------------------------------------------------------------------
// Events - only read audit log if that window is showing

$('#hdd-dashboard-refresh').click(function() {
	api.audit.read(token).done(function(data) {
		console.log(data);
		var table = $('#hdd-dashboard-data');
		var body = table.find('tbody');
		body.empty();
		$.each(data.audit, function(i,e) {
			body.append(
				'<tr>'
				+ '<td>' 
					+ '<a class="hdd-view" href="#view-' + e.id + '">'
					+ e.id 
					+ '</a>'
				+ '</td>'
				+ '<td>' + e.method + '</td>'
				+ '<td>' + e.httpStatus + '</td>'
				+ '<td>' + e.requestTime + '</td>'
				+ '<td>' + e.url + '</td>'
				+ '</tr>'
			);
		});
		table.tablesorter(); 

		$('.hdd-view').click(function() {
			var id = $(this).attr('href').substring(6);
			api.audit.entry.read(token,id).done(function(data) {
				console.log(data);
				$('.hdd-body').hide();
				$('#hdd-body-dashboard-view').show();
				var disp = $('#hdd-body-dashboard-view');

				disp.find('.field').each(function(i, block) {
					var k = $(this).attr('dataid');
					$(this).html(entify(data[k]));
				});

				// disp.append('<pre><code>' + entify(data.response) + '</code></pre>');
				$('#hdd-body-dashboard-view').find('pre code').each(function(i, block) {
					hljs.highlightBlock(block);
				});
			});
		});
	});
});

/* TODO 

	- Entry View
		. Pretty presentation of each of the special fields
		. HTTML Entify all
		. Scrollable XML Request / Response boxes?
		. Back button
	- View (database)
		. Tables
		. Rows
*/

// ----------------------------------------------------------------------
// Get info and populate necessary fields
var info = {};
api.info.read(token).done(function(data) {
	console.log(data);
	info = data;	// Keep a copy of the data
	
	// XXX URL ENCODING !!!
	var url = 'application_key=' + data.info.applicationKey
		+ '&user_token=' + data.info.userToken
		+ '&password=' + data.info.password;
	
	console.log(url);

	$('.info_field').each(function(i, block) {
		var k = $(this).attr('dataid');

                var fieldSplit = k.split(".");
                var dataRef = data;
                for (var i = 0; i < fieldSplit.length; i++) {
                        try {
                                dataRef = dataRef[fieldSplit[i]];
                        }
                        catch (err) {
                                console.log("Unable to get next value from getData: " + field);
                                dataRef = null;
                        }
                }
		$(this).html(entify(dataRef));
	});

	$('.hdd-clienturl').each(function(index) {
		var $this = $(this);
		if ($this.attr('href')) {
			$this.attr('href', $this.attr('href') + url);
		}
		if ($this.attr('src')) {
			$this.attr('src', $this.attr('src') + url);
		}
	});
});

// ----------------------------------------------------------------------
// Table / Database view
api.view.read(token).done(function(data) {
	var ul = $('#hdd-body-view-list');
	// TODO - Add row counts etc in here
	$.each(data.table, function(key, val) {
		ul.append('<li><a class="table-view" href="#' + key + '">' + key + '</a></li>');
	});

	$('.table-view').click(function() {
		var table = $(this).attr('href').substring(1);
		api.view.table.read(token,table).done(function(data) {
			$('.hdd-body').hide();
			$('#hdd-body-view-table').show();

			$('#hbv-tablename').html(table);
			var tbl = $('#hbv-data');
			var head = tbl.find('thead tr');
			var body = tbl.find('tbody');
			head.empty();
			body.empty();

			var fields = [];
			$.each(data.data[0], function(key, val) {
				fields.push(key);
			});
			// fields.sort();
			$.each(fields, function(x, k) {
				head.append('<th>' + k + '</th>');
			});

			$.each(data.data, function(i, d) {
				body.append('<tr></tr>');
				var tr = body.find('tr').last();
				$.each(fields, function(x, k) {
					tr.append('<td>' + d[k] + '</td>');
				});
			});

			tbl.tablesorter(); 
		});
	});
});

// ----------------------------------------------------------------------
// Report
$('#hdd-report').click(function() {
	var el = $('#hbr-data');
	el.mask("Loading...");

	api.report.read(info.info.appTemplateId).done(function(data) {
		console.log(data);
		el.empty();
		el.append("<h1>Report: " + data.title + "</h1>");
		el.append("<p>" + data.description + "</p>");
		el.append("<p>SCORE: " + data.score.percent + "%</p>");
		$.each(data.tests, function(i,e) {
			el.append("<hr />");
			el.append("<h2>Test: " + e.id + " - " + e.title + "</h2>");
			el.append("<p>" + e.description + "</p>");
			el.append("<h3>Sub tests:</h3>");
			$.each(e.subtests, function(e_i,e_e) {
				el.append("<li>" + e.id + "." + e_e.id + " - " + e_e.title + "</li>");
			});
			el.append("<h3>Errors:</h3>");
			if ( e.errors.length > 0 ) {
				$.each(e.errors, function(e_i,e_e) {
					el.append("<li>" + e.id + "." + e_e.subtest + " - " + e_e.details + "</li>");
				});
			}
			else {
				el.append("<p><strong>NO ERRORS</strong></p>");
			}
		});
		el.unmask();
	});
});

// END DOCUMENT ON READY
});
