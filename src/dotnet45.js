const crypto = require( "crypto" );

const dotnet45 = {

	writeUInt32ToByteArrayBigEndian( value, buffer, offset ) {
		buffer[ offset + 0 ] = value >> 24;
		buffer[ offset + 1 ] = value >> 16;
		buffer[ offset + 2 ] = value >> 8;
		buffer[ offset + 3 ] = value;
	},


	deriveKeyImpl( hmac, label, context, keyLengthInBits ) {
		const labelLength = ( label !== null ) ? label.length : 0;
		const contextLength = ( context !== null ) ? context.length : 0;
		const buffer = Buffer.alloc( 4 /* [i]_2 */ + labelLength /* label */ + 1 /* 0x00 */ + contextLength /* context */ + 4 /* [L]_2 */ );

		if ( labelLength !== 0 ) {
			label.copy( buffer, 4, 0, labelLength ); // the 4 accounts for the [i]_2 length
		}
		if ( contextLength !== 0 ) {
			context.copy( buffer, 5 + labelLength, 0, contextLength ); // the '5 +' accounts for the [i]_2 length, the label, and the 0x00 byte
		}
		this.writeUInt32ToByteArrayBigEndian( keyLengthInBits, buffer, 5 + labelLength + contextLength ); // the '5 +' accounts for the [i]_2 length, the label, the 0x00 byte, and the context

		// Initialization

		let numBytesWritten = 0;
		let numBytesRemaining = keyLengthInBits / 8;
		const output = Buffer.alloc( numBytesRemaining );

		// Calculate each K_i value and copy the leftmost bits to the output buffer as appropriate.

		let i = 1;
		while ( numBytesRemaining > 0 ) {
			this.writeUInt32ToByteArrayBigEndian( i, buffer, 0 ); // set the first 32 bits of the buffer to be the current iteration value
			const hash = hmac.update( buffer ).digest();

			// copy the leftmost bits of hash into the output buffer
			const numBytesToCopy = Math.min( numBytesRemaining, hash.length );

			hash.copy( output, numBytesWritten, 0, numBytesToCopy );
			numBytesWritten += numBytesToCopy;
			numBytesRemaining -= numBytesToCopy;
			i++;
		}

		// finished
		return output;
	},


	getKeyDerivationParameters() {
		const label = Buffer.from( "FormsAuthentication.Ticket", "utf8" );
		const context = Buffer.alloc( 0 );

		return {
			label,
			context
		};
	},

	deriveKey( validationKey ) {
		const { label, context } = this.getKeyDerivationParameters();

		const keyDerivationKey = Buffer.from( validationKey, "hex" );

		const hmac = crypto.createHmac( "sha512", keyDerivationKey );

		return this.deriveKeyImpl( hmac, label, context, keyDerivationKey.length * 8 );
	}
};

module.exports = dotnet45;
