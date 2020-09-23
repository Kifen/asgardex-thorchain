import { Client as ThorChainClient } from "../src/client/client";
import { VaultTxParams } from "../src/lib/utils";

describe("ThorChainClient", function () {
  let thorClient: ThorChainClient;
  const mnemonic =
    "swear buyer security impulse public stereo peasant correct cross tornado bid discover anchor float venture deal patch property cool wreck eight dwarf december surface";
  const testnetAddress = "cosmos1fnk3lxlks7tdg6x55ynv6vggtnd73ycqsq89sl";

  beforeEach(() => {
    const chainId = "cosmoshub-3";
    const chainUrl = "https://lcd-cosmos-free.cosmostation.io";

    thorClient = new ThorChainClient({
      network: "testnet",
      prefix: "cosmos",
      phrase: mnemonic,
      hdpath: "m/44'/118'/0'/0/0",
      chainId,
      chainUrl,
    });
  });

  it("should get correct address", async () => {
    const address = thorClient.getAddress();
    expect(testnetAddress).toEqual(address);
  });

  /*  it("should get balance", async () => {
    const balance = await thorClient.getBalance(testnetAddress);
    console.log(balance);
    console.log(balance);
  }); */
});
