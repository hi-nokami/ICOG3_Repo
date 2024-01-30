import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { useEffect, useRef, useState } from "react";
import { providers, Contract, utils, BigNumber } from "ethers";
import {
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI,
} from "../constants/index";
import { useRouter } from "next/router";
import { IoArrowForwardSharp } from "react-icons/io5";

export default function Home() {
  const zero = BigNumber.from(0);
  const [congratulationVisible, setCongratulationVisible] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // to check if wallet is connected
  const [walletConnected, setWalletConnected] = useState(false);

  // To check total number of minted token
  const [totalTokensToBeMinted, setTotalTokensToBeMinted] = useState(zero);

  // TO store the balance of indivisual addresses
  const [balanceOfCryptoDevToken, setBalanceOfCryptoDevToken] = useState(zero);

  // To capture the input from the user
  const [tokensToBeMintedByUser, setTokensToBeMintedByUser] = useState(zero);

  // to store tokens to be claimed by user
  const [tokensToBeClaimed, settokensToBeClaimed] = useState("");

  // to check loading
  const [loading, setLoading] = useState(false);

  // to reload the page
  const router = useRouter();

  // To store the instance of web3 modal
  const web3ModalRef = useRef();

  const claimCryptoDevToken = async () => {
    try {
      console.log("Claiming Crypto dev toekns");
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      setLoading(true);
      const txn = await tokenContract.claim();
      await txn.wait();

      alert("Congratulations you have claimed your NFT tokens");
      setLoading(false);

      await getnumberOfMintedTokens();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Check wheter user have NFT minted or not if yes shows the balance of token that can be minted
  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();

      const balance = await nftContract.balanceOf(address);
      balance = balance.toString();

      // console.log("Balance is", balance);

      if (balance == 0) {
        settokensToBeClaimed("0");
      } else {
        var amount = 0;
        for (var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdClaimed(tokenId);

          if (!claimed) {
            amount++;
          }
        }

        settokensToBeClaimed(amount.toString());
        console.log("Tokens To be Claimed", amount.toString());
      }
    } catch (err) {
      console.log(err);
      settokensToBeClaimed("0");
    }
  };

  const mintToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const CryptoDevContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const value = 0.001 * amount;

      setLoading(true);
      const txn = await CryptoDevContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      await txn.wait();

      setCongratulationVisible(true);

      // Hide the message after 5 seconds
      setTimeout(() => {
        setCongratulationVisible(false);
      }, 5000);


      setLoading(false);

      await getnumberOfMintedTokens();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getnumberOfMintedTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const CryptoDevContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      // Give the total of the minted coins
      const _totalSupply = await CryptoDevContract.totalSupply();
      // console.log("Total Supply of ethers", _totalSupply.toString());

      // Setting the total minted totens
      setTotalTokensToBeMinted(_totalSupply.toString());

      const address = await signer.getAddress();
      // console.log("Address ", address);

      // Gives the balance of the address
      const balanceOfAddress = await CryptoDevContract.balanceOf(address);
      // console.log(`Balance of ${address} is ${balanceOfAddress.toString()}`);

      // Setting the balance of the address
      setBalanceOfCryptoDevToken(balanceOfAddress.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const txn = await tokenContract.withdraw();
      // setLoading(true);
      await txn.wait();
      // setLoading(false);
      await getOwner();
    } catch (err) {
      console.error(err);
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // call the owner function from the contract
      const _owner = await tokenContract.owner();

      console.log("Owner", _owner);
      // we get signer to extract address of currently connected Metamask account
      const signer = await getProviderOrSigner(true);

      console.log("signer", await signer.getAddress());
      // Get the address associated to signer which is connected to Metamask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const getProviderOrSigner = async (signer = false) => {
    try {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 80001) {
        alert("Change the network to mumbai");
        throw new Error("Change the network to mumbai");
      }

      if (signer) {
        const signer = await web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      // we update the state of the provider

      const provider = await web3ModalRef.current.connect();
      provider.on("accountsChanged", () => {
        router.reload(window.location.pathname);
      });
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
    // we get a provider
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onPageLoad = async () => {
    try {
      await connectWallet();
      // console.log("Wallet connected", walletConnected);

      await getnumberOfMintedTokens();
      await getTokensToBeClaimed();
      await getOwner();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        disableInjectedProvider: false,
        providerOptions: {},
      });
    }
    onPageLoad();
  }, [walletConnected, onPageLoad]);

  const renderConnectButton = () => {
    if (!walletConnected) {
      return (
        <div className="flex justify-center mt-16">
          <button
            className="bg-[#3783ede5] text-white z-10 rounded-lg px-3 p-2 flex gap-2 items-center justify-center pop"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        </div>
      );
    }
  };

  const renderMint = () => {
    if (parseInt(tokensToBeClaimed.toString())) {
      return (
        <div>
          {loading ? (
            <h1>Minting your claimed tokens ...</h1>
          ) : (
            <>
              <div className={styles.description}>
                {tokensToBeClaimed.toString() * 10} Tokens can be claimed!
              </div>
              <button className={styles.button} onClick={claimCryptoDevToken}>
                Claim Tokens
              </button>
            </>
          )}
        </div>
      );
    }

    if (walletConnected && !parseInt(tokensToBeClaimed?.toString())) {
      return (
        <div className={styles.description}>
          {loading ?
          (
            <div className="flex justify-center type z-10 mt-16 gap-4 flex-col items-center">
              <h1 className="z-10 type text-2xl">Minting Your Token ... </h1>
              <img src="/gif/shrio.gif" alt=".." className="z-10 w-[200px]"/>
            </div>
          )
          
          :  (
            <div className="flex justify-center flex-col items-center p-3 mt-4 z-10">
              <div className="flex flex-col items-center gap-4 type">
                <div className="type tracking-wider text-white z-10">
                  Claim or Mint Crypto G3 tokens here!!!
                </div>
                <input
                  className="border-none outline-none px-2 p-2 rounded text-black z-10 font-extrabold text-lg  text-center"
                  type="number"
                  placeholder="Amount Of Tokens"
                  onChange={(e) => {
                    try {
                      setTokensToBeMintedByUser(BigNumber.from(e.target.value));
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                />
              </div>
              <br />
              <button
                className="bg-[#3783ede5] text-white z-10 rounded-lg px-3 p-2 flex gap-2 items-center justify-center pop mt-4"
                onClick={() => mintToken(tokensToBeMintedByUser)}
              >
                Mint Tokens <IoArrowForwardSharp />
              </button>
            </div>
          ) }
        </div>
      );
    }
  };

  const renderWithdraw = () => {
    if (isOwner && walletConnected) {
      return (
        <button className={styles.button} onClick={withdrawCoins}>
          WithDraw Coins
        </button>
      );
    }
  };

  // const renderClaim = () => {
  // 	// console.log();
  // };

  return (
    <div className="bg-black text-white min-h-screen pt-4">
      <Head>
        <title>Initial Coin Offering</title>
        <meta name="description" content="Generated by create next app" />
      </Head>

      <div>
        <div>
          <div className="text-center mt-7 flex flex-col justify-center items-center">
            <h1 className=" text-[80px] font-semibold tracking-wider league z-10">
              Initial Coin Offering
            </h1>
            <div className="text-xl font-light mt-2 w-5/12 tracking-widest z-10">
              An Initial Coin Offering (ICO) is a fundraising method used within
              the blockchain and cryptocurrency industry to generate capital for
              new projects and startups. It is a decentralized crowdfunding
              approach that leverages the principles of blockchain technology to
              issue and distribute digital tokens or coins to investors.
            </div>
            <div>{renderWithdraw()}</div>
            <div className="absolute z-0 top-10 opacity-85">
              <img
                src="/backdrop.jpg"
                alt=".."
                className="w-[600px] h-[620px]"
              />
            </div>
          </div>
          {walletConnected ? (
            <div>
              {/* <h1 className={styles.subTitle}>
                Total {utils.formatEther(totalTokensToBeMinted)} tokens Minted
              </h1>
              <h1 className={styles.subTitle}>
                You have minted {utils.formatEther(balanceOfCryptoDevToken)}{" "}
                tokens
              </h1> */}
              {/* {renderClaim()} */}
              {congratulationVisible  ? (<div className="z-10 text-white">Congratulations</div>):(<div>{renderMint()}</div>)}

            </div>
          ) : (
            renderConnectButton()
          )}
        </div>
      </div>

      <footer></footer>
    </div>
  );
}
