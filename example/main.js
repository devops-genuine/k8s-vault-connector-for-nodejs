var vaultDriver = require('vault-connector-for-nodejs');

main();

function main(){
	vaultDriver.vaultConnector(process.env.VAULT_URL,process.env.VAULT_PORT,process.env.VAULT_ROLE_NAME,process.env.VAULT_SECRET_MOUNTPOINT,function(secretData){
      console.log('API_KEY result : '+ secretData.API_KEY);
      console.log('CERTITICATE result : '+ secretData.RSA_FILE);
	});
}