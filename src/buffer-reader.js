"use strict";

const assert = require( "assert" );

const BYTES_PER_CHAR = 2;
const TICKS_IN_MILLISECOND = 10000;
const MILLISECONDS_EPOCH_OFFSET = 62135596800000;

function BufferReader( buffer ) {
	this.buffer = buffer;
	this.offset = 0;
}

BufferReader.prototype = {
	skip( bytes ) {
		this.offset += bytes;
		return this;
	},

	assertByte( expected, description ) {
		return assert( this.buffer[ this.offset++ ] === expected, `Invalid ${ description }.` );
	},

	readByte() {
		return this.buffer[ this.offset++ ];
	},

	readBool() {
		return !!this.buffer[ this.offset++ ];
	},

	readInt64() {
		let val = this.buffer.slice( this.offset, this.offset + 8 ).readBigInt64LE();
		this.offset += 8;
		return Number( val );
	},

	readDate() {
		return new Date( ( this.readInt64() / TICKS_IN_MILLISECOND ) - MILLISECONDS_EPOCH_OFFSET );
	},

	readString() {
		const length = this.readByte() * BYTES_PER_CHAR;
		const val = length ? this.buffer.slice( this.offset, this.offset + length ).toString( "ucs2" ) : null;
		this.offset += length;
		return val;
	}
};

module.exports = BufferReader;
