import { increaseTimeTo, duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
import { advanceBlock } from '../helpers/advanceToBlock';
import expectEvent from '../helpers/expectEvent';
import { assertRevert } from '../helpers/assertRevert';

const BaseProxy = artifacts.require("./tokenization/BaseProxy.sol");
const BaseToken = artifacts.require("./tokenization/tokens/BaseToken.sol");
const BalanceModule = artifacts.require("./tokenization/modules/BalanceModule.sol");
const AllowanceModule = artifacts.require("./tokenization/modules/AllowanceModule.sol");
const RegistryModule = artifacts.require("./tokenization/modules/RegistryModule.sol");

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

// ERC20 tests referenced from:
// https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/token/ERC20/ERC20.test.js

contract('ERC20 Proxy Tests', function(accounts) {

    before(async function () {
        // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock();
    });

    const [_, owner, recipient, anotherAccount, ...rest] = accounts;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const WHITELISTED_FOR_MINT = "WHITELISTED_FOR_MINT";

    beforeEach(async function () {
        // Initialize BaseProxy, BaseToken contracts.
        this.token = await BaseToken.new('BaseToken', 'BT', 18, { from: owner });
        this.proxy = await BaseProxy.new(this.token.address, { from: owner });

        this.balanceModule = await BalanceModule.new({ from: owner });
        this.allowanceModule = await AllowanceModule.new({ from: owner });
        this.registryModule = await RegistryModule.new({ from: owner });
        await this.balanceModule.transferOwnership(this.token.address, { from: owner });
        await this.allowanceModule.transferOwnership(this.token.address, { from: owner });
        await this.registryModule.transferOwnership(this.token.address, { from: owner });
        await this.token.setAllowanceModule(this.allowanceModule.address, { from: owner });
        await this.token.setBalanceModule(this.balanceModule.address, { from: owner });
        await this.token.setRegistryModule(this.registryModule.address, { from: owner });

        // Enable proxy on BaseToken side
        await this.token.setProxy(this.proxy.address, { from: owner });

        await this.token.setKeyDataRecord(
            owner,
            WHITELISTED_FOR_MINT,
            0,
            "",
            ZERO_ADDRESS,
            true,
            owner,
            { from: owner }
        );

        // Mint some tokens for owner
        await this.token.mint(owner, 100, { from: owner });
    });

    describe('total supply', function () {
        it('returns the total amount of tokens', async function () {
            (await this.proxy.totalSupply()).should.be.bignumber.equal(100);
        });
    });
    
    describe('balanceOf', function () {
        describe('when the requested account has no tokens', function () {
            it('returns zero', async function () {
                (await this.proxy.balanceOf(anotherAccount)).should.be.bignumber.equal(0);
            });
        });
        describe('when the requested account has some tokens', function () {
            it('returns the total amount of tokens', async function () {
                (await this.proxy.balanceOf(owner)).should.be.bignumber.equal(100);
            });
        });
    });

    describe('transfer', function () {
        describe('when the recipient is not the zero address', function () {
            const to = recipient;

            describe('when the sender does not have enough balance', function () {
                const amount = 101;

                it('reverts', async function () {
                    await assertRevert(this.proxy.transfer(to, amount, { from: owner }));
                });
            });
    
            describe('when the sender has enough balance', function () {
                const amount = 100;

                it('transfers the requested amount', async function () {
                    await this.proxy.transfer(to, amount, { from: owner });

                    (await this.proxy.balanceOf(owner)).should.be.bignumber.equal(0);

                    (await this.proxy.balanceOf(to)).should.be.bignumber.equal(amount);
                });

                it('emits a transfer event', async function () {
                    const { logs } = await this.proxy.transfer(to, amount, { from: owner });

                    const event = expectEvent.inLogs(logs, 'Transfer', {
                        from: owner,
                        to: to,
                    });

                    event.args.value.should.be.bignumber.equal(amount);
                });
            });
        });
    
        describe('when the recipient is the zero address', function () {
            const to = ZERO_ADDRESS;

            it('reverts', async function () {
                await assertRevert(this.proxy.transfer(to, 100, { from: owner }));
            });
        });
    });

    describe('approve', function () {
        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            describe('when the sender has enough balance', function () {
                const amount = 100;

                it('emits an approval event', async function () {
                    const { logs } = await this.proxy.approve(spender, amount, { from: owner });

                    logs.length.should.equal(1);
                    logs[0].event.should.equal('Approval');
                    logs[0].args.owner.should.equal(owner);
                    logs[0].args.spender.should.equal(spender);
                    logs[0].args.value.should.be.bignumber.equal(amount);
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.proxy.approve(spender, amount, { from: owner });

                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await this.proxy.approve(spender, 1, { from: owner });
                    });

                    it('approves the requested amount and replaces the previous one', async function () {
                        await this.proxy.approve(spender, amount, { from: owner });

                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(amount);
                    });
                });
            });

            describe('when the sender does not have enough balance', function () {
                const amount = 101;

                it('emits an approval event', async function () {
                    const { logs } = await this.proxy.approve(spender, amount, { from: owner });

                    logs.length.should.equal(1);
                    logs[0].event.should.equal('Approval');
                    logs[0].args.owner.should.equal(owner);
                    logs[0].args.spender.should.equal(spender);
                    logs[0].args.value.should.be.bignumber.equal(amount);
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.proxy.approve(spender, amount, { from: owner });

                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await this.proxy.approve(spender, 1, { from: owner });
                    });

                    it('approves the requested amount and replaces the previous one', async function () {
                        await this.proxy.approve(spender, amount, { from: owner });

                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(amount);
                    });
                });
            });
        });

        describe('when the spender is the zero address', function () {
            const amount = 100;
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await assertRevert(this.proxy.approve(spender, amount, { from: owner }));
            });
        });
    });
    
    describe('transfer from', function () {
        const spender = recipient;
    
        describe('when the recipient is not the zero address', function () {
            const to = anotherAccount;

            describe('when the spender has enough approved balance', function () {
                beforeEach(async function () {
                    await this.proxy.approve(spender, 100, { from: owner });
                });

                describe('when the owner has enough balance', function () {
                    const amount = 100;

                    it('transfers the requested amount', async function () {
                        await this.proxy.transferFrom(owner, to, amount, { from: spender });

                        (await this.proxy.balanceOf(owner)).should.be.bignumber.equal(0);

                        (await this.proxy.balanceOf(to)).should.be.bignumber.equal(amount);
                    });

                    it('decreases the spender allowance', async function () {
                        await this.proxy.transferFrom(owner, to, amount, { from: spender });

                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(0);
                    });

                    it('emits a transfer event', async function () {
                        const { logs } = await this.proxy.transferFrom(owner, to, amount, { from: spender });

                        logs.length.should.equal(1);
                        logs[0].event.should.equal('Transfer');
                        logs[0].args.from.should.equal(owner);
                        logs[0].args.to.should.equal(to);
                        logs[0].args.value.should.be.bignumber.equal(amount);
                    });
                });

                describe('when the owner does not have enough balance', function () {
                    const amount = 101;

                    it('reverts', async function () {
                        await assertRevert(this.proxy.transferFrom(owner, to, amount, { from: spender }));
                    });
                });
            });

            describe('when the spender does not have enough approved balance', function () {
                beforeEach(async function () {
                    await this.proxy.approve(spender, 99, { from: owner });
                });

                describe('when the owner has enough balance', function () {
                    const amount = 100;

                    it('reverts', async function () {
                        await assertRevert(this.proxy.transferFrom(owner, to, amount, { from: spender }));
                    });
                });

                describe('when the owner does not have enough balance', function () {
                    const amount = 101;

                    it('reverts', async function () {
                        await assertRevert(this.proxy.transferFrom(owner, to, amount, { from: spender }));
                    });
                });
            });
        });
    
        describe('when the recipient is the zero address', function () {
            const amount = 100;
            const to = ZERO_ADDRESS;

            beforeEach(async function () {
                await this.proxy.approve(spender, amount, { from: owner });
            });

            it('reverts', async function () {
                await assertRevert(this.proxy.transferFrom(owner, to, amount, { from: spender }));
            });
        });
    });
    
    describe('decrease approval', function () {
        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            function shouldDecreaseApproval (amount) {
                describe('when the spender had an approved amount', function () {
                    const approvedAmount = amount;

                    beforeEach(async function () {
                        ({ logs: this.logs } = await this.proxy.approve(spender, approvedAmount, { from: owner }));
                    });

                    it('emits an approval event', async function () {
                        const { logs } = await this.proxy.decreaseApproval(spender, approvedAmount, { from: owner });

                        logs.length.should.equal(1);
                        logs[0].event.should.equal('Approval');
                        logs[0].args.owner.should.equal(owner);
                        logs[0].args.spender.should.equal(spender);
                        logs[0].args.value.should.be.bignumber.equal(0);
                    });

                    it('decreases the spender allowance subtracting the requested amount', async function () {
                        await this.proxy.decreaseApproval(spender, approvedAmount - 1, { from: owner });

                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(1);
                    });

                    it('sets the allowance to zero when all allowance is removed', async function () {
                        await this.proxy.decreaseApproval(spender, approvedAmount, { from: owner });
                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(0);
                    });
                });
            }

            describe('when the sender has enough balance', function () {
                const amount = 100;

                shouldDecreaseApproval(amount);
            });

            describe('when the sender does not have enough balance', function () {
                const amount = 101;

                shouldDecreaseApproval(amount);
            });
        });

        describe('when the spender is the zero address', function () {
            const amount = 100;
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await assertRevert(this.proxy.decreaseApproval(spender, amount, { from: owner }));
            });
        });
    });
    
    describe('increase approval', function () {
        const amount = 100;
    
        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            describe('when the sender has enough balance', function () {
                it('emits an approval event', async function () {
                    const { logs } = await this.proxy.increaseApproval(spender, amount, { from: owner });

                    logs.length.should.equal(1);
                    logs[0].event.should.equal('Approval');
                    logs[0].args.owner.should.equal(owner);
                    logs[0].args.spender.should.equal(spender);
                    logs[0].args.value.should.be.bignumber.equal(amount);
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.proxy.increaseApproval(spender, amount, { from: owner });

                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await this.proxy.approve(spender, 1, { from: owner });
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        await this.proxy.increaseApproval(spender, amount, { from: owner });

                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(amount + 1);
                    });
                });
            });

            describe('when the sender does not have enough balance', function () {
                const amount = 101;

                it('emits an approval event', async function () {
                    const { logs } = await this.proxy.increaseApproval(spender, amount, { from: owner });

                    logs.length.should.equal(1);
                    logs[0].event.should.equal('Approval');
                    logs[0].args.owner.should.equal(owner);
                    logs[0].args.spender.should.equal(spender);
                    logs[0].args.value.should.be.bignumber.equal(amount);
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.proxy.increaseApproval(spender, amount, { from: owner });

                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await this.proxy.approve(spender, 1, { from: owner });
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        await this.proxy.increaseApproval(spender, amount, { from: owner });

                        (await this.proxy.allowance(owner, spender)).should.be.bignumber.equal(amount + 1);
                    });
                });
            });
        });
    
        describe('when the spender is the zero address', function () {
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await assertRevert(this.proxy.increaseApproval(spender, amount, { from: owner }));
            });
        });
    });    
});