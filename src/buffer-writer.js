import bignum from "bignum";

const BYTES_PER_CHAR = 2;
const TICKS_IN_MILLISECOND = 10000;
const MILLISECONDS_EPOCH_OFFSET = 62135596800000;

class BufferWriter {
	constructor( size ) {
		this.buffer = new Buffer( size );
		this.offset = 0;
	}

	writeBuffer( val ) {
		val.copy( this.buffer, this.offset );
		this.offset += val.length;
		return this;
	}

	writeByte( val ) {
		this.buffer[ this.offset++ ] = val;
		return this;
	}

	writeBool( val ) {
		this.buffer[ this.offset++ ] = val ? 0x01 : 0x00;
		return this;
	}

	writeInt64( val ) {
		this.writeBuffer( bignum( val ).toBuffer( { endian: "little", size: 8 } ) );
		return this;
	}

	writeDate( val ) {
		this.writeInt64( bignum( val.getTime() ).add( MILLISECONDS_EPOCH_OFFSET ).mul( TICKS_IN_MILLISECOND ) );
		return this;
	}

	writeString( val ) {
		if ( val && val.length ) {
			const length = val.length * BYTES_PER_CHAR;
			this.writeByte( val.length );
			this.buffer.write( val, this.offset, "ucs2" );
			this.offset += length;
		} else {
			this.writeByte( 0 );
		}
		return this;
	}
}

BufferWriter.stringSize = function( val ) {
	return ( val && val.length || 0 ) * BYTES_PER_CHAR + 1;
};

export default BufferWriter;
