import React, { Component } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

import WalletState, { CHAIN_ID, CHAIN_ERROR_TIP } from './state/WalletState'
import toast from './components/toast/toast'
import "./common.css"
import './App.css'
import Mint from './pages/Mint/Mint'

class App extends Component {
    state = { account: null, chainId: null, shortAccount: null }

    constructor(props) {
        super(props);
        this.connetWallet = this.connetWallet.bind(this);
    }

    componentDidMount() {
        WalletState.onStateChanged(this.handleAccountsChanged);
        WalletState.connetWallet();
        this.saveRef();
    }

    //保存链接里的邀请人在浏览器的缓存中,单页面应用，应用入口组件处调用
    saveRef() {
        var url = window.location.href;
        var obj = new Object();
        var scan_url = url.split("?");
        if (2 == scan_url.length) {
            scan_url = scan_url[1];
            var strs = scan_url.split("&");
            for (var x in strs) {
                var arr = strs[x].split("=");
                obj[arr[0]] = arr[1];
                //邀请人保存在浏览器的 localStorage 里
                if ("ref" == arr[0] && arr[1]) {
                    var storage = window.localStorage;
                    if (storage) {
                        storage["ref"] = arr[1];
                    }
                }
            }
        }
        return obj;
    }

    componentWillUnmount() {
        WalletState.removeListener(this.handleAccountsChanged)
    }

    connetWallet() {
        WalletState.connetWallet();
    }

    handleAccountsChanged = () => {
        const wallet = WalletState.wallet;
        if (wallet.chainId && wallet.chainId != CHAIN_ID) {
            toast.show(CHAIN_ERROR_TIP);
            return;
        }
        let page = this;
        page.setState({
            account: wallet.account,
            chainId: wallet.chainId
        });
    }

    render() {
        return (
            <Router>
                <div className='App'>
                    <div>
                        <Routes>
                            <Route path="/" exact element={<Mint />}></Route>
                            <Route path="/mint" exact element={<Mint />}></Route>
                        </Routes>
                    </div>
                </div>
            </Router>
        );
    }
}

export default App;