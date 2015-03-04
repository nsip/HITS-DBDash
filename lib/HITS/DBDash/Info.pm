package HITS::DevDash::Info;
use perl5i::2;
use Dancer ':syntax';
use Dancer::Plugin::REST;
use Dancer::Plugin::Database;
use MIME::Base64;
use lib '../sif-au-perl/lib';
use lib '/home/scottp/nsip/sif-au-perl/lib';
use SIF::AU;

our $VERSION = '0.1';
prefix '/info';
set serializer => 'mutable';

get '/' => sub {
	# TODO - API definition
};

get '/:userToken' => sub {
	# TODO - Show list for this ID (most recent 25, add params later)
	my $sth = database->prepare(q{
		SELECT 
			*
		FROM
			SIF3_APP_TEMPLATE
		WHERE
			USER_TOKEN = ?
	});

	# XXX What about other data
	#	hits / Vendor information like apps and title
	#	Vendor Name information...

	# XXX AHHH all the Field name changes, userToken, USER_TOKEN !

	$sth->execute(params->{userToken});
	my $data = $sth->fetchrow_hashref // {};

	$sth = database('HITS')->prepare(q{
		SELECT 
			app.id app_id, app.name app_name, app.title app_title, 
			vendor.name vendor_name, vendor.id vendor_id
		FROM 
			app, vendor, app_login
		WHERE
			app.vendor_id = vendor.id
			AND app.id = app_login.app_id
			AND app_login.app_template_id = ?
	});
	$sth->execute($data->{APP_TEMPLATE_ID});
	my $hits = $sth->fetchrow_hashref // {};
		
	return {
		vendor => {
			id => $hits->{vendor_id},
			name => $hits->{vendor_name},
		},
		app => {
			id => $hits->{app_id},
			name => $hits->{app_name},
			title => $hits->{app_title},
		},
		info => {
			# XXX These names are wrong too - what is the right name?
			#	Check XML Environment as convention?
			template => $data->{ENV_TEMPLATE_ID},
			password => $data->{PASSWORD},
			instanceId => $data->{APP_TEMPLATE_ID},
			appTemplateId => $data->{APP_TEMPLATE_ID},
			authMethod => $data->{AUTH_METHOD},
			userToken => $data->{USER_TOKEN},
			applicationKey => $data->{APPLICATION_KEY},
			solutionId => $data->{SOLUTION_ID},
		}
	};
};

true;
