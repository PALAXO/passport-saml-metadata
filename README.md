# passport-saml-metadata

This package provides a simple reader for converting SAML2.0 IDP metadata XML to a JSON structure accepted by [@node-saml/passport-saml](https://www.npmjs.com/package/@node-saml/passport-saml/v/4.0.4) library. Currenly, only the following properties are recognized

 - `entryPoint` - SAML portal entrypoint
 - `authnRequestBinding` - Requested binding (either `HTTP-POST` or `HTTP-REDIRECT`)
 - `cert` - Public IDP certificates
 - `logoutUrl` - SAML logout entrypoint

# Example usage

The package provides only one function `parseString` which accepts XML metadata as a string.

```
import fs from 'fs';
import { parseString } from 'passport-saml-metadata';

const metadataXML = fs.readFileSync('azure-enterprise-app-metadata.xml');
// Print output
console.log(parseString(metadataXML));
```

Output is a JSON ready to be passed to `@node-saml/passport-saml` config

```
{
  entryPoint: 'https://login.microsoftonline.com/934e9d73-3cb7-46e1-808e-5a940c710537/saml2',
  authnRequestBinding: 'HTTP-Redirect',
  cert: [
    'MIIC8DCCAdigAwI...'
  ],
  logoutUrl: 'https://login.microsoftonline.com/934e9d73-3cb7-46e1-808e-5a940c710537/saml2'
}
```
