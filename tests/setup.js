const { Chain, Account, Asset, Wallet } = require("qtest-js");
const TESTING_PUBLIC_KEY = Wallet.TESTING_PUBLIC_KEY;
const CONTRACT_NAME = "tictactoe";
const GameActivePermission = { actor: CONTRACT_NAME, permission: "active" };
const TOKEN_CONTRACT = "tic.token";

const exponent0 = "10001";
  const modulus0 = "c61c159689a0bddad3b3855e29f996c91d358f8735d653272565957f9b184f4312b6fe1604adacbcbc9af99a8a9cebfeabd3e93fff3b1e5c7e7a95567e1671dd2b09e868dc54763cd3ecac29d0cb1bcf2a5b4ad39455f273a0d91c4adba1ddf8a79e49f9ca48b6c3f8a2280702317c213548d0ee24c2ec2a0fb8ff31196601cb988316dd0bb7830f8702a216e8369167c0a7a22336232a2291a26f1f2811a2ed81e02da627e07315c89ae376f3a7112b73c8661ab64411c99cdc80b77ce373edfd5e17a44a737e4321db373bcf87091ad02a64a09be58b7ad4d8610b58b018bc6c5136150746f2b7d0a83f2832caaafb2b9f30b5e978fe27974d36d2e9334b0eb7c739bda9e212e413ab8b05f4f42ab2d0447b2b152ae02901a3c755bc44ae494f3ee094643c6cc44f0e5a1d7e4220abb62ee595576e94c27e299fe7cb0568b11d638b7a4a8f332c626d704f3d38bf3ae7c2c9f265bac26611df6a7988b15bc8d743bac8f98d6de8fc68d3b6a46a563ffff4f3b58f90fea9fc96223bcf022083562fa69c810641f8d9d4e6ed9e4cfad24f2424d5cbaef058d8fbbd2b44ce59b5f1f2a5ca89f4c0801da6c816611fc6131e9741471bb49bdec6a78ab0559fa4b324f538ad34a0c1ac74a8fee99a7f73b0564312f3473ccd78354b15211d8d8136c31dd2ab1a566c95bcbf2c6e1c1870cb79562e9a9d5e7cabf96e45f37ac3e9c1";
  

let setup = async () => {
  let gameContract = CONTRACT_NAME;
  let orngContract = "orng.wax";
  let orngOracle = "oracle.wax";
  let orngV1Oracle = "oraclev1.wax";
  let tokenContract = TOKEN_CONTRACT;

  let chainName = process.env.CHAIN_NAME || "WAX";
  let chain = await Chain.setupChain(chainName);
  let [issuer, user1, user2, user3, claimWax, user4, feeAccount] = await chain.system.createAccounts(
    ["issuer", "user1.wam", "user2.wam", "user3.wam", "claim.wax", "user4", "fees.wax"],
    "10000.00000000 WAX",
  );
  let eosio = new Account(chain, "eosio");


  gameContract = await chain.system.createAccount(gameContract, "1000.00000000 WAX", 4565215);
  await gameContract.setContract({
    abi: "./build/tictactoe.abi",
    wasm: "./build/tictactoe.wasm",
  });
  await gameContract.addCode("active");

  tokenContract = await chain.system.createAccount(tokenContract, "1000.00000000 WAX", 4565215);
  await tokenContract.setContract({
    abi: "./build/token.abi",
    wasm: "./build/token.wasm",
  });
  await tokenContract.addCode("active");


  // issue token for game
  await tokenContract.contract.action.create({
    issuer: gameContract.name,
    maximum_supply: '1000000.0000 TIC'
  },[getAccountPerm(tokenContract)]);

  await tokenContract.contract.action.issue({
    to: gameContract.name,
    quantity: '1000000.0000 TIC',
    memo: "issue token"
  },[getAccountPerm(gameContract)]);

  let balance = await tokenContract.contract.table.accounts.getRows({
    scope: gameContract.name
  })

  await gameContract.contract.action.init({
    seed: 12345
  }, [getAccountPerm(gameContract)]);

  orngContract = await chain.system.createAccount(orngContract, "1000.00000000 WAX", 4565215);
  await orngContract.setContract({
    abi: 'tests/artifacts/wax.orng.abi',
    wasm: 'tests/artifacts/wax.orng.wasm',
  });
  await orngContract.addCode("active");


  orngOracle = await chain.system.createAccount(orngOracle, "1000.00000000 WAX", 4565215);
  orngV1Oracle = await chain.system.createAccount(orngV1Oracle, "1000.00000000 WAX", 4565215);

  await orngV1Oracle.updateAuth(
    "active", "owner",1,
    [
      {
        key: TESTING_PUBLIC_KEY,
        weight: 1,
      },
    ],
    [
        {
          permission: {
            actor: orngContract.name,
            permission: "eosio.code",
          },
          weight: 1,
        },
      ]
  );

  await orngContract.contract.action.setsigpubkey(
    {
      id: 0,
      exponent: exponent0,
      modulus: modulus0
    },
    [getAccountPerm(orngOracle)]
  );

  await orngContract.contract.action.setchance(
    {
      chance_to_switch: 10,
    },
    [getAccountPerm(orngOracle)]
  );

  return {
    chain,
    gameContract,
    eosio,
    user1,
    user2,
    user3,
    GameActivePermission,
    feeAccount,
    orngOracle,
    orngContract,
    tokenContract
  };
};

let createWAMAccount = async (chain, accountName) => {
  let acc = await chain.system.createAccount(accountName, "20000.00000000 WAX", 4565215);
  return acc;
};

function randomWamAccount() {
  const chars = "abcdefghijklmnopqrstuvwxyz12345.";
  const length = Math.ceil(Math.random() * 5) + 3;
  let name = ".wam";
  for (let i = 0; i < length; i++) {
    let c = Math.floor(Math.random() * chars.length);
    name = chars[c] + name;
  }
  return name;
}
let getAccountPerm = (account) => {
    return {
        actor: account.name,
        permission: "active"
    }
}

function getActivePermission(actors) {
    const permisisons = [];
    for (const actor of actors) {
      let permission = {
        actor: actor.name,
        permission: "active",
      };
      permisisons.push(permission);
    }
    return permisisons;
  }

module.exports = { setup, randomWamAccount, createWAMAccount, getAccountPerm, getActivePermission };
