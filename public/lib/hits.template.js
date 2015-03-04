/**
 */

// GLOBAL HELPERS

/* XXX show0 = Show element if 0 vs if 1 - could be now done with #if
Handlebars.registerHelper('show0', function(data) {
	if (data == 0) 
		$(this).show();
});
case 'show1': 
	if (vals.data != 0) 
		$(this).show();
*/
	
Handlebars.registerHelper('age', function(data) {
	// Required for IE8 and Safari 5
	var datestr = String(data).replace(/-/g,"/");
	d = new Date(datestr);
	today = new Date();
	return Math.floor((today-d) / (365.25 * 24 * 60 * 60 * 1000));
});

Handlebars.registerHelper('days', function(data) {
	if (! data) return "?";
	// XXX split on " " or "T"
	t = data.split(" ");
	d = new Date(t[0]);
	today = new Date();
	return Math.floor((today-d) / (24 * 60 * 60 * 1000));
});

// Like appointment, but no 'days'
Handlebars.registerHelper('future', function(data) {
	if (! data) return "?";
	t = data.split(" ");
	d = new Date(t[0]);
	today = new Date();
	dataRef = Math.floor((d-today) / (24 * 60 * 60 * 1000));
	if (dataRef < 0) 
		return 'Past';
	else
		return dataRef;
});

Handlebars.registerHelper('round', function(data) {
	return parseFloat(data).toFixed(2);
});

Handlebars.registerHelper('round0', function(data) {
	return parseFloat(data).toFixed(0);
});

Handlebars.registerHelper('localeString', function(data) {
	return parseFloat(data).toLocaleString();
});

Handlebars.registerHelper('localeString0', function(data) {
	dataRef = parseFloat(vals.data).toFixed(0);
	return parseFloat(dataRef).toLocaleString();
});

// Block helper for ifeq (could add iflt, ifgt, ifne)
Handlebars.registerHelper('ifeq', function (a, b, options) {
	if (a == b) { return options.fn(this); }
});

hits_template = {
	// XXX Compile templates - where are they stored / coming from?

	// XXX Execute template with data ?
	apply: function(obj, data, template) {
		// XXX template a template OR TEXT, then compile... if !typeOf template 'Handlebars')
		// XXX If template empty, get template from obj (if !template template=$(obj).html();
		template = Handlebars.compile(template);
		$(obj).html( template(data) );
	},

	// And this is the definition of the custom function 
	// http://stackoverflow.com/questions/8366733/external-template-in-underscore
	cache: {},
	render: function(tmpl_name, tmpl_data) {
		if ( ! hits_template.cache[tmpl_name] ) {
			var tmpl_url = hits_util.getRoot() + 'lib/templates/' + tmpl_name + '.html';

			var tmpl_string;
			$.ajax({
				url: tmpl_url,
				method: 'GET',
				async: false,
				// (maybe) dataType: 'html',
				success: function(data) {
					tmpl_string = data;
				}
			});

			hits_template.cache[tmpl_name] = Handlebars.compile(tmpl_string);
		}

		return hits_template.cache[tmpl_name](tmpl_data);
	},

	auto: function(el, tmpl_name, tmpl_data, plugins) {
		plugins = typeof plugins !== 'undefined' ? plugins : false;
		el.html( hits_template.render(tmpl_name, tmpl_data) );

		// FUTURE - Allow recursive expansion (not yet supported for HITS)
		// if (plugins) 
		// 	hits_util.pluginRender(el, 'template_auto');
	},

};

// Map class "hits-template"
//	For convenience, all attributes are passed in as data to the Template
//	e.g. dataId="student" would be {{dataid}} (note lower case for attributes)
$.fn.hits_template = function () {
	return this.each(function () {
		var $this = $(this);

		// Template name = dataType - with some mapping
		var dataType = $this.attr("datatype");
		dataType = dataType.replace(/{(.+?)}/, function(v) { 
			// TODO: Consider security of this?
			v = v.substring(1, v.length-1); 
			return $.url().param(v); 
		});

		// data = Attributes
		var data = {};
		$.each(this.attributes, function() {
			data[this.name] = this.value;
		});
		hits_template.auto($this, dataType, data);
	});
};

// Automatically map class hits-template
$('.hits-template').hits_template();
