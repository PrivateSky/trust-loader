import SpinnerService from "./services/SpinnerService.js";
import WalletService from "./services/WalletService.js";
import FileService from "./services/FileService.js";

function MainController() {

    const WALLET_LAST_UPDATE_TIMESTAMP_KEY = '__waletLastUpdated';
    const DEFAULT_PIN = '12345';

    const walletService = new WalletService();
    const fileService = new FileService();

    let pin;
    let spinner;

    /**
     * Return path to file relative to the `loader` folder
     *
     * @param {string} file
     * @return {string}
     */
    function getUrl(file) {
        let pathSegments = window.location.pathname.split('/');
        let loaderPath = pathSegments.pop();
        if (!loaderPath) {
            loaderPath = pathSegments.pop();
        }

        return `${loaderPath}/${file}`;
    }


    /**
     * Try and fetch 'loader-config.local.json' and overwrite
     * the standard configuration
     *
     * @param {callback} callback
     */
    function loadLocalConfiguration(callback) {
        const localConfigurationPath = getUrl('loader-config.local.json');

        fileService.getFile(localConfigurationPath, (err, data) => {
            if (err) {
                return callback();
            }

            let configuration;

            try {
                configuration = JSON.parse(data);
            } catch (e) {
                return callback();
            }

            APP_CONFIG = Object.assign(APP_CONFIG, configuration);
            callback();
        })
    }

    /**
     * Fetch the 'last-update.txt' file and compare the timestamp
     * with the one stored in local storage.
     *
     * @param {callback} callback
     */
    function checkForWalletUpdates(callback) {
        const lastUpdateFilename = getUrl('../last-update.txt');

        fileService.getFile(lastUpdateFilename, (err, data) => {
            if (err) {
                return callback(false);
            }

            const lastUpdateTimestamp = parseInt(data, 10);
            if (isNaN(lastUpdateTimestamp)) {
                return callback(false);
            }

            const walletLastUpdateTimestamp = parseInt(localStorage.getItem(WALLET_LAST_UPDATE_TIMESTAMP_KEY), 10);
            if (isNaN(walletLastUpdateTimestamp)) {
                return callback(true);
            }

            if (lastUpdateTimestamp > walletLastUpdateTimestamp) {
                return callback(true);
            }

            return callback(false);
        })
    }

    /**
     * Run the loader in development mode
     *
     * Create a default wallet with a default pin if none exists
     * and load it
     */
    function runInDevelopment() {
        walletService.hasSeedCage((result) => {
            pin = APP_CONFIG.DEVELOPMENT_PIN || DEFAULT_PIN;

            if (!result) {
                // Create a new wallet
                spinner.attachToView();
                walletService.setEDFSEndpoint(APP_CONFIG.EDFS_ENDPOINT);
                walletService.create(pin, (err, wallet) => {
                    if (err) {
                        return console.error(err);
                    }
                    localStorage.setItem(WALLET_LAST_UPDATE_TIMESTAMP_KEY, Date.now());
                    window.location.reload();
                });
                return;
            }

            // Load an existing wallet
            checkForWalletUpdates((hasUpdates) => {
                if (hasUpdates) {
                    // Unregister the service workers to allow wallet rebuilding
                    // and clear the cache
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                        if (!registrations || !registrations.length) {
                            return;
                        }

                        const unregisterPromises = registrations.map(reg => reg.unregister());
                        return Promise.all(unregisterPromises);
                    }).then((result) => {
                        if (result) {
                            // Reload the page after unregistering the service workers
                            return window.location.reload();
                        }

                        spinner.attachToView();

                        // After the all the service works have been unregistered and stopped
                        // rebuild the wallet
                        walletService.rebuild(pin, (err, wallet) => {
                            if (err) {
                                return console.error(err);
                            }

                            localStorage.setItem(WALLET_LAST_UPDATE_TIMESTAMP_KEY, Date.now());
                            console.log('Wallet was rebuilt.');
                            window.location.reload();
                        })
                    })
                    return;
                }

                // restore existing wallet
                controller.openWallet(new CustomEvent("test"));
            });
        })
    }

    this.init = function () {
        document.getElementsByTagName("title")[0].text = APP_CONFIG.appName;
        spinner = new SpinnerService(document.getElementsByTagName("body")[0]);

        loadLocalConfiguration(() => {
            if (APP_CONFIG.MODE === 'development') {
                return runInDevelopment();
            }

            this.initView();
        });
    }

    this.initView = function () {
        walletService.hasSeedCage((result) => {
            if (!result) {
                return this.displayContainer(APP_CONFIG.NEW_OR_RESTORE_CONTAINER_ID);
            }
            this.displayContainer(APP_CONFIG.PIN_CONTAINER_ID);
        })
    };

    this.displayContainer = function (containerId) {
        document.getElementById(containerId).style.display = "block";
    };

    this.validatePIN = function () {
        pin = document.getElementById("pin").value;
        let btn = document.getElementById("open-wallet-btn");

        if (pin.length >= APP_CONFIG.PIN_MIN_LENGTH) {
            btn.removeAttribute("disabled");
        } else {
            btn.setAttribute("disabled", "disabled");
        }
    };

    this.restore = function (event) {
        event.preventDefault();
        window.location = "./restore"
    };

    this.openWallet = function (event) {
        event.preventDefault();
        spinner.attachToView();
        walletService.restoreFromPin(pin, (err) => {
            if (err) {
                spinner.removeFromView();
                return document.getElementById("pin-error").innerText = "Invalid PIN";
            }

            loadRootSW((err) => {
                if (err) {
                    throw err;
                }

                walletService.load(pin, (err, wallet) => {
                    if (err) {
                        console.error(err);
                        return console.error("Operation failed. Try again");
                    }
                    console.log(`Loading wallet ${wallet.getSeed()}`);

                    const PskCrypto = require("pskcrypto");
                    const hexDigest = PskCrypto.pskHash(wallet.getSeed(), "hex");

                    loadIframeInDOM(hexDigest, wallet.getSeed());
                })
            })

        })
    };

    function loadIframeInDOM(hexDigest, seed){
        let iframe = document.createElement("iframe");
        iframe.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms");
        iframe.setAttribute("frameborder","0");
        iframe.style.overflow = "hidden";
        iframe.style.height = "100%";
        iframe.style.width = "100%";
        iframe.style.display = "block";
        iframe.style.zIndex="100";
        let currentLocation = window.location;
        iframe.src=currentLocation+"iframe/"+hexDigest;

        window.addEventListener("message",(event)=>{
            if(event.data.appIdentity){
                if(event.data.appIdentity === hexDigest){
                    iframe.contentWindow.postMessage({seed:seed},iframe.src);
                }
            }

            if (event.data.status === "completed") {
                document.write(`<html>
                <body>
                <style>
                html, body {margin:0; padding: 0;}
                </style>
                ${iframe.outerHTML}
                </body>
                </html>`);
            }

            if (event.data.status === "error") {
                //handle error;
            }
        });

        navigator.serviceWorker.addEventListener('message', (e) => {
            if (!e.data || e.data.query !== 'seed') {
                return;
            }

            const swWorkerIdentity = e.data.identity;
            if (swWorkerIdentity === hexDigest) {
                e.source.postMessage({
                    seed: seed
                });
            }
        })

        document.body.appendChild(iframe);

    }


    function loadRootSW(callback){
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('swLoader.js').then(function(reg) {
                callback(undefined);
            }).catch(function(err) {
                callback(err);
            });
        }
    }
}

let controller = new MainController();
document.addEventListener("DOMContentLoaded", function () {
    controller.init();
});
window.controller = controller;
