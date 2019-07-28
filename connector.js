var fs = require('fs');
var request = require('request');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.VAULT_SKIP_VERIFY=true;
var saToken = "";
var saTokenFile = "";
var secretData;

exports.vaultConnector = async function(vaultDomainURL,vaultPort,vaultRoleName,vaultSecretMountpoint,callback) {

	// Set Default Values
	console.log("Vault Connector => Set target query secret mountpoint : "+ vaultSecretMountpoint);

	console.log("Vault Connector => Set Authentication Role : "+ vaultRoleName);

    var vaultURL = vaultDomainURL+":"+vaultPort;
    console.log("Vault Connector => Set Vault URL : "+ vaultURL);

	if(typeof process.env.SATOKEN_FILE == 'undefined'){
		console.log("Vault Connector => Using Service Account Fille : /var/run/secrets/kubernetes.io/serviceaccount/token");
	    saTokenFile = "/var/run/secrets/kubernetes.io/serviceaccount/token";
	}else{
	    console.log("Vault Connector => Using Service Account Fille : "+process.env.SATOKEN_FILE);
	    saTokenFile = process.env.SATOKEN_FILE;
	}

    let k8sSAToken = await getSAToken(saTokenFile);
    let vaultAcesssToken = await vaultLogin(vaultURL,k8sSAToken,vaultRoleName);    
    let vaultSecretData = await getSecrets(vaultURL,vaultAcesssToken.auth.client_token,vaultSecretMountpoint);

	return callback(vaultSecretData);
};

async function getSAToken(saTokenFile){
  return new Promise((resolve, reject) => {    
	fs.readFile(saTokenFile, 'utf8', function(err, contents) {
		if(err){
			console.log("Vault Connector => Failed to read service account token file ("+saTokenFile+")");
			console.log(err);
			reject('Failed to read service account token file');
		}else{
			console.log("Vault Connector => Get service account token file successfully");
			resolve(contents);
		}
	});
  }); // End Promise
}

async function vaultLogin(vaultURL,k8sSAToken,vaultRoleName){
  return new Promise((resolve, reject) => {    
  	console.log("Vault Connector => Login to Vault API with Kubernetes Authentication Plugin");
    var payload = {
	  'jwt': k8sSAToken,
	  'role': vaultRoleName
	}
	options = {
		url: vaultURL+"/v1/auth/kubernetes/login",
		method: 'POST',
		followAllRedirects: true,
		insecure: false,
		body: JSON.stringify(payload),
		headers:{
		  'Content-Type': 'application/json'
		}
	}

	request(options, function (error, response, body){
		if (error) {
			console.log("Vault Connector => Cannot authencate with vault api : "+ vaultURL );
			reject('Failed to connect to vault engine, something wrong with connection');
			console.log(error);
		} else {
			if(response.statusCode == "500"){
				console.log("Vault Connector => Failed to Login : Service account token is unauthorized");
				reject('Failed to login to vault api');
			}else{
				console.log("Vault Connector => Logged in successfully")
				resolve(JSON.parse(body));
			}
		}
	});
  }); // End Promise
}

async function getSecrets(vaultURL,vaultAcesssToken,vaultSecretMountpointPath){

  return new Promise((resolve, reject) => {
  	console.log("Vault Connector => Querying Secrets");

    options = {
		url: vaultURL+vaultSecretMountpointPath,
		method: 'GET',
		followAllRedirects: true,
		insecure: true,
		headers:{
		  'Content-Type': 'application/json',
		  'X-Vault-Token': vaultAcesssToken
		}
	}

	request(options, function (error, response, body){
		if (error) {
			console.log("Vault Connector => Failed in step connect to vault api when start querying secrets");
			console.log(error);
			reject('Failed to connect to vault engine, something wrong with connection');
		} else {
			if(response.statusCode == "403"){
				console.log("Vault Connector => Failed to query secret, JWT 403 unauthorized");
				reject('Failed to query secret, 403 unauthorized');
			}if(response.statusCode == "404"){
				console.log("Vault Connector => Failed to query secret, secret mountpoint : "+path+" is not exited (404 secret not found)");
				reject('Failed to query secret, 404 secret not found');
			}else{
				console.log("Vault Connector => Query secrets successfully");
				resolve(JSON.parse(body).data.data);
			}
		}
	});
	
  }); // End Promise
}