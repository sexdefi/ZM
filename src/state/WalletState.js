import Web3 from 'web3'
import { CHAIN_ID, CHAIN_SYMBOL, CHAIN_ERROR_TIP } from '../abi/config'
import toast from '../components/toast/toast'
class WalletState {
    wallet = {
        chainId: null,
        account: null,
        lang: "EN"
    }

    config = {
        //Heco
        ZM: "0x8d590cf8E013E989F1FcECd152dAEe306C5Af25A",
        MintPool: "0xa9748D153234Ea5AA3D47D7cd6CeDE48B6F1fa92",
        Migrate: "0x28752E283f7EF876Bc86318d2b09135331525Ff2",

        //BSC
        // ZM: "",
        // MintPool: "",
    }

    listeners = []

    constructor() {
        this.subcripeWeb3();
        this.getConfig();
    }
    //listen the wallet event
    async subcripeWeb3() {
        let page = this;
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', function (accounts) {
                page.connetWallet();
                // window.location.reload();
            });
            window.ethereum.on('chainChanged', function (chainId) {
                page.connetWallet();
                page.getConfig();
                // window.location.reload();
            });
        }
        // window.ethereum.on('connect', (connectInfo) => { });
        // window.ethereum.on('disconnect', (err) => { });
        // window.ethereum.isConnected();

        //         4001
        // The request was rejected by the user
        // -32602
        // The parameters were invalid
        // -32603
        // Internal error
    }

    async getConfig() {
        if (!Web3.givenProvider) {
            console.log("not wallet found");
        }

        var storage = window.localStorage;
        if (storage) {
            var lang = storage["lang"];
            if (lang) {
                this.wallet.lang = lang;
            }
        }
        console.log("config", this.config);
        this.notifyAll();
    }

    async connetWallet() {
        let provider = Web3.givenProvider || window.ethereum;
        console.log("provider", provider);
        if (provider) {
            Web3.givenProvider = provider;
            const web3 = new Web3(provider);
            const chainId = await web3.eth.getChainId();
            console.log(chainId);
            this.wallet.chainId = chainId;
            const accounts = await web3.eth.requestAccounts();
            console.log('accounts');
            console.log(accounts);
            this.wallet.account = accounts[0];
            //Test
            // this.wallet.account = "0x43e3931d57fdd866e104011997a530a531926908";
            this.notifyAll();
        } else {
            setTimeout(() => {
                this.connetWallet();
            }, 3000);
            // window.location.reload();
        }
    }

    changeLang(lang) {
        this.wallet.lang = lang;
        var storage = window.localStorage;
        if (storage) {
            storage["lang"] = lang;
        }
        this.notifyAll();
    }

    onStateChanged(cb) {
        this.listeners.push(cb);
    }

    removeListener(cb) {
        this.listeners = this.listeners.filter(item => item !== cb);
    }

    notifyAll() {
        for (let i = 0; i < this.listeners.length; i++) {
            const cb = this.listeners[i];
            cb();
        }
    }

}
export { CHAIN_ID, CHAIN_SYMBOL, CHAIN_ERROR_TIP };
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const MAX_INT = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
export default new WalletState();