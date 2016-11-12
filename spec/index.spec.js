/* eslint-env mocha */
/* eslint max-lines: ["error", 200]*/

import factory from "../src/index";
import { useFakeTimers } from "sinon";
import chai from "chai";
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
		it( "should return token object", function() {
			configAndDecrypt();
			result.should.eql( version2TokenContents );
		} );
	} );

	describe( "when token is not valid", () => {
		it( "should return null", function() {
			token = "87";
			configAndDecrypt();
			( result === null ).should.be.true; // eslint-disable-line no-unused-expressions
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
		it( "should return null", () => {
			config.ticketVersion = 3;
			configAndDecrypt();
			( result === null ).should.be.true; // eslint-disable-line no-unused-expressions
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
