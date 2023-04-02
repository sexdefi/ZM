import React, { Component } from 'react'
import { withNavigation } from '../../hocs'
import "../Token/Token.css"
import "../NFT/NFT.css"
import WalletState, { CHAIN_ID, ZERO_ADDRESS, CHAIN_ERROR_TIP, CHAIN_SYMBOL, MAX_INT } from '../../state/WalletState';
import loading from '../../components/loading/Loading'
import toast from '../../components/toast/toast'
import Web3 from 'web3'
import { ERC20_ABI } from "../../abi/erc20"
import { MintPool_ABI } from "../../abi/MintPool_ABI"
import { showCountdownTime, showFromWei, showLongAccount, toWei } from '../../utils'
import BN from 'bn.js'

import Header from '../Header';
import copy from 'copy-to-clipboard';
import { ZM_ABI } from '../../abi/ZM_ABI';
import { Migrate_ABI } from '../../abi/Migrate_ABI';

class Mint extends Component {
    state = {
        chainId: 0,
        account: "",
        lang: "EN",
        local: {},
        amountIn: "",
        migrateIn: "",
    }
    constructor(props) {
        super(props);
        this.refreshInfo = this.refreshInfo.bind(this);
    }
    componentDidMount() {
        this.handleAccountsChanged();
        WalletState.onStateChanged(this.handleAccountsChanged);
        this.refreshInfo();
    }

    componentWillUnmount() {
        WalletState.removeListener(this.handleAccountsChanged);
        if (this._refreshInfoIntervel) {
            clearInterval(this._refreshInfoIntervel);
        }
    }

    handleAccountsChanged = () => {
        console.log(WalletState.wallet.lang);
        const wallet = WalletState.wallet;
        let page = this;
        page.setState({
            chainId: wallet.chainId,
            account: wallet.account,
            lang: WalletState.wallet.lang,
            local: page.getLocal()
        });
        this.getInfo();
    }

    getLocal() {
        let local = {};
        return local;
    }

    _refreshInfoIntervel;
    refreshInfo() {
        if (this._refreshInfoIntervel) {
            clearInterval(this._refreshInfoIntervel);
        }
        this._refreshInfoIntervel = setInterval(() => {
            this.getInfo();
        }, 3000);
    }

    async getInfo() {
        if (WalletState.wallet.chainId != CHAIN_ID) {
            return;
        }
        try {
            const web3 = new Web3(Web3.givenProvider);
            let usdtDecimals = 18;

            //ZM代币合约
            const zmContract = new web3.eth.Contract(ZM_ABI, WalletState.config.ZM);
            //获取代币汇总信息
            const totalInfo = await zmContract.methods.getTotalInfo().call();
            //LP总量
            let totalLP = new BN(totalInfo[0], 10);
            //LP总价值
            let lpUAmount = new BN(totalInfo[1], 10);
            //代币总量
            let total = new BN(totalInfo[2], 10);
            //流通数量
            let validTotal = new BN(totalInfo[3], 10);
            //代币价格
            let price = new BN(totalInfo[4], 10);
            //代币今天的初始价格
            let todayPrice = new BN(totalInfo[5], 10);
            //持有人
            let holderNum = parseInt(totalInfo[6]);
            //超级节点质押LP条件
            let largeNFTLPCondition = new BN(totalInfo[7], 10);
            //超级节点团队质押LP条件
            let largeNFTTeamLPCondition = new BN(totalInfo[8], 10);
            //社区节点质押LP条件
            let littleNFTLPCondition = new BN(totalInfo[9], 10);
            //社区节点团队质押LP条件
            let littleNFTTeamLPCondition = new BN(totalInfo[10], 10);
            //价格涨幅
            let priceUp = 0;
            if (!todayPrice.isZero()) {
                let priceRate = price.mul(new BN(10000)).div(todayPrice).toNumber() / 100;
                priceUp = priceRate - 100;
            }

            //迁移合约
            const migrateContract = new web3.eth.Contract(Migrate_ABI, WalletState.config.Migrate);
            //获取迁移合约基本信息
            const migrateInfo = await migrateContract.methods.baseInfo().call();
            //旧代币合约
            let oldTokenAddress = migrateInfo[0];
            //是否开放
            let startMigrate = migrateInfo[7];

            //挖矿合约
            const mintContract = new web3.eth.Contract(MintPool_ABI, WalletState.config.MintPool);
            //获取基本信息
            const baseInfo = await mintContract.methods.getBaseInfo().call();
            //LP代币合约
            let lpToken = baseInfo[0];
            //LP代币精度
            let lpTokenDecimals = parseInt(baseInfo[1]);
            //LP代币符号
            let lpTokenSymbol = baseInfo[2];
            //分红代币合约
            let rewardToken = baseInfo[3];
            //分红代币精度
            let rewardTokenDecimals = parseInt(baseInfo[4]);
            //分红代币符号
            let rewardTokenSymbol = baseInfo[5];
            //挖矿代币合约
            let mintRewardToken = baseInfo[6];
            //挖矿代币精度
            let mintRewardTokenDecimals = parseInt(baseInfo[7]);
            //挖矿代币符号
            let mintRewardTokenSymbol = baseInfo[8];

            //获取矿池信息
            const poolInfo = await mintContract.methods.getPoolInfo().call();
            //总质押
            let totalAmount = new BN(poolInfo[0], 10);

            //质押LP价值
            let stakeLPUAmount = new BN(0);
            if (!totalLP.isZero()) {
                stakeLPUAmount = lpUAmount.mul(totalAmount).div(totalLP)
            }

            //代币总市值
            let totalUValue = price.mul(total).div(new BN(10).pow(new BN(rewardTokenDecimals)));
            this.setState({
                price: showFromWei(price, usdtDecimals, 4),
                priceUp: priceUp,
                total: showFromWei(total, rewardTokenDecimals, 2),
                validTotal: showFromWei(validTotal, rewardTokenDecimals, 2),
                totalUValue: showFromWei(totalUValue, rewardTokenDecimals, 2),
                holderNum: holderNum,
                lpToken: lpToken,
                lpTokenDecimals: lpTokenDecimals,
                lpTokenSymbol: lpTokenSymbol,
                showTotalAmount: showFromWei(totalAmount, lpTokenDecimals, 6),
                showStakeLPUAmount: showFromWei(stakeLPUAmount, 18, 2),
                rewardTokenSymbol: rewardTokenSymbol,
                mintRewardTokenSymbol: mintRewardTokenSymbol,
                oldTokenAddress: oldTokenAddress,
                startMigrate: startMigrate,
                largeNFTLPCondition: showFromWei(largeNFTLPCondition, usdtDecimals, 2),
                largeNFTTeamLPCondition: showFromWei(largeNFTTeamLPCondition, usdtDecimals, 2),
                littleNFTLPCondition: showFromWei(littleNFTLPCondition, usdtDecimals, 2),
                littleNFTTeamLPCondition: showFromWei(littleNFTTeamLPCondition, usdtDecimals, 2),
            })

            let account = WalletState.wallet.account;
            if (account) {
                //获取用户迁移合约信息
                const userMigrateInfo = await migrateContract.methods.getUserInfo(account).call();
                //旧代币余额
                let oldTokenBalance = new BN(userMigrateInfo[0], 10);
                //旧代币授权数量
                let oldTokenAllowance = new BN(userMigrateInfo[1], 10);

                //获取用户挖矿信息
                const userMintInfo = await mintContract.methods.getUserInfo(account).call();
                //质押数量
                let amount = new BN(userMintInfo[0], 10);
                //lp余额
                let lpBalance = new BN(userMintInfo[1], 10);
                //授权额度
                let lpAllowance = userMintInfo[2];
                //待领取代币奖励
                let pendingToken = userMintInfo[3];
                //待领取LP奖励
                let pendingLP = userMintInfo[4];
                //待领取挖矿奖励
                let pendingMintReward = userMintInfo[5];
                //团队人数
                let teamNum = parseInt(userMintInfo[6]);
                //团队质押LP数量
                let teamLPAmount = new BN(userMintInfo[7], 10);
                //团队质押LP的价值
                let teamLPUValue = new BN(0);
                let lpUValue = new BN(0);
                if (!totalLP.isZero()) {
                    teamLPUValue = lpUAmount.mul(teamLPAmount).div(totalLP);
                    lpUValue = lpUAmount.mul(amount).div(totalLP);
                }

                //获取用户NFT
                const userNFTInfo = await zmContract.methods.getUserNFTInfo(account).call();
                //代币余额
                let tokenBalance = new BN(userNFTInfo[0], 10);
                //NFT累计分红数量
                let largeNFTReward = userNFTInfo[1];
                //NFT累计分红数量
                let littleNFTReward = userNFTInfo[2];
                //超级节点NFT数量
                let largeNFTBalance = parseInt(userNFTInfo[3]);
                //社区节点NFT数量
                let littleNFTBalance = parseInt(userNFTInfo[4]);

                this.setState({
                    oldTokenBalance: oldTokenBalance,
                    oldTokenAllowance: oldTokenAllowance,
                    showOldTokenBalance: showFromWei(oldTokenBalance, rewardTokenDecimals, 4),
                    showAmount: showFromWei(amount, lpTokenDecimals, 6),
                    lpBalance: lpBalance,
                    showLPBalance: showFromWei(lpBalance, lpTokenDecimals, 6),
                    lpAllowance: lpAllowance,
                    pendingToken: showFromWei(pendingToken, rewardTokenDecimals, 4),
                    pendingLP: showFromWei(pendingLP, lpTokenDecimals, 6),
                    pendingMintReward: showFromWei(pendingMintReward, mintRewardTokenDecimals, 4),
                    tokenBalance: showFromWei(tokenBalance, rewardTokenDecimals, 4),
                    largeNFTReward: showFromWei(largeNFTReward, usdtDecimals, 4),
                    littleNFTReward: showFromWei(littleNFTReward, usdtDecimals, 4),
                    largeNFTBalance: largeNFTBalance,
                    littleNFTBalance: littleNFTBalance,
                    teamNum: teamNum,
                    lpUValue: showFromWei(lpUValue, usdtDecimals, 2),
                    teamLPUValue: showFromWei(teamLPUValue, usdtDecimals, 2),
                });
            }
        } catch (e) {
            console.log("getInfo", e);
            toast.show(e.message);
        } finally {
        }
    }

    //输入框变化
    handleAmountChange(event) {
        let amount = this.state.amountIn;
        if (event.target.validity.valid) {
            amount = event.target.value;
        }
        this.setState({ amountIn: amount });
    }

    //输入框变化
    handleMigrateInChange(event) {
        let amount = this.state.migrateIn;
        if (event.target.validity.valid) {
            amount = event.target.value;
        }
        this.setState({ migrateIn: amount });
    }

    connectWallet() {
        WalletState.connetWallet();
    }

    //质押挖矿
    async deposit() {
        if (WalletState.wallet.chainId != CHAIN_ID || !WalletState.wallet.account) {
            toast.show(CHAIN_ERROR_TIP);
            return;
        }
        loading.show();
        try {
            //输入质押数量
            let amount = toWei(this.state.amountIn, this.state.lpTokenDecimals);
            //可用LP
            var lpBalance = this.state.lpBalance;
            if (lpBalance.lt(amount)) {
                toast.show("LP余额不足");
                // return;
            }

            const web3 = new Web3(Web3.givenProvider);
            let account = WalletState.wallet.account;
            let approvalNum = new BN(this.state.lpAllowance, 10);
            //LP授权额度不够了，需要重新授权
            if (approvalNum.lt(amount)) {
                const tokenContract = new web3.eth.Contract(ERC20_ABI, this.state.lpToken);
                var transaction = await tokenContract.methods.approve(WalletState.config.MintPool, MAX_INT).send({ from: account });
                if (!transaction.status) {
                    toast.show("授权失败");
                    return;
                }
            }
            const mintContract = new web3.eth.Contract(MintPool_ABI, WalletState.config.MintPool);
            //邀请人
            let invitor = this.getRef();
            if (!invitor) {
                invitor = ZERO_ADDRESS;
            }
            //质押挖矿
            var estimateGas = await mintContract.methods.deposit(amount, invitor).estimateGas({ from: account });
            var transaction = await mintContract.methods.deposit(amount, invitor).send({ from: account });
            if (transaction.status) {
                toast.show("参与挖矿成功");
            } else {
                toast.show("参与失败");
            }
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    //获取邀请人
    getRef() {
        //先从链接获取，如果有，直接使用
        var url = window.location.href;
        var obj = new Object();
        var scan_url = url.split("?");
        if (2 == scan_url.length) {
            scan_url = scan_url[1];
            var strs = scan_url.split("&");
            for (var x in strs) {
                var arr = strs[x].split("=");
                obj[arr[0]] = arr[1];
                //链接里有邀请人
                if ("ref" == arr[0] && arr[1]) {
                    return arr[1];
                }
            }
        }
        //从浏览器缓存获取，这里可能部分浏览器不支持
        var storage = window.localStorage;
        if (storage) {
            return storage["ref"];
        }
        return null;
    }

    //全部赎回
    async withdraw() {
        let account = WalletState.wallet.account;
        if (!account) {
            this.connectWallet();
            return;
        }
        loading.show();
        try {
            const web3 = new Web3(Web3.givenProvider);
            const mintContract = new web3.eth.Contract(MintPool_ABI, WalletState.config.MintPool);
            var estimateGas = await mintContract.methods.withdraw().estimateGas({ from: account });
            var transaction = await mintContract.methods.withdraw().send({ from: account });
            if (transaction.status) {
                toast.show("赎回成功");
            } else {
                toast.show("赎回失败");
            }
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    //领取奖励
    async claim() {
        let account = WalletState.wallet.account;
        if (!account) {
            this.connectWallet();
            return;
        }
        loading.show();
        try {
            const web3 = new Web3(Web3.givenProvider);
            const mintContract = new web3.eth.Contract(MintPool_ABI, WalletState.config.MintPool);
            var estimateGas = await mintContract.methods.claim().estimateGas({ from: account });
            var transaction = await mintContract.methods.claim().send({ from: account });
            if (transaction.status) {
                toast.show("领取成功");
            } else {
                toast.show("领取失败");
            }
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    //邀请好友
    invite() {
        if (WalletState.wallet.account) {
            var url = window.location.href;
            url = url.split("?")[0];
            let inviteLink = url + "?ref=" + WalletState.wallet.account;
            if (copy(inviteLink)) {
                toast.show("邀请链接已复制")
            } else {
                toast.show("邀请失败")
            }
        }

    }

    //迁移
    async migrate() {
        if (WalletState.wallet.chainId != CHAIN_ID || !WalletState.wallet.account) {
            toast.show(CHAIN_ERROR_TIP);
            return;
        }
        if (!this.state.startMigrate) {
            toast.show("未开放迁移");
            //return;
        }
        loading.show();
        try {
            //输入迁移数量
            let amount = toWei(this.state.migrateIn, this.state.rewardTokenDecimals);
            //旧代币数量
            var oldTokenBalance = new BN(this.state.oldTokenBalance, 10);
            if (oldTokenBalance.lt(amount)) {
                toast.show("余额不足");
                // return;
            }

            const web3 = new Web3(Web3.givenProvider);
            let account = WalletState.wallet.account;
            let approvalNum = new BN(this.state.oldTokenAllowance, 10);
            //LP授权额度不够了，需要重新授权
            if (approvalNum.lt(amount)) {
                const tokenContract = new web3.eth.Contract(ERC20_ABI, this.state.oldTokenAddress);
                var transaction = await tokenContract.methods.approve(WalletState.config.Migrate, MAX_INT).send({ from: account });
                if (!transaction.status) {
                    toast.show("授权失败");
                    return;
                }
            }
            const migrateContract = new web3.eth.Contract(Migrate_ABI, WalletState.config.Migrate);
            //迁移代币
            var estimateGas = await migrateContract.methods.migrate(amount).estimateGas({ from: account });
            var transaction = await migrateContract.methods.migrate(amount).send({ from: account });
            if (transaction.status) {
                toast.show("迁移成功");
            } else {
                toast.show("迁移失败");
            }
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    render() {
        return (
            <div className="Token NFT">
                <Header></Header>
                <div className='Module ModuleTop'>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>代币价格</div>
                        <div>${this.state.price}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>涨幅</div>
                        <div>{this.state.priceUp}%</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>代币总量</div>
                        <div>{this.state.total}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>代币流通量</div>
                        <div>{this.state.validTotal}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>代币总市值</div>
                        <div>{this.state.totalUValue}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>持有人</div>
                        <div>{this.state.holderNum}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>代币余额</div>
                        <div>{this.state.tokenBalance}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>旧代币余额</div>
                        <div>{this.state.showOldTokenBalance}</div>
                    </div>
                    <div className='InputBg mt10'>
                        <input className="Input" type="text" value={this.state.migrateIn}
                            placeholder='请输入迁移数量'
                            onChange={this.handleMigrateInChange.bind(this)} pattern="[0-9.]*" >
                        </input>
                    </div>
                    <div className='mt10 prettyBg button' onClick={this.migrate.bind(this)}>迁移</div>
                </div>

                <div className='Module ModuleTop'>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>总质押流动性</div>
                        <div>${this.state.showStakeLPUAmount}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>总质押数量</div>
                        <div>{this.state.showTotalAmount}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>个人质押</div>
                        <div>{this.state.showAmount}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt5'>
                        <div>LP余额</div>
                        <div>{this.state.showLPBalance}</div>
                    </div>
                    <div className='InputBg mt10'>
                        <input className="Input" type="text" value={this.state.amountIn}
                            placeholder='请输入质押数量'
                            onChange={this.handleAmountChange.bind(this)} pattern="[0-9.]*" >
                        </input>
                    </div>
                    <div className='mt10 prettyBg button' onClick={this.deposit.bind(this)}>质押</div>
                    <div className='mt10 prettyBg button' onClick={this.withdraw.bind(this)}>全部赎回</div>
                </div>

                <div className='Module ModuleTop'>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>待领取ZM</div>
                        <div>{this.state.pendingToken}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>待领取ZM2</div>
                        <div>{this.state.pendingMintReward}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>待领取LP</div>
                        <div>{this.state.pendingLP}</div>
                    </div>
                    <div className='mt10 prettyBg button' onClick={this.claim.bind(this)}>领取奖励</div>
                    <div className='mt10 prettyBg button' onClick={this.invite.bind(this)}>邀请好友</div>
                </div>

                <div className='Module ModuleTop mb40'>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>超级节点NFT累计分红</div>
                        <div>{this.state.largeNFTReward}U</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>社区节点NFT累计分红</div>
                        <div>{this.state.littleNFTReward}U</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>持有超级节点NFT</div>
                        <div>{this.state.largeNFTBalance}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>持有社区节点NFT</div>
                        <div>{this.state.littleNFTBalance}</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt10'>
                        <div>超级节点NFT质押条件</div>
                        <div>{this.state.largeNFTLPCondition}U</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>超级节点NFT团队质押条件</div>
                        <div>{this.state.largeNFTTeamLPCondition}U</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>社区节点NFT质押条件</div>
                        <div>{this.state.littleNFTLPCondition}U</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>社区节点NFT团队质押条件</div>
                        <div>{this.state.littleNFTTeamLPCondition}U</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle mt10'>
                        <div>质押LP价值</div>
                        <div>{this.state.lpUValue}U</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>团队质押LP价值</div>
                        <div>{this.state.teamLPUValue}U</div>
                    </div>
                    <div className='ModuleContentWitdh RuleTitle'>
                        <div>团队人数</div>
                        <div>{this.state.teamNum}</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withNavigation(Mint);