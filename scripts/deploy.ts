import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Campus = await hre.ethers.getContractFactory("CampusCredits");
  const campus = await Campus.deploy(deployer.address);

  await campus.waitForDeployment();

  console.log("CampusCredits deployed at:", await campus.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
