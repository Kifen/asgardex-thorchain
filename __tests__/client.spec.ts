import { Client as ThorChainClient } from "../src/client/client";

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

    expect(testnetAddress).toEqual(address);
  });
});
