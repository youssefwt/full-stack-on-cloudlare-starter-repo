import { LinkSchemaType } from "@repo/data-ops/zod-schema/links";

export function getDestinationForCountry(linkInfo: LinkSchemaType, countryCode?: string) {
	// Check if the country code exists in destinations
	if (countryCode && linkInfo.destinations[countryCode]) {
		return linkInfo.destinations[countryCode];
	}

	// Fallback to default
	return linkInfo.destinations.default;
}

