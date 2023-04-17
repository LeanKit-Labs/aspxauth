"use strict";

const assert = require( "assert" );
const { createCipheriv, createDecipheriv, createHmac, randomBytes } = require( "crypto" );
const BufferReader = require( "./buffer-reader" );
const BufferWriter = require( "./buffer-writer" );
const dotnet45 = require( "./dotnet45" );

const modes = {
	legacy: "legacy",
	dotnet45: "dotnet45"
};

const VALIDATION_METHODS = {
	sha1: {
		algorithm: "sha1",
		signatureSize: 20
	}
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

	encryptAsBuffer (bool): (default false) if true, generate will return a buffer rather than a hex encoded string
	defaultTTL (integer): (default 24hrs) if provided is used as milliseconds from issueDate to expire generated tickets
	defaultPersistent (bool): (default false) if provided is used as default isPersistent value for generated tickets
	defaultCookiePath (string): (default "/") if provided is used as default cookie path for generated tickets
 */

module.exports = config => {
	const VALIDATION_METHOD = VALIDATION_METHODS[ config.validationMethod || "sha1" ];
	const DECRYPTION_METHOD = DECRYPTION_METHODS[ config.decryptionMethod || "aes" ];
	const mode = config.mode || modes.legacy;

	assert( VALIDATION_METHOD, "Invalid validation method" );
	assert( DECRYPTION_METHOD, "Invalid decryption method" );
	assert( config.validationKey, "'validationKey' is required" );
	assert( config.decryptionKey, "'decryptionKey' is required" );

	const VALIDATION_KEY = mode === modes.dotnet45 ? dotnet45.deriveKey( config.validationKey ) : Buffer.from( config.validationKey, "hex" );
	const DECRYPTION_KEY = mode === modes.dotnet45 ? dotnet45.deriveKey( config.decryptionKey ) : Buffer.from( config.decryptionKey, "hex" );
	const DECRYPTION_IV = config.decryptionIV ? Buffer.from( config.decryptionIV, "hex" ) : Buffer.alloc( DECRYPTION_METHOD.ivSize );

	const REQUIRED_VERSION = config.ticketVersion || false;
	const VALIDATE_EXPIRATION = config.validateExpiration !== false;

	const AS_BUFFER = !!config.encryptAsBuffer;
	const DEFAULT_TTL = config.defaultTTL || 86400000;
	const DEFAULT_IS_PERSISTENT = !!config.defaultPersistent;
	const DEFAULT_COOKIE_PATH = config.defaultCookiePath || "/";

	const BASE_PAYLOAD_SIZE = 21;

	function validate( bytes ) {
		const signature = bytes.slice( -VALIDATION_METHOD.signatureSize );
		const payload = bytes.slice( 0, -VALIDATION_METHOD.signatureSize );

		const hash = createHmac( VALIDATION_METHOD.algorithm, VALIDATION_KEY );
		hash.update( payload );

		return hash.digest().equals( signature );
	}

	function decrypt( cookie ) {
		const bytes = cookie instanceof Buffer ? cookie : Buffer.from( cookie, "hex" );

		if ( !validate( bytes ) ) {
			console.error( "Signature validation failed" );
			return null;
		}

		const decryptor = createDecipheriv( DECRYPTION_METHOD.cipher, DECRYPTION_KEY, mode === modes.dotnet45 ? bytes.slice( 0, DECRYPTION_METHOD.ivSize ) : DECRYPTION_IV );
		const payload = bytes.slice( mode === modes.dotnet45 ? DECRYPTION_IV.length : 0, -VALIDATION_METHOD.signatureSize );
		const decryptedBytes = Buffer.concat( [ decryptor.update( payload ), decryptor.final() ] );

		if ( mode !== modes.dotnet45 && !validate( decryptedBytes.slice( DECRYPTION_METHOD.headerSize ) ) ) {
			console.error( "Ticket validation failed" );
			return null;
		}

		const reader = new BufferReader( decryptedBytes );
		const ticket = {};

		if ( mode !== modes.dotnet45 ) {
			reader.skip( DECRYPTION_METHOD.headerSize );
		}
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
	}

	function encrypt( ticket ) {
		const stringsSize = BufferWriter.stringSize( ticket.name ) + BufferWriter.stringSize( ticket.customData ) + BufferWriter.stringSize( ticket.cookiePath || DEFAULT_COOKIE_PATH );
		const writer = new BufferWriter( BASE_PAYLOAD_SIZE + stringsSize );

		writer.writeByte( FORMAT_VERSION );

		if ( REQUIRED_VERSION ) {
			if ( ticket.ticketVersion ) {
				assert( REQUIRED_VERSION === ticket.ticketVersion, `Invalid ticket version ${ ticket.ticketVersion }, expected ${ REQUIRED_VERSION }` );
			}
			writer.writeByte( REQUIRED_VERSION );
		} else {
			writer.writeByte( ticket.ticketVersion || 0x01 );
		}

		const issueDate = ticket.issueDate || new Date();
		const expirationDate = ticket.expirationDate || new Date( issueDate.getTime() + DEFAULT_TTL );
		writer.writeDate( issueDate );
		writer.writeByte( SPACER );
		writer.writeDate( expirationDate );
		writer.writeBool( "isPersistent" in ticket ? !!ticket.isPersistent : DEFAULT_IS_PERSISTENT );
		writer.writeString( ticket.name );
		writer.writeString( ticket.customData );
		writer.writeString( ticket.cookiePath || DEFAULT_COOKIE_PATH );
		writer.writeByte( FOOTER );

		// add a hash of the preencrypted bytes
		const preEncryptedHash = createHmac( "sha1", VALIDATION_KEY );
		preEncryptedHash.update( writer.buffer );
		const preEncryptedBytes = mode === modes.dotnet45 ?
			Buffer.concat( [ randomBytes( DECRYPTION_IV.length ), writer.buffer ] ) :
			Buffer.concat( [ randomBytes( DECRYPTION_METHOD.headerSize ), writer.buffer, preEncryptedHash.digest() ] );

		const encryptor = createCipheriv( DECRYPTION_METHOD.cipher, DECRYPTION_KEY, DECRYPTION_IV );
		const encryptedBytes = Buffer.concat( [ encryptor.update( preEncryptedBytes ), encryptor.final() ] );

		// add a hash of the encrypted bytes
		const hash = createHmac( "sha1", VALIDATION_KEY );
		hash.update( encryptedBytes );

		const final = Buffer.concat( [ encryptedBytes, hash.digest() ] );

		return AS_BUFFER ? final : final.toString( "hex" );
	}

	return { decrypt, encrypt };
};
