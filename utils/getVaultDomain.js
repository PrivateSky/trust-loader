export default function () {
    if (LOADER_GLOBALS.environment.vaultDomain) {
        return LOADER_GLOBALS.environment.vaultDomain;
    } else {
        console.log(`The property <domain> is deprecated in environment.js. Use the property <vaultDomain> instead`)
        return LOADER_GLOBALS.environment.domain;
    }
}