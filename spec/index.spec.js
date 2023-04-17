"use strict";

const factory = require( "../src/index" );
const useFakeTimers = require( "sinon" ).useFakeTimers;
const chai = require( "chai" );
const expect = require( "chai" ).expect;
chai.should();

describe( "aspxauth#decrypt", () => {
	let config, token, result, clock, currentTime;

	const version2Token = "874B814416D1064EFF67A64D1200525471A0C74ADA3B450F05CBBCC7B2BEC6C9E5D20F1AD4E83DB3C72A965096C9680D4F667DAC7AFDAE168C7EE9D5CF77EBAFBB439CE461500A3E9547883E87B4BA5FEC14F9EECD1AECC594ECA46C2A8FA2652195A6562465E6811E36E2B119EE1A927D11E84E89D3AF6870F00A9C72E65F26A5E8EA7EBDADE8C4CD15BFF433FAAF269F17C4EC85C49069981227416EDD2086FA4D453D25A865580990608F142D167CBC671717C0C22E8E6FC28CA3F1C385462E40B6505AE67EEEFA90EC6BB2E6E7D04B0F6CB457223EAFE6BA0C32D7F867C764D33ABA914ABDACA6FBCF8DB7C5628A72606E3F113794BB071A2F432C9422017ECFEEBFC28C1F1A7AEE12AD3AFA9E7916FF52B041EA6BF44FAD4DBBFD1A6A8B4A4EBF37";

	const version2TokenContents = {
		ticketVersion: 2,
		issueDate: new Date( "2016-09-23T15:38:02.250Z" ),
		expirationDate: new Date( "2016-10-23T15:38:02.250Z" ),
		isPersistent: true,
		name: "calvin.bottoms@leankit.com",
		customData: "banditsoftware.localkanban.com:59ddc62b-1b40-4fe3-afe3-e1bb11bb8170",
		cookiePath: "/"
	};

	function configAndDecrypt() {
		clock = useFakeTimers( currentTime.getTime() );
		result = factory( config ).decrypt( token );
	}

	beforeEach( () => {
		config = {
			validationMethod: "sha1",
			validationKey: "709FC62CDB7CC79821DEBB2062FDED6795AD8CB37341B55B3763923BEEF662865AF7EC613F9A76171CA3C336ED119D1C103555D87D092BAD4A63F807592B0520",
			decryptionMethod: "aes",
			decryptionIV: "00000000000000000000000000000000",
			decryptionKey: "9DA83917EE2DE9008FCB45986195A9BC11EF9496D67042C76B4052CEFA22EF45",
			ticketVersion: 2
		};
		token = version2Token;
		currentTime = new Date( 2016, 9, 1 );
	} );

	afterEach( () => {
		clock.restore();
	} );

	describe( "when configuration and token are valid", () => {
		it( "should return ticket object", function () {
			configAndDecrypt();
			result.should.eql( version2TokenContents );
		} );
	} );

	describe( "when token is not valid", () => {
		it( "should return null", function () {
			token = "87";
			configAndDecrypt();
			( result === null ).should.be.true; // eslint-disable-line no-unused-expressions
		} );
	} );

	describe( "when signature on unencrypted bytes does not match hash", () => {
		it( "should return null", function () {
			token = "d522006c09b3cdc7cc77e5fce18e4049a4a0532c60111c35abf1c431ed36deebbc0eaf50f2c085e504f59e41c4f17952c1fbdf3afccc530da188b2577ff0aa65dea41e2cce59b6b657c3f5f869c52a75f0aa0a22f700656b5b7ba01b3f39a64f8b36742ad82fc53073556e8b87eb12ccb04ed027f4cd07aa726519e54a7112c324306c41b1a9df8f06b04aebf07e0a881b02a5981555040bc63fe3410210f0bbfd26ada59f5cc73e5dfe7bc52faef2be82f5699891ace2ac8f84104b67f9a6e927a12791be72479e2a63732c457479228c3c8be34fdc880e44d0b6e46b909c1f8df7921fb320b166f4a54bfc276325afe4504ea9e4b270050676447dd6d4f6d7f96ce61562e166ceb56c1d0d7df5e269775ed4f553cf7726b75426d6164f0cfff973225c";
			configAndDecrypt();
			( result === null ).should.be.true; // eslint-disable-line no-unused-expressions
		} );
	} );

	describe( "when token is a buffer", () => {
		it( "should return token object", function () {
			token = Buffer.from( token, "hex" );
			configAndDecrypt();
			result.should.eql( version2TokenContents );
		} );
	} );

	describe( "when ticket version is not provided", () => {
		it( "should not check ticket version", () => {
			delete config.ticketVersion;
			configAndDecrypt();
			result.should.eql( version2TokenContents );
		} );
	} );

	describe( "when specified ticket version does not match", () => {
		it( "should throw", () => {
			config.ticketVersion = 3;
			expect( function() {
				configAndDecrypt();
			} ).to.throw( "Invalid ticket version" );
		} );
	} );

	describe( "when validation method is not specified", () => {
		it( "should use default of sha1", () => {
			delete config.validationMethod;
			configAndDecrypt();
			result.should.eql( version2TokenContents );
		} );
	} );

	describe( "when specified validation method is not supported", () => {
		it( "should return null", () => {
			config.validationMethod = "no-good";
			configAndDecrypt.should.throw( Error );
		} );
	} );

	describe( "when decryption method is not specified", () => {
		it( "should use default of aes", () => {
			delete config.decryptionMethod;
			configAndDecrypt();
			result.should.eql( version2TokenContents );
		} );
	} );

	describe( "when specified decryption method is not supported", () => {
		it( "should return null", () => {
			config.decryptionMethod = "no-good";
			configAndDecrypt.should.throw( Error );
		} );
	} );

	describe( "when initialization vector is not specified", () => {
		it( "should use default", () => {
			delete config.decryptionIV;
			configAndDecrypt();
			result.should.eql( version2TokenContents );
		} );
	} );

	describe( "when token is expired", () => {
		it( "should return null", () => {
			currentTime.setFullYear( currentTime.getFullYear() + 1 );
			configAndDecrypt();
			( result === null ).should.be.true; // eslint-disable-line no-unused-expressions
		} );
	} );

	describe( "when token is expired but validateExpiration is false", () => {
		it( "should return ticket object", () => {
			currentTime.setFullYear( currentTime.getFullYear() + 1 );
			config.validateExpiration = false;
			configAndDecrypt();
			result.should.eql( version2TokenContents );
		} );
	} );
} );

describe( "aspxauth#encrypt", () => {
	let aspxauth;

	function configure( opts ) {
		aspxauth = factory( Object.assign( {
			validationKey: "709FC62CDB7CC79821DEBB2062FDED6795AD8CB37341B55B3763923BEEF662865AF7EC613F9A76171CA3C336ED119D1C103555D87D092BAD4A63F807592B0520",
			decryptionKey: "9DA83917EE2DE9008FCB45986195A9BC11EF9496D67042C76B4052CEFA22EF45",
			validateExpiration: false
		}, opts ) );
	}

	function encrypt( ticket ) {
		return aspxauth.encrypt( Object.assign( {
			name: "fake name"
		}, ticket ) );
	}

	function test( incomingTicket, expectedTicket ) {
		const cookie = encrypt( incomingTicket );
		cookie.should.be.a( "string" ).and.match( /^[a-f0-9]+$/ );

		const actualTicket = aspxauth.decrypt( cookie );
		actualTicket.should.be.an( "object" );

		Object.keys( expectedTicket ).forEach( key => {
			if ( expectedTicket[ key ] instanceof Date ) {
				actualTicket[ key ].should.be.a( "date", `Expected ticket to have property ${ key } of type Date` );
				actualTicket[ key ].getTime().should.equal( expectedTicket[ key ].getTime(), `Expected ticket to have property ${ key } of ${ expectedTicket[ key ] }, but got ${ actualTicket[ key ] }` );
			} else {
				actualTicket.should.have.property( key, expectedTicket[ key ] );
			}
		} );
	}

	describe( "with no optional configuration", () => {
		before( () => {
			configure( {} );
		} );

		describe( "when issueDate is set", () => {
			it( "should use the set date", () => {
				const ticket = { issueDate: new Date( 2016, 0, 1, 0, 0, 0 ) };
				test( ticket, ticket );
			} );

			describe( "and expirationDate is missing", () => {
				it( "should use a 24 hour ttl", () => {
					const ticket = { issueDate: new Date( 2016, 0, 1, 0, 0, 0 ) };
					test( ticket, { expirationDate: new Date( 2016, 0, 2, 0, 0, 0 ) } );
				} );
			} );

			describe( "and expirationDate is set", () => {
				it( "should use the set expiration", () => {
					const ticket = { issueDate: new Date( 2016, 0, 1, 0, 0, 0 ), expirationDate: new Date( 2017, 0, 1, 0, 0, 0 ) };
					test( ticket, { expirationDate: new Date( 2017, 0, 1, 0, 0, 0 ) } );
				} );
			} );
		} );

		describe( "with no issueDate", () => {
			let clocks;

			before( () => {
				clocks = useFakeTimers();
			} );

			after( () => {
				clocks.restore();
			} );

			it( "should use the current date/time", () => {
				test( {}, { issueDate: new Date() } );
			} );

			describe( "and expirationDate is missing", () => {
				it( "should use a 24 hour ttl", () => {
					const tomorrow = new Date();
					tomorrow.setDate( tomorrow.getDate() + 1 );
					test( {}, { expirationDate: tomorrow } );
				} );
			} );

			describe( "and expirationDate is set", () => {
				it( "should use the set expiration", () => {
					const ticket = { expirationDate: new Date( 2017, 0, 1, 0, 0, 0 ) };
					test( ticket, { expirationDate: new Date( 2017, 0, 1, 0, 0, 0 ) } );
				} );
			} );
		} );

		describe( "when isPersistent is missing", () => {
			it( "should use the default", () => {
				test( {}, { isPersistent: false } );
			} );
		} );

		describe( "when isPersistent is set", () => {
			it( "should use the set value", () => {
				const ticket = { isPersistent: true };
				test( ticket, ticket );
			} );
		} );

		describe( "when cookiePath is missing", () => {
			it( "should use \"/\"", () => {
				test( {}, { cookiePath: "/" } );
			} );
		} );

		describe( "when cookiePath is set", () => {
			it( "should use the set cookiePath", () => {
				const ticket = { cookiePath: "/to/grandmothers/house" };
				test( ticket, ticket );
			} );
		} );

		describe( "when ticketVersion is missing", () => {
			it( "should use version one", () => {
				test( {}, { ticketVersion: 1 } );
			} );
		} );

		describe( "when ticketVersion is set", () => {
			it( "should add the set version", () => {
				const ticket = { ticketVersion: 7 };
				test( ticket, ticket );
			} );
		} );
	} );

	describe( "with defaultTTL", () => {
		before( () => {
			configure( { defaultTTL: 60000 } );
		} );

		describe( "when expirationDate is missing", () => {
			it( "should use the new default TTL", () => {
				const ticket = { issueDate: new Date( 2016, 0, 1, 0, 0, 0 ) };
				test( ticket, { expirationDate: new Date( 2016, 0, 1, 0, 1, 0 ) } );
			} );
		} );

		describe( "when expirationDate is set", () => {
			it( "should use the set expiration", () => {
				const ticket = { expirationDate: new Date( 2017, 0, 1 ) };
				test( ticket, ticket );
			} );
		} );
	} );

	describe( "with defaultPersistent", () => {
		before( () => {
			configure( { defaultPersistent: true } );
		} );

		describe( "when isPersistent is missing", () => {
			it( "should use the new default", () => {
				test( {}, { isPersistent: true } );
			} );
		} );

		describe( "when isPersistent is set", () => {
			it( "should use the set value", () => {
				const ticket = { isPersistent: false };
				test( ticket, ticket );
			} );
		} );
	} );

	describe( "with defaultCookiePath", () => {
		before( () => {
			configure( { defaultCookiePath: "/to/grandmothers/house" } );
		} );

		describe( "when cookiePath is missing", () => {
			it( "should use the default cookiePath", () => {
				test( {}, { cookiePath: "/to/grandmothers/house" } );
			} );
		} );

		describe( "when cookiePath is set", () => {
			it( "should use the set cookiePath", () => {
				const ticket = { cookiePath: "/home/again" };
				test( ticket, ticket );
			} );
		} );
	} );

	describe( "with required version", () => {
		before( () => {
			configure( { ticketVersion: 3 } );
		} );

		describe( "when ticketVersion is missing", () => {
			it( "should add the new default version", () => {
				test( {}, { ticketVersion: 3 } );
			} );
		} );

		describe( "when ticketVersion is wrong", () => {
			it( "should throw an error", () => {
				( () => encrypt( { ticketVersion: 2 } ) ).should.throw( "Invalid ticket version 2, expected 3" );
			} );
		} );

		describe( "when ticketVersion is correct", () => {
			it( "should use the set version", () => {
				const ticket = { ticketVersion: 3 };
				test( ticket, ticket );
			} );
		} );
	} );

	describe( "with encryptAsBuffer set to true", () => {
		before( () => {
			configure( { encryptAsBuffer: true } );
		} );

		it( "should return a buffer object", () => {
			encrypt( {} ).should.be.an.instanceof( Buffer );
		} );
	} );

	describe( "with mode dotnet45", () => {
		before( () => {
			configure( {
				validationMethod: "sha1",
				decryptionMethod: "aes",
				mode: "dotnet45"
			} );
		} );


		it( "should use dotnet45 for encryption and decryption", () => {
			const ticket = {
				ticketVersion: 1,
				issueDate: new Date( 2016, 0, 1, 0, 0, 0 ),
				expirationDate: new Date( 2050, 0, 1, 0, 0, 0 ),
				isPersistent: false,
				name: "test",
				customData: "custom data",
				cookiePath: "/"
			};
			test( ticket, ticket );
		} );
	} );
} );

