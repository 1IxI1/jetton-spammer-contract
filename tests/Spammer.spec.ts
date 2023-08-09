import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { Spammer } from '../wrappers/Spammer';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';

describe('Spammer', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Spammer');
    });

    let blockchain: Blockchain;
    let spammer: SandboxContract<Spammer>;
    let deployer: SandboxContract<TreasuryContract>;
    let jwalletAddress: Address;
    const mintAmount = 100_000n;

    beforeAll(async () => {
        const jminter_code = Cell.fromBoc(
            Buffer.from(
                'b5ee9c7241020e010002db000114ff00f4a413f4bcf2c80b01020162050202037a600403001faf16f6a2687d007d206a6a183faa9040007dadbcf6a2687d007d206a6a183618fc1400b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064fc80383a6465816503e5ffe4e8400202cb07060099a17c142201b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064907c80383a6465816503e5ffe4e864400c00e58280e78b2801fd012cbba801e5b5e66664b8fd804004c5d0831c02497c0f8007434c0c05c6c2497c0f83e903e900c7e800c5c75c87e800c7e800c1cea6d0000b4c7c04074cfc07b51343e803e9035350c09a084059d2c282eb8c089a0841ef765f7aeb8c089a0840b1dae5ceeb8c08d0dcdc8e08412101993eea0d0b090800928e1b335035c705f2e04c01fa40304003c85004fa0258cf16ccccc9ed54e0350282105773d1f5ba8e195124c705f2e04d01d4304300c85004fa0258cf16ccccc9ed54e05f05840ff2f001a6365f03048208989680a015bcf2e04b03fa40d3003095c821cf16c9916de2c8801801cb055003cf1670fa027001cb6a8210d173540001cb1f500301cb3f22fa4430c000966c227001cb01e30df400c98040fb000a0068f828430470542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d012cf1601c236373702fa00fa40f82854120670542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d05006c705f2e04a12a1034545c85004fa0258cf16ccccc9ed5401fa403020d70b01c300915be30d0c0044c8801001cb0501cf1670fa027001cb6a8210d53276db01cb1f0101cb3fc98042fb0000a43637375146c705f2e04901fa40fa00fa00fa00305301bcf2e04b7020c88210178d451901cb1f500701cb3f24fa0216cb01f828cf1658fa0214cb00c9544444f01212a05520c85004fa0258cf16ccccc9ed5422022599',
                'hex'
            )
        )[0];
        const jwallet_code = Cell.fromBoc(
            Buffer.from(
                'b5ee9c7241020f010003d4000114ff00f4a413f4bcf2c80b010201620302001ba0f605da89a1f401f481f481a8610202ce050400114fa4430c000f2e14d804b3420c700925f04e001d0d3030171b08e85135f03db3ce0fa40fa4031fa003171d721fa0031fa003073a9b40002d31f012082100f8a7ea5ba8e85303459db3ce0208210178d4519ba8e8630444403db3ce035248210595f07bcba80e0c090602d48e843459db3ce06c22ed44d0fa00fa40fa40d43010235f032382106d8e5e3cba8e37335222c705f2e2c1820898968070fb02c8801001cb0558cf1670fa027001cb6a8210d53276db01cb1f01d33f013101cb3fc9810082fb00e0038210768a50b2bae3025f03840ff2f0080700965222c705f2e2c1d33f0101fa40fa00f40430c8801801cb055003cf1670fa0270c882100f8a7ea501cb1f500501cb3f58fa0224cf165004cf16f40070fa02ca00c97158cb6accc98040fb0000e6ed44d0fa00fa40fa40d43007d33f0101fa00fa40305151a15249c705f2e2c127c2fff2e2c2058209ab3f00a016bcf2e2c3c882107bdd97de01cb1f500501cb3f5003fa0222cf1601cf16c9c8801801cb0523cf1670fa02017158cb6accc98040fb004013c85004fa0258cf1601cf16ccc9ed5402f6ed44d0fa00fa40fa40d43008d33f0101fa005151a005fa40fa40535bc70554736d70542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d0500dc7051cb1f2e2c30afa0051a8a12195104a395f04e30d048208989680b60972fb0225d70b01c30003c200130b0a007cb08e26c8801001cb055005cf1670fa027001cb6a8210d53276db01cb1f500301cb3fc9810082fb0012923333e25003c85004fa0258cf1601cf16ccc9ed540072521aa018a1c882107362d09c01cb1f2401cb3f5003fa0201cf165008cf16c9c8801001cb0524cf165006fa0250057158cb6accc971fb00103501f603d33f0101fa00fa4021f002ed44d0fa00fa40fa40d4305136a1522ac705f2e2c128c2fff2e2c254344270542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c920f9007074c8cb02ca07cbffc9d004fa40f40431fa0020d749c200f2e2c4c88210178d451901cb1f500a01cb3f5008fa020d00a223cf1601cf1626fa025007cf16c9c8801801cb055004cf1670fa024063775003cb6bcccc2391729171e25008a813a0820a43d580a014bcf2e2c504c98040fb004013c85004fa0258cf1601cf16ccc9ed54008a8020d721ed44d0fa00fa40fa40d43004d31f018200fff0218210178d4519ba0282107bdd97deba12b1f2f4d33f0130fa003013a05023c85004fa0258cf1601cf16ccc9ed541c9f642f',
                'hex'
            )
        )[0];

        blockchain = await Blockchain.create();

        spammer = blockchain.openContract(Spammer.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const jminter = blockchain.openContract(
            JettonMinter.createFromConfig(
                {
                    admin: deployer.address,
                    content: Cell.EMPTY,
                    wallet_code: jwallet_code,
                },
                jminter_code
            )
        );

        const mintResult = await jminter.sendMint(deployer.getSender(), spammer.address, mintAmount, 0n, toNano('1'));
        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jminter.address,
            success: true,
        });

        jwalletAddress = await jminter.getWalletAddress(spammer.address);
        const deployResult = await spammer.sendDeploy(deployer.getSender(), jwalletAddress, toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: spammer.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {});

    it('should start spamming', async () => {
        const spamResult = await spammer.sendStart(deployer.getSender(), toNano('10'));
        expect(spamResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: spammer.address,
            success: true,
            outMessagesCount: 1,
        });
        expect(spamResult.transactions).toHaveTransaction({
            from: spammer.address,
            to: jwalletAddress,
            success: true,
        });

        let transfers = 0;
        expect(spamResult.transactions).not.toHaveTransaction({
            // just to count transfers
            from: jwalletAddress,
            success: true,
            op: 0x178d4519, // internal_transfer
            value: () => {
                transfers++;
                return false;
            },
        });
        console.log('Total transfers', transfers);
        const jwallet = blockchain.openContract(JettonWallet.createFromAddress(jwalletAddress));
        const jbalance = await jwallet.getJettonBalance();
        expect(jbalance).toBe(mintAmount - BigInt(transfers));
    });
});
