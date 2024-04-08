import { XMLParser } from 'fast-xml-parser';

import { castArray } from './utils.mjs';


/**
 * Filter AssertionConsumerService and obtain SAML entrypoint and binding
 *
 * @input {Object} IDPSSODescriptor
 * @returns {[string, string]}
 */
const getAssertionConsumerService = (IDPSSODescriptor) => {
	// Find entrypoint for SAML authentication
	const assertionConsumerService =
		// eslint-disable-next-line
		castArray(IDPSSODescriptor.SingleSignOnService).find(
			(element) =>
				element['@_Binding'] === 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'
		)
		??
		// eslint-disable-next-line
		castArray(IDPSSODescriptor.SingleSignOnService).find(
			(element) =>
				element['@_Binding'] === 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST'
		);

	// Get portal URL
	const entryPoint = assertionConsumerService?.['@_Location'];
	// Get requested binding type
	// eslint-disable-next-line
	const authnRequestBinding = assertionConsumerService?.['@_Binding']?.split(':').pop();

	// Check for result
	if (!entryPoint) {
		throw new Error('AssertionConsumerService location not recognized');
	}
	// Check for result
	if (!authnRequestBinding) {
		throw new Error('AssertionConsumerService binding method not recognized');
	}

	return [entryPoint, authnRequestBinding];
};


/**
 * Extracts IDP certificates for signature/encryption
 *
 * @input {Object} IDPSSODescriptor
 * @returns {Array<string>}
 */
const getIDPCerts = (IDPSSODescriptor) => {
	return castArray(IDPSSODescriptor.KeyDescriptor)
		// Get raw X509 certs
		.map((keyinfo) => keyinfo.KeyInfo.X509Data.X509Certificate)
		// Get only unique values
		.filter((value, index, array) => array.indexOf(value) === index);
};


/**
 * Extract SingleLogoutService URL
 *
 * @input {Object} IDPSSODescriptor
 * @input {string} authnRequestBinding
 * @returns {string}
 */
const getSingleLogoutService = (IDPSSODescriptor, authnRequestBinding) => {
	return castArray(IDPSSODescriptor.SingleLogoutService)
		.find((element) =>
			element['@_Binding'] === `urn:oasis:names:tc:SAML:2.0:bindings:${authnRequestBinding}`
		)
		?.['@_Location'];
};


/**
 * Consume IDP medatada XML and return partial passport-saml passport
 *
 * @param  {string} inout
 * @returns {Object}
 */
export const parseString = (input) => {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '@_',
	});
	const jsonXML = parser.parse(input);

	// We only need this XML node
	const IDPSSODescriptor = jsonXML?.EntityDescriptor?.IDPSSODescriptor;

	// Error if not found
	if (!IDPSSODescriptor) {
		throw new Error('IDPSSODescriptor is missing');
	}

	// Parse SAML entrypoint and request binding
	const [entryPoint, authnRequestBinding] = getAssertionConsumerService(IDPSSODescriptor);

	// Get IDP certificates
	const cert = getIDPCerts(IDPSSODescriptor);

	// Get logout service location
	const logoutUrl = getSingleLogoutService(IDPSSODescriptor, authnRequestBinding);

	const passportConfig = {
		// SAML entry point
		entryPoint,
		// SAML AuthNRequest binding
		authnRequestBinding,
		// IdP certificates for validation
		cert,
		// SAML logout service
		logoutUrl
	};

	return passportConfig;
};
