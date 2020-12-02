import { IBech32AddressDetails } from "../../../models/IBech32AddressDetails";

export interface Bech32AddressProps {
    /**
     * Active links.
     */
    activeLinks: boolean;

    /**
     * The address details.
     */
    addressDetails?: IBech32AddressDetails;
}
