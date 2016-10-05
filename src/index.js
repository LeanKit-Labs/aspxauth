import crypto from "crypto";
import BufferReader from "./buffer-reader";

const VALIDATION_METHODS = {
	sha1: { signatureSize: 20 }
};

const DECRYPTION_METHODS = {
	aes: {
		cipher: "aes-256-cbc",
		ivSize: 16,
		headerSize: 32
	}
};

const FORMAT_VERSION = 1;
const SPACER = 0xfe;
const FOOTER = 0xff;

/**
	validationMethod (string): (default "sha1")
	validationKey (string): hex encoded key to use for signature validation

	decryptionMethod (string): (default "aes")
	decryptionIV (string): hex encoded initialization vector (defaults to zeros)
	decryptionKey (string): hex encoded key to use for decryption

	ticketVersion (integer): if specified then will be used to validate the ticket version
	validateExpiration (bool): (default true) if false then decrypted tickets will be returned even if past their expiration
 */

export default config => {
	const VALIDATION_METHOD = VALIDATION_METHODS[ config.validationMethod || "sha1" ];
	const DECRYPTION_METHOD = DECRYPTION_METHODS[ config.decryptionMethod || "aes" ];
	const VALIDATION_KEY = new Buffer( config.validationKey, "hex" );
	const DECRYPTION_KEY = new Buffer( config.decryptionKey, "hex" );
	const DECRYPTION_IV = config.decryptionIV ? new Buffer( config.decryptionIV, "hex" ) : Buffer.alloc( DECRYPTION_METHOD.ivSize );
	const REQUIRED_VERSION = config.ticketVersion || false;
	const VALIDATE_EXPIRATION = config.validateExpiration !== false;

	function validate( cookie ) {
		const bytes = cookie instanceof Buffer ? cookie : new Buffer( cookie, "hex" );

		const signature = bytes.slice( -VALIDATION_METHOD.signatureSize );
		const payload = bytes.slice( 0, -VALIDATION_METHOD.signatureSize );

		const hash = crypto.createHmac( "sha1", VALIDATION_KEY );
		hash.update( payload );

		return hash.digest().equals( signature );
	}

	function decrypt( cookie ) {
		try {
			const bytes = cookie instanceof Buffer ? cookie : new Buffer( cookie, "hex" );

			if ( !validate( bytes ) ) {
				return null;
			}

			const decryptor = crypto.createDecipheriv( DECRYPTION_METHOD.cipher, DECRYPTION_KEY, DECRYPTION_IV );
			const payload = bytes.slice( 0, -VALIDATION_METHOD.signatureSize );
			const decryptedBytes = Buffer.concat( [ decryptor.update( payload ), decryptor.final() ] );
			const reader = new BufferReader( decryptedBytes );
			const ticket = {};

			reader.skip( DECRYPTION_METHOD.headerSize );
			reader.assertByte( FORMAT_VERSION, "format version" );

			if ( REQUIRED_VERSION ) {
				reader.assertByte( REQUIRED_VERSION, "ticket version" );
				ticket.ticketVersion = REQUIRED_VERSION;
			} else {
				ticket.ticketVersion = reader.readByte();
			}

			ticket.issueDate = reader.readDate();
			reader.assertByte( SPACER, "spacer" );
			ticket.expirationDate = reader.readDate();

			if ( VALIDATE_EXPIRATION && ticket.expirationDate < Date.now() ) {
				return null;
			}

			ticket.isPersistent = reader.readBool();
			ticket.name = reader.readString();
			ticket.customData = reader.readString();
			ticket.cookiePath = reader.readString();
			reader.assertByte( FOOTER, "footer" );

			return ticket;
		} catch ( e ) {
			return null;
		}
	}

	return { decrypt };
};
