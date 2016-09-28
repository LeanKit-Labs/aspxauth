# aspxauth

Provides methods and middleware to assist in validating and decrypting .NET authorization tickets usually in the .ASPXAUTH cookie.

## Setup

The module must be initialized with configuration that corresponds to your .NET configuration and the machine key used to generate the auth ticket.

- `validationMethod` (string): (default "sha1")
- `validationKey` (string): hex encoded key to use for signature validation
- `decryptionMethod` (string): (default "aes")
- `decryptionIV` (string): hex encoded initialization vector (defaults to a vector of zeros)
- `decryptionKey` (string): hex encoded key to use for decryption
- `ticketVersion` (integer): if specified then will be used to validate the ticket version
- `validateExpiration` (bool): (default true) if false then decrypted tickets will be returned even if past their expiration

```js
var aspxauth = require( "aspxauth" )( {
    validationMethod: "sha1",
    validationKey: process.env.DOTNET_VALIDATION_KEY,
    decryptionMethod: "aes",
    decryptionIV: process.env.DOTNET_DECRYPTION_IV,
    decryptionKey: process.env.DOTNET_DECRYPTION_KEY
} );

var authTicket = aspxauth.decrypt( req.cookies[ ".ASPXAUTH" ] );
```

### Supported validation methods

- sha1

### Supported decryption methods

- aes
