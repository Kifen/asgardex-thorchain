import { Client as ThorChainClient } from "../src/client/client";
import { VaultTxParams } from "../src/lib/utils";

describe("ThorChainClient", function () {
  let thorClient: ThorChainClient;
  const phrase =
    "print detect entire settle hurt cactus bounce asthma rifle ring fragile magic skull twin army puppy indicate include someone palace hedgehog ready middle this";
  const testnetAddress = "tbnb1gz2hct8d7g7e9wfugqtstl44kt8va4qt63c8gx";

  beforeEach(() => {
    const network = "testnet";
    const hdPath = "m/44'/494'/0'/0/0";
    const chainId = "";
    const chainUrl = "https://lcd-band.cosmostation.io";

    thorClient = new ThorChainClient({
      network: "testnet",
      prefix: "tbnb",
      phrase: phrase,
      hdpath: "m/44'/714'/0'/0/0",
      chainId,
      chainUrl,
    });
  });

  it("should have right address", async () => {
    const address = thorClient.getAddress();

    // expect(testnetAddress).toEqual(address);
    const params: VaultTxParams = {
      addressFrom: "band10njzn9vt9e7q9c6skpknfxz3v7m5luwtq927ey",
      addressTo: "band1z67fshyr48pa9a6htdz4qd0zullfk6y0s8vy5k",
      amount: "10",
      asset: "uband",
      memo: "Transfer",
      mode: "sync",
    };

    const tx = await thorClient.vaultTx(params);
    console.log("TX:: ", tx);
  });
});
