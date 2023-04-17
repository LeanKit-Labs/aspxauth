# aspxauth

**Note:** There are many variables, flags, and version-specific considerations for how .NET generates the `.aspxauth` cookie. This library works for our needs using older versions of the .NET framework. Your milage may vary.

Provides utilities to assist in generating, validating and decrypting .NET authorization tickets (usually set in the .ASPXAUTH cookie) for interoperation with .NET authentication.

## Setup

The module must be initialized with configuration that corresponds to your .NET configuration and the machine key used to generate the auth ticket.

- `validationMethod` (string): (default "sha1")
- `validationKey` (string): hex encoded key to use for signature validation
- `decryptionMethod` (string): (default "aes")
- `decryptionIV` (string): hex encoded initialization vector (defaults to a vector of zeros)
- `decryptionKey` (string): hex encoded key to use for decryption
- `ticketVersion` (integer): if specified then will be used to validate the ticket version
- `validateExpiration` (bool): (default `true`) if false then decrypted tickets will be returned even if past their expiration
- `encryptAsBuffer` (bool): (default `false`) if true, encrypt will return a buffer rather than a hex encoded string
- `defaultTTL` (integer): (default 24hrs) if provided is used as milliseconds from `issueDate` to expire generated tickets
- `defaultPersistent` (bool): (default `false`) if provided is used as default `isPersistent` value for generated tickets
- `defaultCookiePath` (string): (default "/") if provided is used as default `cookiePath` for generated tickets
- `mode` (string): (default "dotnet45") if provided, it will try to decode as .net 4.5 compatible ticket, else specify "legacy"

```js
// Configure
var aspxauth = require( "aspxauth" )( {
    validationMethod: "sha1",
    validationKey: process.env.DOTNET_VALIDATION_KEY,
    decryptionMethod: "aes",
    decryptionIV: process.env.DOTNET_DECRYPTION_IV,
    decryptionKey: process.env.DOTNET_DECRYPTION_KEY
} );

// Generate encrypted cookie
var encryptedCookieValue = aspxauth.encrypt( {
    name: "some.username@place.com",
    customData: "other data"
} );

// Decrypt an existing cookie
var authTicket = aspxauth.decrypt( req.cookies[ ".ASPXAUTH" ] );
```

### Supported validation methods

- sha1

### Supported decryption methods

- aes

### Supported encryption modes

- legacy
- dotnet45

### Supported decryption modes

- legacy
- dotnet45