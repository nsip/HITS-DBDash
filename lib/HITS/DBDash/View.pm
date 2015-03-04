package HITS::DevDash::View;
use perl5i::2;
use Dancer ':syntax';
use Dancer::Plugin::REST;
use Dancer::Plugin::Database;
use MIME::Base64;

our $VERSION = '0.1';
prefix '/view';
set serializer => 'JSON';

# XXX now needs the token !

# List tables
get '/' => sub {
};

sub sif_db {
	my ($userToken) = @_;

	my $sth = database->prepare('SELECT databaseUrl FROM Zone WHERE zoneId = ?');
	$sth->execute($userToken);
	my $ref = $sth->fetchrow_hashref;
	my $db = $ref->{databaseUrl};

	if (!$db) {
		die "No valid DB from userToken $userToken";
	}
	
	my $dsn = config->{hits}{dsn_template};
	$dsn =~ s/TEMPLATE/$db/;
	return DBI->connect(
		$dsn,
		'sifau', 
		'03_SIS_was_not', 
		{ RaiseError => 1, AutoCommit => 1 }
	);
}

# List tables
get '/:userToken' => sub {
	my $ret = {};
	my $dbh = sif_db(params->{userToken});
	foreach my $t ($dbh->tables) {
		$t =~ s/^.+\.//;
		$t =~ s/'//g;
		$t =~ s/`//g;
		if ($t ne 'XMLAudit') {
			$ret->{$t} = {
				href => uri_for('view/' . $t) . '',
			};
		}
	}
	return {
		table => $ret,
	};
};

# List data
get '/:userToken/table/:id' => sub {
	# TODO - Add some href links & allow configurable limits, filters and sorting
	my $dbh = sif_db(params->{userToken});
	my $sth = $dbh->prepare('SELECT * FROM ' . params->{id} . ' LIMIT 250');
	info('SELECT * FROM ' . params->{id} . ' LIMIT 250');
	$sth->execute;
	return {
		data => $sth->fetchall_arrayref({}),
	};
};

true;
