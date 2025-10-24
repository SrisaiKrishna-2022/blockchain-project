import { ethers } from "ethers";
import CampusCreditsAbiJson from "../../artifacts/contracts/CampusCredits.sol/CampusCredits.json";
const CampusCreditsAbi = (CampusCreditsAbiJson as any).abi;

export const CONTRACT_ADDRESS = "0x..."; // set after deployment

export function getProvider() {
  if ((window as any).ethereum) {
    return new ethers.providers.Web3Provider((window as any).ethereum);
  }
  return ethers.getDefaultProvider();
}

export async function requestAccount(): Promise<string[]> {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("No web3 provider");
  return provider.request({ method: "eth_requestAccounts" });
}

export function getContract(signerOrProvider?: ethers.Signer | ethers.providers.Provider) {
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CampusCreditsAbi, provider);
}

export async function mintCredits(to: string, amount: number, reason = "reward") {
  await requestAccount();
  const provider = getProvider();
  const signer = provider.getSigner();
  const contract = getContract(signer);
  const tx = await contract.mintCredits(to, ethers.BigNumber.from(amount), reason);
  return tx;
}

export function listenForCreditsMinted() {
  const contract = getContract(getProvider());
  contract.on("CreditsMinted", (to, amount, reason, timestamp, event) => {
    console.log("CreditsMinted", { to, amount: amount.toNumber(), reason, timestamp: timestamp.toNumber() });
  });
}
